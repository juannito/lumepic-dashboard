import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getProfileConfigs } from "./lumepic-api";
import { parseImageFile } from "./image-size-parser";
import { getDb } from "./db";

export interface WatcherConfig {
  watchFolderPath: string;
  targetAlbumId: string;
  isActive: boolean;
  profileId: string;
  uploadConcurrency: number;
}

export interface HistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  size: number;
  albumId: string;
  uploadedPhotographId?: string;
  status: "success" | "failed" | "deleted";
  error: string | null;
  durationMs?: number;
  attempts?: number;
  retryable?: boolean;
  lastAttemptAt?: string;
  nextRetryAt?: string | null;
  deletedAt?: string;
  deletedPhotographId?: string;
}

const DEFAULT_UPLOAD_CONCURRENCY = 1;
const MAX_UPLOAD_CONCURRENCY = 10;

class LumepicWatcher {
  private config: WatcherConfig = {
    watchFolderPath: path.join(process.env.HOME || "", "LumepicWatchFolder"),
    targetAlbumId: "",
    isActive: false,
    profileId: "profile-1",
    uploadConcurrency: DEFAULT_UPLOAD_CONCURRENCY,
  };
  private history: HistoryItem[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isScanning = false;
  private historyWriteQueue: Promise<void> = Promise.resolve();

  constructor() {
    // Load config and history synchronously or asynchronously
    this.loadData();
  }

  private async loadData() {
    try {
      const db = await getDb();
      const rows = await db.all("SELECT key, value FROM watcher_config");
      const loadedConfig: Record<string, any> = {};
      for (const row of rows) {
        if (row.value) {
          loadedConfig[row.key] = JSON.parse(row.value);
        }
      }

      if (Object.keys(loadedConfig).length > 0) {
        this.config = { ...this.config, ...loadedConfig };
        this.config.uploadConcurrency = this.normalizeUploadConcurrency(this.config.uploadConcurrency);
      } else {
        await this.saveConfig();
      }
    } catch (e) {
      console.error("Error loading watcher config from SQLite:", e);
    }

    try {
      this.history = await this.readHistoryFile();
    } catch (e) {
      console.error("Error loading watcher history from SQLite:", e);
    }

    // Auto-start if config says it should be active
    if (this.config.isActive && !this.hasTargetAlbum()) {
      console.warn("Lumepic Watcher cannot start without a target album. Disabling watcher.");
      this.config.isActive = false;
      await this.saveConfig();
    } else if (this.config.isActive) {
      this.startLoop();
    }
  }

  public async getConfig(): Promise<WatcherConfig> {
    if (this.config.isActive && !this.hasTargetAlbum()) {
      this.config.isActive = false;
      this.stopLoop();
      await this.saveConfig();
    }
    return this.config;
  }

  public async getHistory(): Promise<HistoryItem[]> {
    await this.refreshHistoryFromDisk();
    return this.history;
  }

  public async markPhotographDeleted(photographId: string): Promise<HistoryItem | null> {
    await this.refreshHistoryFromDisk();
    const item = this.history.find((entry) => (entry.uploadedPhotographId || entry.id) === photographId);
    if (!item) return null;

    item.status = "deleted";
    item.error = null;
    item.retryable = false;
    item.nextRetryAt = null;
    item.deletedAt = new Date().toISOString();
    item.deletedPhotographId = photographId;
    await this.saveHistory();
    return item;
  }

  public async updateConfig(newConfig: Partial<WatcherConfig>): Promise<WatcherConfig> {
    const wasActive = this.config.isActive;
    this.config = { ...this.config, ...newConfig };
    this.config.uploadConcurrency = this.normalizeUploadConcurrency(this.config.uploadConcurrency);
    if (this.config.isActive && !this.hasTargetAlbum()) {
      this.config.isActive = false;
    }
    await this.saveConfig();

    if (this.config.isActive && !wasActive) {
      this.startLoop();
    } else if (!this.config.isActive && wasActive) {
      this.stopLoop();
    }

    return this.config;
  }

  private hasTargetAlbum() {
    return Boolean(this.config.targetAlbumId && this.config.targetAlbumId.trim());
  }

  private normalizeUploadConcurrency(value: unknown) {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) return DEFAULT_UPLOAD_CONCURRENCY;
    return Math.min(MAX_UPLOAD_CONCURRENCY, Math.max(1, Math.floor(numericValue)));
  }

