import type { NextApiRequest, NextApiResponse } from "next";
import { execFile } from "child_process";
import { promisify } from "util";
import { lumepicWatcher } from "@/lib/lumepic-watcher";
import {
  getProfileConfigs,
  lumepicFetch,
  fetchAllAlbums,
  getLumepicAuthHeaders,
  LUMEPIC_API_BASE_URL,
} from "@/lib/lumepic-api";

const execFileAsync = promisify(execFile);

// Photographs that appear in any approved sale. Cached briefly so the per-photo
// delete guard doesn't re-scan every sale; the cleaner forces a refresh right
// before a bulk delete.
const SOLD_CACHE_TTL_MS = 5 * 60 * 1000;
export type SoldPhoto = {
  id: string;
  originalFileName: string;
  albumId: string;
  url: string;
  thumbnailUrl: string;
  saleIds: string[];
};
type SoldSnapshot = {
  ids: Set<string>;
  photos: Map<string, SoldPhoto>;
  salesScanned: number;
  fetchedAt: number;
};
let soldCache: SoldSnapshot | null = null;
let soldInflight: Promise<SoldSnapshot> | null = null;

async function scanSoldPhotographs(): Promise<SoldSnapshot> {
  const ids = new Set<string>();
  const photos = new Map<string, SoldPhoto>();
  let salesScanned = 0;
  for (const profile of getProfileConfigs()) {
    if (!profile.token) continue;
    const sales: any[] = [];
    for (let skip = 0; ; skip += 100) {
      const page = readArray(
        await lumepicFetch(
          `/sales?pagination%5Blimit%5D=100&pagination%5Bskip%5D=${skip}&status=approved`,
          profile.token,
          true,
        ),
      );
      sales.push(...page);
      if (page.length < 100) break;
    }
    salesScanned += sales.length;

    const CONCURRENCY = 8;
    for (let i = 0; i < sales.length; i += CONCURRENCY) {
      await Promise.all(
        sales.slice(i, i + CONCURRENCY).map(async (sale) => {
          if (!sale?.id) return;
          for (let skip = 0; ; skip += 100) {
            const detail: any = await lumepicFetch(
              `/sales/${sale.id}/photographs?pagination[limit]=100&pagination[skip]=${skip}`,
              profile.token,
              true,
            );
            const rows = [
              ...(detail?.eventPhotographs || []),
              ...(detail?.albumPhotographs || []),
              ...(detail?.photographs || []),
              ...(detail?.items || []),
            ];
            rows.forEach((row: any) => {
              const photo = row?.photograph || row;
              const id = photo?.id ? String(photo.id) : "";
              if (!id) return;
              ids.add(id);
              const existing = photos.get(id);
              if (existing) {
                if (!existing.saleIds.includes(sale.id)) existing.saleIds.push(sale.id);
                return;
              }
              photos.set(id, {
                id,
                originalFileName: String(photo.originalFileName || ""),
                albumId: String(photo.albumId || ""),
                url: String(photo.url || ""),
                thumbnailUrl: String(photo.thumbnailUrl || ""),
                saleIds: [String(sale.id)],
              });
            });
            if (rows.length < 100) break;
          }
        }),
      );
    }
  }
  return { ids, photos, salesScanned, fetchedAt: Date.now() };
}

async function getSoldPhotographs(forceRefresh = false): Promise<SoldSnapshot> {
  if (
    !forceRefresh &&
    soldCache &&
    Date.now() - soldCache.fetchedAt < SOLD_CACHE_TTL_MS
  ) {
    return soldCache;
  }
  if (!soldInflight) {
    soldInflight = scanSoldPhotographs()
      .then((result) => {
        soldCache = result;
        return result;
      })
      .finally(() => {
        soldInflight = null;
      });
  }
  return soldInflight;
}

function readArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  for (const key of ["items", "data", "results", "albums"]) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === "object") {
      const nestedRows = readArray(nested);
      if (nestedRows.length) return nestedRows;
    }
  }

  return [];
}

