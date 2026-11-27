import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync, statSync } from "fs";
import { join } from "path";
import { lumepicFetch, getProfileConfigs } from "@/lib/lumepic-api";

export type AlbumPhotoIndexItem = {
  id: string;
  originalFileName: string;
  takenDate?: string;
  thumbnailUrl?: string;
  url?: string;
  size?: number;
  /** Name the file has on the camera's card, from data/sd-names.json (made by scripts/match-sd-names.py). */
  sdName?: string;
  /** How it was matched: "log" and "size" are certain, "time" is probable. */
  sdHow?: "log" | "size" | "time";
};

type SdNames = Record<string, { sd: string; how: "log" | "size" | "time" }>;
const SD_NAMES_FILE = join(process.cwd(), "data", "sd-names.json");
let sdNamesCache: { mtimeMs: number; names: SdNames } | null = null;

// Re-read only when the file changes: the script rewrites it as the album grows.
function loadSdNames(): SdNames {
  try {
    const { mtimeMs } = statSync(SD_NAMES_FILE);
    if (!sdNamesCache || sdNamesCache.mtimeMs !== mtimeMs) {
      sdNamesCache = { mtimeMs, names: JSON.parse(readFileSync(SD_NAMES_FILE, "utf8")) };
    }
    return sdNamesCache.names;
  } catch {
    return {};
  }
}

export type AlbumPhotoIndexResponse = {
  photos: AlbumPhotoIndexItem[];
  total: number;
  albumId: string;
};

const PAGE_SIZE = 100;
const MAX_PHOTOS = 100000;
const CONCURRENCY = 6;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function str(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function rawItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  for (const key of ["data", "items", "results", "photographs"]) {
    if (Array.isArray(record[key])) return (record[key] as unknown[]).map(asRecord);
  }
  return [];
}

// Only trust an explicit numeric total from the API; never infer it from the page length.
function explicitTotal(value: unknown): number | null {
  const record = asRecord(value);
  if (typeof record.total === "number") return record.total;
  if (typeof record.count === "number") return record.count;
  const pagination = asRecord(record.pagination);
  if (typeof pagination.total === "number") return pagination.total;
  return null;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<AlbumPhotoIndexResponse | { error: string }>,
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { albumId, profileId } = request.query;
  if (typeof albumId !== "string" || !albumId.trim()) {
    return response.status(400).json({ error: "albumId is required" });
  }

  const configs = getProfileConfigs();
  if (configs.length === 0) {
    return response.status(400).json({ error: "No profiles configured" });
  }
  const profile =
    (typeof profileId === "string" && configs.find((c) => c.id === profileId)) ||
    configs[0];

  try {
    const seen = new Map<string, AlbumPhotoIndexItem>();
    let apiTotal: number | null = null;

    const fetchPage = async (skip: number) => {
      const page = await lumepicFetch(
        `/photographs?albumId=${encodeURIComponent(albumId)}&limit=${PAGE_SIZE}&skip=${skip}`,
        profile.token,
        true,
      );
      apiTotal = explicitTotal(page) ?? apiTotal;
      return rawItems(page);
    };
    const absorb = (items: Record<string, unknown>[]) => {
      for (const item of items) {
        const id = str(item, ["id"]);
        if (!id || seen.has(id)) continue;
        seen.set(id, {
          id,
          originalFileName: str(item, ["originalFileName", "filename", "name"]) || "",
          takenDate: str(item, ["takenDate", "date"]),
          thumbnailUrl: str(item, ["thumbnailUrl", "thumbnail"]),
          url: str(item, ["url", "originalUrl"]),
          size: typeof item.size === "number" ? item.size : undefined,
        });
      }
    };

    const first = await fetchPage(0);
    absorb(first);
    let skip = first.length;

    if (first.length > 0) {
      if (apiTotal !== null) {
        // Total known: fetch the remaining pages in parallel batches.
        const knownTotal: number = Math.min(apiTotal, MAX_PHOTOS);
        const offsets: number[] = [];
        for (let o = skip; o < knownTotal; o += first.length) offsets.push(o);
        for (let i = 0; i < offsets.length; i += CONCURRENCY) {
          const pages = await Promise.all(
            offsets.slice(i, i + CONCURRENCY).map(fetchPage),
          );
          pages.forEach(absorb);
        }
      } else {
        // No total in the response: walk sequentially until an empty page.
        while (skip < MAX_PHOTOS) {
          const items = await fetchPage(skip);
          if (items.length === 0) break;
          const before = seen.size;
          absorb(items);
          if (seen.size === before) break; // API ignored `skip`
          skip += items.length;
        }
      }
    }

    const sdNames = loadSdNames();
    const photos = Array.from(seen.values()).map((photo) => {
      const match = sdNames[photo.originalFileName];
      return match ? { ...photo, sdName: match.sd, sdHow: match.how } : photo;
    });
    return response
      .status(200)
      .json({ photos, total: apiTotal ?? photos.length, albumId });
  } catch (error) {
    console.error("Error fetching album photo index:", error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : "Error fetching album photos",
    });
  }
}