  private isRetryableError(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("no se ha seleccionado") || normalized.includes("no photographer token")) {
      return false;
    }
    if (normalized.includes("lumepic api error (4") && !normalized.includes("lumepic api error (429")) {
      return false;
    }
    return true;
  }

  private nextRetryDelayMs(attempts: number) {
    const delayMinutes = Math.min(2 ** Math.max(attempts - 1, 0), 30);
    return delayMinutes * 60 * 1000;
  }

  private upsertHistory(item: HistoryItem, existingId?: string) {
    if (existingId) {
      const index = this.history.findIndex((entry) => entry.id === existingId);
      if (index >= 0) {
        this.history[index] = { ...this.history[index], ...item };
        return;
      }
    }
    this.history.unshift(item);
  }

  private async saveConfig() {
    try {
      const db = await getDb();
      await db.exec("BEGIN TRANSACTION;");
      try {
        for (const [key, value] of Object.entries(this.config)) {
          await db.run(
            "INSERT OR REPLACE INTO watcher_config (key, value) VALUES (?, ?)",
            key,
            JSON.stringify(value)
          );
        }
        await db.exec("COMMIT;");
      } catch (err) {
        await db.exec("ROLLBACK;");
        throw err;
      }
    } catch (e) {
      console.error("Error saving watcher config to SQLite:", e);
    }
  }

  private async readHistoryFile(): Promise<HistoryItem[]> {
    try {
      const db = await getDb();
      const rows = await db.all("SELECT data FROM watcher_history");
      const items = rows.map((row) => JSON.parse(row.data)).filter(Boolean);
      return this.sortHistory(items);
    } catch (e) {
      console.error("Error reading history from SQLite:", e);
      return [];
    }
  }

  private sortHistory(items: HistoryItem[]) {
    return items.sort((a, b) => {
      const aTime = new Date(a.timestamp || a.deletedAt || 0).getTime();
      const bTime = new Date(b.timestamp || b.deletedAt || 0).getTime();
      return bTime - aTime;
    });
  }

  private mergeHistoryItem(current: HistoryItem | undefined, incoming: HistoryItem) {
    if (!current) return incoming;

    if (current.status === "deleted" || incoming.status === "deleted") {
      const deletedEntry = current.status === "deleted" ? current : incoming;
      return {
        ...current,
        ...incoming,
        status: "deleted" as const,
        error: null,
        retryable: false,
        nextRetryAt: null,
        deletedAt: deletedEntry.deletedAt,
        deletedPhotographId: deletedEntry.deletedPhotographId || deletedEntry.uploadedPhotographId || deletedEntry.id,
      };
    }

    return { ...current, ...incoming };
  }

  private async refreshHistoryFromDisk(preferMemory = false) {
    try {
      const diskHistory = await this.readHistoryFile();
      const merged = new Map<string, HistoryItem>();
      const first = preferMemory ? diskHistory : this.history;
      const second = preferMemory ? this.history : diskHistory;
      for (const item of first) merged.set(item.id, item);
      for (const item of second) {
        merged.set(item.id, this.mergeHistoryItem(merged.get(item.id), item));
      }
      this.history = this.sortHistory([...merged.values()]);
    } catch (e) {
      console.error("Error refreshing watcher history:", e);
    }
  }

  private async saveHistory() {
    const write = async () => {
      try {
        await this.refreshHistoryFromDisk(true);
        // Keep history capped at 100 items
        if (this.history.length > 100) {
          this.history = this.sortHistory(this.history).slice(0, 100);
        }
        
        const db = await getDb();
        await db.exec("BEGIN TRANSACTION;");
        try {
          await db.run("DELETE FROM watcher_history;");
          for (const item of this.history) {
            await db.run(
              "INSERT INTO watcher_history (id, data) VALUES (?, ?)",
              item.id,
              JSON.stringify(item)
            );
          }
          await db.exec("COMMIT;");
        } catch (err) {
          await db.exec("ROLLBACK;");
          throw err;
        }
      } catch (e) {
        console.error("Error saving watcher history to SQLite:", e);
      }
    };

    this.historyWriteQueue = this.historyWriteQueue.then(write, write);
    await this.historyWriteQueue;
  }

  private async processWithConcurrency<T>(items: T[], worker: (item: T) => Promise<void>) {
    const concurrency = this.normalizeUploadConcurrency(this.config.uploadConcurrency);
    let nextIndex = 0;

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await worker(item);
      }
    });

    await Promise.all(workers);
  }

  private startLoop() {
    if (!this.hasTargetAlbum()) {
      this.config.isActive = false;
      void this.saveConfig();
      console.warn("Lumepic Watcher was not started because no target album is selected.");
      return;
    }
    if (this.intervalId) return;
    console.log(`Starting Lumepic Watcher loop for folder: ${this.config.watchFolderPath}`);
    // Check every 5 seconds
    this.intervalId = setInterval(() => void this.scanFolder(), 5000);
    // Trigger immediate scan
    void this.scanFolder();
  }

  private stopLoop() {
    if (!this.intervalId) return;
    console.log("Stopping Lumepic Watcher loop");
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  public async forceScan(): Promise<void> {
    await this.scanFolder();
  }

  private async scanFolder() {
    if (this.isScanning) return;
    if (!this.hasTargetAlbum()) {
      if (this.config.isActive) {
        this.config.isActive = false;
        this.stopLoop();
        await this.saveConfig();
      }
      console.warn("Lumepic Watcher skipped scan because no target album is selected.");
      return;
    }
    this.isScanning = true;

    try {
      const folderPath = this.config.watchFolderPath;
      if (!existsSync(folderPath)) {
        // Create directory if it doesn't exist
        await fs.mkdir(folderPath, { recursive: true });
        console.log(`Created watch directory: ${folderPath}`);
      }

      // Ensure .processed and .failed folders exist inside watchFolderPath
      const processedDir = path.join(folderPath, ".processed");
      const failedDir = path.join(folderPath, ".failed");
      if (!existsSync(processedDir)) {
        await fs.mkdir(processedDir, { recursive: true });
      }
      if (!existsSync(failedDir)) {
        await fs.mkdir(failedDir, { recursive: true });
      }

      await this.retryFailedFiles(failedDir, processedDir);

      // Read files
      const items = await fs.readdir(folderPath, { withFileTypes: true });
      const imageExtensions = [".jpg", ".jpeg", ".png"];

      const filesToProcess = items.filter(
        (item) =>
          item.isFile() &&
          imageExtensions.includes(path.extname(item.name).toLowerCase()) &&
          !item.name.startsWith(".")
      );

      await this.processWithConcurrency(filesToProcess, (fileItem) =>
        this.processFile(fileItem.name, folderPath, processedDir, failedDir)
      );
    } catch (error) {
      console.error("Error during watch folder scan:", error);
    } finally {
      this.isScanning = false;
    }
  }

  private async processFile(
    filename: string,
    watchDir: string,
    processedDir: string,
    failedDir: string,
    retry?: { historyId: string; attempt: number }
  ) {
    const startedAt = Date.now();
    const srcPath = path.join(watchDir, filename);
    let destPath = path.join(processedDir, filename);
    const attempt = retry?.attempt || 1;

    // If target album is not defined, fail immediately and move to .failed folder
    if (!this.config.targetAlbumId || this.config.targetAlbumId.trim() === "") {
      const errMsg = "No se ha seleccionado ningún álbum de destino en la configuración.";
      console.error(`[Watcher] Failed to upload ${filename}: ${errMsg}`);
      
      try {
        let failPath = path.join(failedDir, filename);
        if (existsSync(failPath)) {
          const ext = path.extname(filename);
          const base = path.basename(filename, ext);
          failPath = path.join(failedDir, `${base}_${Date.now()}${ext}`);
        }
        await fs.rename(srcPath, failPath);
      } catch (renameErr) {
        console.error(`[Watcher] Failed to move ${filename} to .failed directory:`, renameErr);
      }

      this.upsertHistory({
        id: "error-" + Date.now(),
        filename,
        timestamp: new Date().toISOString(),
        size: 0,
        albumId: "",
        status: "failed",
        error: errMsg,
        durationMs: Date.now() - startedAt,
        attempts: attempt,
        retryable: false,
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt: null,
      }, retry?.historyId);
      await this.saveHistory();
      return;
    }

    // If file with same name exists in .processed, append timestamp to avoid overwriting
    if (existsSync(destPath)) {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      destPath = path.join(processedDir, `${base}_${Date.now()}${ext}`);
    }

    try {
      console.log(`[Watcher] Found new photo to process: ${filename}`);

      // Step 1: Move file to .processed directory immediately to prevent double processing
      await fs.rename(srcPath, destPath);

      // Step 2: Extract file details
      const stats = await fs.stat(destPath);
      const dimensions = await parseImageFile(destPath);
      const ext = path.extname(filename).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

      // Step 3: Get token for profile
      const profiles = getProfileConfigs();
      // Find matching profile by ID, or fallback to the first profile with a token
      const profile = profiles.find((p) => p.id === this.config.profileId) || profiles[0];
      if (!profile || !profile.token) {
        throw new Error("No photographer token configured for selected profile.");
      }

      const token = profile.token.replace(/^Bearer\s+/i, "").trim();

      // Step 4: Call Lumepic batch-upload-url API
      const albumId = this.config.targetAlbumId;
      const apiBase = process.env.LUMEPIC_API_BASE_URL || "https://api.lumepic.com";
      const uploadUrlRequest = `${apiBase}/photographs/batch-upload-url?albumId=${albumId}`;

      const payload = {
        photographs: [
          {
            albumId: albumId,
            type: mimeType,
            size: stats.size,
            originalFileName: filename,
            width: dimensions.width,
            height: dimensions.height,
            takenDate: stats.mtime.toISOString(),
            extraInfo: {
              Make: "Lumepic Watcher",
              Model: "Local Watch Uploader",
              ProcessedAt: new Date().toISOString(),
            },
          },
        ],
      };

      console.log(`[Watcher] Creating photograph record in Lumepic for: ${filename}`);
      const res = await fetch(uploadUrlRequest, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Lumepic API error (${res.status}): ${errorText}`);
      }

      const responseJson = await res.json() as any;
      if (!Array.isArray(responseJson) || responseJson.length === 0) {
        throw new Error("Invalid response format from Lumepic API.");
      }

      const { uploadUrl, photograph } = responseJson[0];
      const photoId = photograph.id;

      // Step 5: Upload binary data to S3
      console.log(`[Watcher] Uploading binary to S3 for: ${filename}`);
      const fileData = await fs.readFile(destPath);
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
        },
        body: fileData,
      });

      if (!s3Res.ok) {
        const s3Error = await s3Res.text();
        throw new Error(`S3 upload error (${s3Res.status}): ${s3Error}`);
      }

      console.log(`[Watcher] Successfully uploaded: ${filename} (ID: ${photoId})`);

      this.upsertHistory({
        id: photoId,
        filename,
        timestamp: new Date().toISOString(),
        size: stats.size,
        albumId,
        uploadedPhotographId: photoId,
        status: "success",
        error: null,
        durationMs: Date.now() - startedAt,
        attempts: attempt,
        retryable: false,
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt: null,
      }, retry?.historyId);
      await this.saveHistory();
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Watcher] Failed to upload ${filename}:`, errMsg);
      const retryable = this.isRetryableError(errMsg);
      const nextRetryAt = retryable
        ? new Date(Date.now() + this.nextRetryDelayMs(attempt)).toISOString()
        : null;

      // Move file to .failed directory
      try {
        if (existsSync(destPath)) {
          let failPath = path.join(failedDir, filename);
          if (existsSync(failPath)) {
            const ext = path.extname(filename);
            const base = path.basename(filename, ext);
            failPath = path.join(failedDir, `${base}_${Date.now()}${ext}`);
          }
          await fs.rename(destPath, failPath);
        } else if (existsSync(srcPath)) {
          let failPath = path.join(failedDir, filename);
          if (existsSync(failPath)) {
            const ext = path.extname(filename);
            const base = path.basename(filename, ext);
            failPath = path.join(failedDir, `${base}_${Date.now()}${ext}`);
          }
          await fs.rename(srcPath, failPath);
        }
      } catch (renameErr) {
        console.error(`[Watcher] Failed to move ${filename} to .failed directory:`, renameErr);
      }

      this.upsertHistory({
        id: retry?.historyId || "error-" + Date.now(),
        filename,
        timestamp: new Date().toISOString(),
        size: 0,
        albumId: this.config.targetAlbumId,
        status: "failed",
        error: errMsg,
        durationMs: Date.now() - startedAt,
        attempts: attempt,
        retryable,
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt,
      }, retry?.historyId);
      await this.saveHistory();
    }
  }

  private async retryFailedFiles(failedDir: string, processedDir: string) {
    const now = Date.now();
    const retryCandidates = this.history.filter((item) => {
      if (item.status !== "failed") return false;
      if (!item.retryable && !item.error?.includes("No se ha seleccionado ningún álbum")) return false;
      if (!item.nextRetryAt) return true;
      return new Date(item.nextRetryAt).getTime() <= now;
    });

    const seen = new Set<string>();
    const retryItems = retryCandidates.filter((item) => {
      if (seen.has(item.filename)) return false;
      seen.add(item.filename);
      return true;
    });

    await this.processWithConcurrency(retryItems, async (item) => {
      const retryPath = path.join(failedDir, item.filename);
      if (!existsSync(retryPath)) {
        item.retryable = false;
        item.nextRetryAt = null;
        item.error = `${item.error || "No se pudo reintentar."} Archivo no encontrado en .failed.`;
        await this.saveHistory();
        return;
      }

      await this.processFile(item.filename, failedDir, processedDir, failedDir, {
        historyId: item.id,
        attempt: (item.attempts || 0) + 1,
      });
    });

    const failedItems = await fs.readdir(failedDir, { withFileTypes: true });
    const imageExtensions = [".jpg", ".jpeg", ".png"];
    const knownFilenames = new Set(this.history.map((item) => item.filename));
    const unknownFailedItems = failedItems.filter((fileItem) => {
      return (
        fileItem.isFile() &&
        imageExtensions.includes(path.extname(fileItem.name).toLowerCase()) &&
        !knownFilenames.has(fileItem.name)
      );
    });

    await this.processWithConcurrency(unknownFailedItems, (fileItem) =>
      this.processFile(fileItem.name, failedDir, processedDir, failedDir)
    );
  }

  public getRunningStatus(): boolean {
    return this.intervalId !== null;
  }
}

// Export singleton
export const lumepicWatcher = new LumepicWatcher();