function normalizeAlbum(
  item: any,
  profile: ReturnType<typeof getProfileConfigs>[number],
) {
  const event = item.event && typeof item.event === "object" ? item.event : {};
  return {
    id: item.id || item.uuid || item._id,
    title: item.description || item.title || item.name || "Sin título",
    photosCount:
      item.photographCount ||
      item.photographsCount ||
      item.photosCount ||
      item.photos ||
      0,
    eventId: item.eventId || event.id,
    profileId: profile.id,
    photographerName: profile.label,
  };
}

function normalizeSelectedFolderPath(folderPath: string) {
  const trimmed = folderPath.trim();
  if (trimmed.length > 1 && trimmed.endsWith("/")) return trimmed.slice(0, -1);
  return trimmed;
}

async function selectLocalFolderPath(): Promise<string | null> {
  try {
    if (process.platform === "darwin") {
      const { stdout } = await execFileAsync(
        "osascript",
        [
          "-e",
          'POSIX path of (choose folder with prompt "Selecciona la carpeta local para Lumepic Watcher")',
        ],
        { timeout: 120000 },
      );
      return normalizeSelectedFolderPath(stdout);
    }

    if (process.platform === "win32") {
      const script = [
        "Add-Type -AssemblyName System.Windows.Forms",
        "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
        "$dialog.Description = 'Selecciona la carpeta local para Lumepic Watcher'",
        "if ($dialog.ShowDialog() -eq 'OK') { $dialog.SelectedPath } else { exit 1 }",
      ].join("; ");
      const { stdout } = await execFileAsync(
        "powershell.exe",
        ["-NoProfile", "-Command", script],
        { timeout: 120000 },
      );
      return normalizeSelectedFolderPath(stdout);
    }

    throw new Error("Folder picker is only supported on macOS and Windows.");
  } catch (error: any) {
    const message = String(error?.message || error || "");
    if (message.toLowerCase().includes("user canceled") || error?.code === 1)
      return null;
    throw error;
  }
}

// The browser never exposes where a download was saved, so find the file by
// name (Spotlight first, then the usual folders) and reveal the newest match.
async function revealFileInFinder(fileName: string): Promise<boolean> {
  if (process.platform !== "darwin") {
    throw new Error("Reveal in Finder is only supported on macOS.");
  }
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");
  const candidates = new Set<string>();

  try {
    const { stdout } = await execFileAsync(
      "mdfind",
      [`kMDItemFSName == "${fileName.replace(/"/g, '\\"')}"`],
      { timeout: 10000 },
    );
    stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => candidates.add(line));
  } catch {
    // Spotlight unavailable; fall back to the folders below.
  }

  const home = os.homedir();
  for (const dir of ["Downloads", "Desktop", "Documents"]) {
    try {
      const { stdout } = await execFileAsync(
        "find",
        [path.join(home, dir), "-maxdepth", "4", "-type", "f", "-name", fileName],
        { timeout: 15000 },
      );
      stdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => candidates.add(line));
    } catch (error: any) {
      // find exits non-zero on unreadable subfolders but still prints matches.
      String(error?.stdout || "")
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean)
        .forEach((line: string) => candidates.add(line));
    }
  }

  let newest: { file: string; mtime: number } | null = null;
  for (const file of Array.from(candidates)) {
    try {
      const stat = await fs.stat(file);
      if (!newest || stat.mtimeMs > newest.mtime) {
        newest = { file, mtime: stat.mtimeMs };
      }
    } catch {
      // Gone since it was indexed.
    }
  }
  if (!newest) return false;
  await execFileAsync("open", ["-R", newest.file], { timeout: 10000 });
  return true;
}

