import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const dbPath = path.join(process.cwd(), "data.db");
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Enable foreign keys
    await db.run("PRAGMA foreign_keys = ON;");

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS custom_events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        album_ids TEXT NOT NULL,
        sub_events TEXT NOT NULL,
        local_dir_name TEXT
      );

      CREATE TABLE IF NOT EXISTS sales_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        details_loaded INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS watcher_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS watcher_history (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
    `);

    // Migrate old JSON files on first run
    await migrateOldJsonFiles(db);

    return db;
  })();

  return dbPromise;
}

async function migrateOldJsonFiles(db: Database) {
  // 1. Clients migration
  const clientsPath = path.join(process.cwd(), "clients.json");
  if (existsSync(clientsPath)) {
    try {
      console.log("[DB Migration] clients.json found. Migrating to SQLite...");
      const data = await fs.readFile(clientsPath, "utf-8");
      const clients = JSON.parse(data);
      for (const [id, client] of Object.entries(clients)) {
        await db.run(
          "INSERT OR IGNORE INTO clients (id, data) VALUES (?, ?)",
          id,
          JSON.stringify(client)
        );
      }
      await fs.rename(clientsPath, path.join(process.cwd(), "clients.json.bak"));
      console.log("[DB Migration] clients.json successfully migrated.");
    } catch (err) {
      console.error("[DB Migration] Error migrating clients.json:", err);
    }
  }

  // 2. Sales Cache migration
  const salesCachePath = path.join(process.cwd(), "sales_cache.json");
  if (existsSync(salesCachePath)) {
    try {
      console.log("[DB Migration] sales_cache.json found. Migrating to SQLite...");
      const data = await fs.readFile(salesCachePath, "utf-8");
      const sales = JSON.parse(data) as Record<string, any>;
      for (const [id, sale] of Object.entries(sales)) {
        await db.run(
          "INSERT OR IGNORE INTO sales_cache (id, data, details_loaded) VALUES (?, ?, ?)",
          id,
          JSON.stringify(sale),
          sale.detailsLoaded ? 1 : 0
        );
      }
      await fs.rename(salesCachePath, path.join(process.cwd(), "sales_cache.json.bak"));
      console.log("[DB Migration] sales_cache.json successfully migrated.");
    } catch (err) {
      console.error("[DB Migration] Error migrating sales_cache.json:", err);
    }
  }

  // 3. Watcher Config migration
  const watcherConfigPath = path.join(process.cwd(), "watcher_config.json");
  if (existsSync(watcherConfigPath)) {
    try {
      console.log("[DB Migration] watcher_config.json found. Migrating to SQLite...");
      const data = await fs.readFile(watcherConfigPath, "utf-8");
      const config = JSON.parse(data);
      for (const [key, value] of Object.entries(config)) {
        await db.run(
          "INSERT OR REPLACE INTO watcher_config (key, value) VALUES (?, ?)",
          key,
          JSON.stringify(value)
        );
      }
      await fs.rename(watcherConfigPath, path.join(process.cwd(), "watcher_config.json.bak"));
      console.log("[DB Migration] watcher_config.json successfully migrated.");
    } catch (err) {
      console.error("[DB Migration] Error migrating watcher_config.json:", err);
    }
  }

  // 4. Watcher History migration
  const watcherHistoryPath = path.join(process.cwd(), "watcher_history.json");
  if (existsSync(watcherHistoryPath)) {
    try {
      console.log("[DB Migration] watcher_history.json found. Migrating to SQLite...");
      const data = await fs.readFile(watcherHistoryPath, "utf-8");
      const history = JSON.parse(data);
      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && item.id) {
            await db.run(
              "INSERT OR IGNORE INTO watcher_history (id, data) VALUES (?, ?)",
              item.id,
              JSON.stringify(item)
            );
          }
        }
      }
      await fs.rename(watcherHistoryPath, path.join(process.cwd(), "watcher_history.json.bak"));
      console.log("[DB Migration] watcher_history.json successfully migrated.");
    } catch (err) {
      console.error("[DB Migration] Error migrating watcher_history.json:", err);
    }
  }
}