async function getWatcherDashboardData(config: any, bypassCache = false) {
  const profiles = getProfileConfigs();
  const allAlbumsMap: Record<string, any[]> = {};
  let events: any[] = [];

  // 1. Fetch albums for ALL profiles in parallel to cross-reference them
  await Promise.all(
    profiles.map(async (p) => {
      if (!p.token) return;
      try {
        const rawAlbums = await fetchAllAlbums(p.token, bypassCache);
        allAlbumsMap[p.id] = rawAlbums
          .map((item: any) => normalizeAlbum(item, p))
          .filter((album: any) => album.id);
      } catch (albumError) {
        console.error(
          `Error fetching albums for profile ${p.id} in watcher helper:`,
          albumError,
        );
      }
    }),
  );

  // 2. Fetch public events for the currently selected profile
  const profile =
    profiles.find((p) => p.id === config.profileId) || profiles[0];
  if (profile && profile.token) {
    try {
      const profileRaw = await lumepicFetch(
        "/users/profile",
        profile.token,
        bypassCache,
      );
      if (profileRaw && typeof profileRaw === "object") {
        const profileData = profileRaw as any;
        const userId = profileData.id;
        const countryCode = profileData.countryCode || "US";

        const rawEvents = await lumepicFetch(
          `/events/countryCode/${countryCode}?userId=${userId}`,
          profile.token,
          bypassCache,
        );

        const eventItems =
          (rawEvents as any).items ||
          (rawEvents as any).data ||
          (Array.isArray(rawEvents) ? rawEvents : []);
        const mappedEvents = eventItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          date: item.date,
          locationName: item.location?.spotName || "Ubicación desconocida",
          locationId: item.locationId,
          activityId: item.activityId,
          defaultImagePrice: item.defaultImagePrice || 15,
          currency: item.currency || "usd",
        }));

        // Sort events by date descending (newest/most recent first)
        const sortedEvents = [...mappedEvents].sort((a: any, b: any) => {
          const aTime = a.date ? new Date(a.date).getTime() : 0;
          const bTime = b.date ? new Date(b.date).getTime() : 0;
          return bTime - aTime;
        });

        // Limit public events to the closest 10 events as requested by the user
        events = sortedEvents.slice(0, 10);
      }
    } catch (profileError) {
      console.error(
        "Error fetching profile/events in watcher helper:",
        profileError,
      );
    }
  }

  return {
    albums: allAlbumsMap[config.profileId] || allAlbumsMap[profile?.id] || [],
    allAlbums: Object.values(allAlbumsMap).flat(),
    events,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      const config = await lumepicWatcher.getConfig();
      const history = await lumepicWatcher.getHistory();
      const isRunning = lumepicWatcher.getRunningStatus();

      const statusOnly = req.query.statusOnly === "true";
      const { albums, allAlbums, events } = statusOnly
        ? { albums: [], allAlbums: [], events: [] }
        : await getWatcherDashboardData(config, false);

      res.status(200).json({
        config,
        history,
        albums,
        allAlbums,
        events,
        isRunning,
      });
    } catch (err: any) {
      console.error("Error in watcher GET api route:", err);
      res.status(500).json({ error: "Failed to load watcher status" });
    }
  } else if (req.method === "POST") {
    try {
      const { action, ...payload } = req.body;

      if (action === "scan") {
        await lumepicWatcher.forceScan();
        const config = await lumepicWatcher.getConfig();
        const history = await lumepicWatcher.getHistory();
        res.status(200).json({
          success: true,
          config,
          history,
          isRunning: lumepicWatcher.getRunningStatus(),
        });
        return;
      }

      if (action === "select-folder") {
        const selectedPath = await selectLocalFolderPath();
        if (!selectedPath) {
          res.status(200).json({ success: false, canceled: true });
          return;
        }

        const updatedConfig = await lumepicWatcher.updateConfig({
          watchFolderPath: selectedPath,
        });
        const history = await lumepicWatcher.getHistory();
        const { albums, allAlbums, events } = await getWatcherDashboardData(
          updatedConfig,
          true,
        );

        res.status(200).json({
          success: true,
          selectedPath,
          config: updatedConfig,
          history,
          albums,
          allAlbums,
          events,
          isRunning: lumepicWatcher.getRunningStatus(),
        });
        return;
      }

      if (action === "create-album") {
        const {
          eventId,
          description,
          locationId,
          activityId,
          takenDate,
          defaultImagePrice,
        } = payload;

        const config = await lumepicWatcher.getConfig();
        const profiles = getProfileConfigs();
        const profile =
          profiles.find((p) => p.id === config.profileId) || profiles[0];

        if (!profile || !profile.token) {
          res
            .status(400)
            .json({
              error: "No photographer token configured for selected profile",
            });
          return;
        }

        const apiBase = LUMEPIC_API_BASE_URL;
        const tokenClean = profile.token.replace(/^Bearer\s+/i, "").trim();

        console.log(
          `[API Watcher] Creating album on Lumepic for event: ${description}`,
        );
        const createRes = await fetch(`${apiBase}/albums`, {
          method: "POST",
          headers: getLumepicAuthHeaders(tokenClean, {
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            description,
            eventId,
            locationId,
            activityId,
            takenDate: takenDate || new Date().toISOString(),
            defaultImagePrice: defaultImagePrice || 15,
            currency: "usd",
            status: "PUBLISHED",
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          res
            .status(createRes.status)
            .json({ error: `Lumepic album creation failed: ${errText}` });
          return;
        }

        const albumJson = (await createRes.json()) as any;
        const newAlbumId = albumJson.id;

        console.log(
          `[API Watcher] Album created successfully! ID: ${newAlbumId}`,
        );
        if (newAlbumId) {
          await lumepicWatcher.updateConfig({ targetAlbumId: newAlbumId });
        }

        res.status(200).json({
          success: true,
          album: albumJson,
        });
        return;
      }

      if (action === "list-album-photographs") {
        const { albumId, profileId } = payload;
        if (!albumId) {
          res.status(400).json({ error: "Missing albumId" });
          return;
        }

        const profiles = getProfileConfigs();
        const profile = profiles.find((p) => p.id === profileId) || profiles[0];
        if (!profile || !profile.token) {
          res
            .status(400)
            .json({
              error: "No photographer token configured for selected profile",
            });
          return;
        }

        const apiBase = LUMEPIC_API_BASE_URL;
        const tokenClean = profile.token.replace(/^Bearer\s+/i, "").trim();

        let allPhotographs: any[] = [];
        let skip = 0;
        const limit = 1000;
        let hasMore = true;
        let attempts = 0;
        // Safety net only: 500 pages × 1000 = 500k photos.
        const maxAttempts = 500;
        let remoteTotal = 0;

        try {
          while (hasMore && attempts < maxAttempts) {
            attempts++;
            const url = `${apiBase}/photographs?albumId=${encodeURIComponent(albumId)}&limit=${limit}&skip=${skip}`;
            const fetchRes = await fetch(url, {
              headers: getLumepicAuthHeaders(tokenClean),
            });

            if (!fetchRes.ok) {
              const errText = await fetchRes.text();
              throw new Error(`Failed to fetch photographs: ${errText}`);
            }

            const data = (await fetchRes.json()) as any;
            const items = data.items || [];
            allPhotographs.push(...items);
            remoteTotal = Number(data.count || 0);

            if (
              items.length < limit ||
              allPhotographs.length >= (data.count || 0)
            ) {
              hasMore = false;
            } else {
              skip += limit;
            }
          }

          const seen = new Set<string>();
          allPhotographs = allPhotographs.filter((photo) => {
            if (!photo?.id || seen.has(photo.id)) return false;
            seen.add(photo.id);
            return true;
          });

          res.status(200).json({
            success: true,
            photographs: allPhotographs,
            count: allPhotographs.length,
            total: remoteTotal || allPhotographs.length,
          });
        } catch (err: any) {
          console.error("Error listing album photographs:", err);
          res
            .status(500)
            .json({ error: err.message || "Failed to fetch photographs" });
        }
        return;
      }

      if (action === "reveal-file") {
        const fileName = String(payload.fileName || "").trim();
        if (!/^[^/\\]+\.zip$/i.test(fileName)) {
          res.status(400).json({ error: "Invalid file name" });
          return;
        }
        try {
          const found = await revealFileInFinder(fileName);
          if (!found) {
            res.status(404).json({ error: "File not found" });
            return;
          }
          res.status(200).json({ success: true });
        } catch (err: any) {
          res.status(500).json({ error: err.message || "Reveal failed" });
        }
        return;
      }

      if (action === "list-sold-photographs") {
        try {
          const sold = await getSoldPhotographs(Boolean(payload.refresh));
          const albumFilter = Array.isArray(payload.albumIds)
            ? new Set<string>(payload.albumIds.map(String))
            : null;
          res.status(200).json({
            soldIds: Array.from(sold.ids),
            ...(payload.includePhotos
              ? {
                  photos: Array.from(sold.photos.values()).filter(
                    (photo) => !albumFilter || albumFilter.has(photo.albumId),
                  ),
                }
              : {}),
            salesScanned: sold.salesScanned,
            fetchedAt: new Date(sold.fetchedAt).toISOString(),
          });
        } catch (err: any) {
          console.error("Error listing sold photographs:", err);
          res
            .status(500)
            .json({ error: err.message || "Failed to list sold photographs" });
        }
        return;
      }

      if (action === "delete-photograph") {
        const photographId = String(payload.photographId || "").trim();
        if (!photographId) {
          res.status(400).json({ error: "Missing photographId" });
          return;
        }

        // Never delete a photo someone bought. If sales can't be checked, refuse.
        try {
          const sold = await getSoldPhotographs();
          if (sold.ids.has(photographId)) {
            res.status(409).json({
              error: "Photograph was sold; refusing to delete",
              sold: true,
            });
            return;
          }
        } catch (err: any) {
          res.status(503).json({
            error: `Could not verify sales before deleting: ${err.message || err}`,
          });
          return;
        }

        const apiBase = LUMEPIC_API_BASE_URL;
        const profiles = getProfileConfigs();
        let lastError = "";

        for (const profile of profiles) {
          if (!profile.token) continue;
          const tokenClean = profile.token.replace(/^Bearer\s+/i, "").trim();
          const deleteRes = await fetch(
            `${apiBase}/photographs/${encodeURIComponent(photographId)}`,
            {
              method: "DELETE",
              headers: getLumepicAuthHeaders(tokenClean),
            },
          );
          const deleteText = await deleteRes.text();
          let deleteJson: any = null;
          try {
            deleteJson = deleteText ? JSON.parse(deleteText) : null;
          } catch {
            deleteJson = null;
          }

          if (!deleteRes.ok) {
            lastError =
              deleteText || `Photograph delete returned ${deleteRes.status}`;
            continue;
          }

          const affected = Number(deleteJson?.affected || 0);
          if (affected > 0) {
            await lumepicWatcher.markPhotographDeleted(photographId);
            const config = await lumepicWatcher.getConfig();
            const history = await lumepicWatcher.getHistory();
            const { albums, allAlbums, events } = await getWatcherDashboardData(
              config,
              true,
            );

            res.status(200).json({
              success: true,
              deletedPhotographId: photographId,
              affected,
              config,
              history,
              albums,
              allAlbums,
              events,
              isRunning: lumepicWatcher.getRunningStatus(),
            });
            return;
          }
        }

        const deletedItem =
          await lumepicWatcher.markPhotographDeleted(photographId);
        if (deletedItem && lastError.includes("PHOTOGRAPH_NOT_FOUND")) {
          const config = await lumepicWatcher.getConfig();
          const history = await lumepicWatcher.getHistory();
          const { albums, allAlbums, events } = await getWatcherDashboardData(
            config,
            true,
          );

          res.status(200).json({
            success: true,
            alreadyDeleted: true,
            deletedPhotographId: photographId,
            affected: 0,
            config,
            history,
            albums,
            allAlbums,
            events,
            isRunning: lumepicWatcher.getRunningStatus(),
          });
          return;
        }

        res.status(404).json({
          error: lastError || "Photograph not found or was already deleted",
          photographId,
        });
        return;
      }

      // Update configuration
      const updatedConfig = await lumepicWatcher.updateConfig(payload);
      const history = await lumepicWatcher.getHistory();
      const { albums, allAlbums, events } = await getWatcherDashboardData(
        updatedConfig,
        true,
      );

      res.status(200).json({
        success: true,
        config: updatedConfig,
        history,
        albums,
        allAlbums,
        events,
        isRunning: lumepicWatcher.getRunningStatus(),
      });
    } catch (err: any) {
      console.error("Error in watcher POST api route:", err);
      res.status(500).json({ error: "Failed to perform watcher action" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
