import type { NextApiRequest, NextApiResponse } from "next";
import { lumepicFetch, getProfileConfigs } from "@/lib/lumepic-api";

export type AlbumPhoto = {
  id: string;
  albumId: string;
  albumTitle?: string;
  thumbnailUrl: string;
  url: string;
  originalFileName: string;
  takenDate?: string;
  tags?: string[];
};

export type AlbumPhotosResponse = {
  photos: AlbumPhoto[];
  total: number;
  albumId?: string;
  albumIds?: string[];
  tagNumber?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function arrayFrom(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  for (const key of [
    "data",
    "items",
    "results",
    "photographs",
    "albumPhotographs",
    "eventPhotographs",
  ]) {
    if (Array.isArray(record[key]))
      return (record[key] as unknown[]).map(asRecord);
  }
  return [];
}

function stringFrom(
  record: Record<string, unknown>,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function normalizePhoto(
  record: Record<string, unknown>,
  fallbackAlbum?: { id?: string; title?: string },
): AlbumPhoto {
  const tags: string[] = [];
  const tagArr = Array.isArray(record.tags) ? record.tags : [];
  const albumRecord = asRecord(record.album);
  tagArr.forEach((t: unknown) => {
    const tr = asRecord(t);
    const val = stringFrom(tr, ["value", "tag", "number"]);
    if (val) tags.push(val);
  });
  return {
    id: stringFrom(record, ["id"]),
    albumId:
      stringFrom(record, ["albumId"], stringFrom(albumRecord, ["id"])) ||
      fallbackAlbum?.id ||
      "",
    albumTitle:
      stringFrom(
        record,
        ["albumTitle"],
        stringFrom(albumRecord, ["description", "title", "name"]),
      ) ||
      fallbackAlbum?.title ||
      undefined,
    thumbnailUrl: stringFrom(record, ["thumbnailUrl", "thumbnail"]),
    url: stringFrom(record, ["url", "originalUrl"]),
    originalFileName: stringFrom(record, [
      "originalFileName",
      "filename",
      "name",
    ]),
    takenDate: stringFrom(record, ["takenDate", "date"]) || undefined,
    tags: tags.length ? tags : undefined,
  };
}

export function normalizePhotoList(
  value: unknown,
  fallbackAlbum?: { id?: string; title?: string },
): AlbumPhoto[] {
  return arrayFrom(value)
    .map((record) => normalizePhoto(record, fallbackAlbum))
    .filter(
      (photo) => photo.id && photo.albumId && (photo.thumbnailUrl || photo.url),
    );
}

export function dedupePhotos(photos: AlbumPhoto[]): AlbumPhoto[] {
  const seen = new Set<string>();
  return photos.filter((photo) => {
    const key =
      photo.id || `${photo.albumId}:${photo.originalFileName}:${photo.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractTotalCount(value: unknown, fallback: number): number {
  const record = asRecord(value);
  if (typeof record.total === "number") return record.total;
  if (typeof record.count === "number") return record.count;
  const pagination = asRecord(record.pagination);
  if (typeof pagination.total === "number") return pagination.total;
  return fallback;
}

async function fetchGenericPhotographs(
  album: { id: string; title?: string },
  token: string,
  query = "",
  limit = 100,
  skip = 0,
): Promise<{ photos: AlbumPhoto[]; total: number }> {
  const separator = query ? `&${query}` : "";
  const path = `/photographs?albumId=${album.id}${separator}&limit=${limit}&skip=${skip}`;
  const result = await lumepicFetch(path, token, true);
  const photos = normalizePhotoList(result, album);
  return { photos, total: extractTotalCount(result, photos.length) };
}

async function fetchAlbumPhotosByTag(
  album: { id: string; title?: string },
  tagNumber: string,
  token: string,
): Promise<AlbumPhoto[]> {
  const limit = 100;
  const photos: AlbumPhoto[] = [];
  for (let skip = 0; skip < 5000; skip += limit) {
    const page = await fetchGenericPhotographs(
      album,
      token,
      `tagValue=${encodeURIComponent(tagNumber)}`,
      limit,
      skip,
    );
    photos.push(...page.photos);
    if (page.photos.length < limit || photos.length >= page.total) break;
  }
  return photos;
}

async function fetchAlbumPhotos(
  albumId: string,
  token: string,
  skip = 0,
  limit = 50,
): Promise<{ photos: AlbumPhoto[]; total: number }> {
  const paths = [
    `/photographs?albumId=${albumId}&limit=${limit}&skip=${skip}`,
  ];

  let lastError: unknown = null;

  for (const path of paths) {
    try {
      const result = await lumepicFetch(path, token, true);
      const record = asRecord(result);
      const photos = normalizePhotoList(result, { id: albumId });
      let total = photos.length;
      if (typeof record.total === "number") total = record.total;
      else if (typeof record.count === "number") total = record.count;
      else if (
        asRecord(record.pagination) &&
        typeof asRecord(record.pagination).total === "number"
      ) {
        total = asRecord(record.pagination).total as number;
      }
      return { photos, total };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not fetch album photographs");
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<AlbumPhotosResponse | { error: string }>,
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { albumId, albumIds, tagNumber, profileId, skip, limit } =
    request.query;
  const parsedAlbumIds =
    typeof albumIds === "string"
      ? albumIds
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  const requestedAlbumIds = Array.from(
    new Set(
      [albumId, ...parsedAlbumIds].filter(
        (value): value is string => typeof value === "string",
      ),
    ),
  );

  if (requestedAlbumIds.length === 0) {
    return response
      .status(400)
      .json({ error: "albumId or albumIds is required" });
  }

  const configs = getProfileConfigs();
  if (configs.length === 0) {
    return response.status(400).json({ error: "No profiles configured" });
  }

  // Select the profile token (use first profile if profileId not specified)
  let token = configs[0].token;
  if (profileId && typeof profileId === "string") {
    const found = configs.find((c) => c.id === profileId);
    if (found) token = found.token;
  }

  try {
    const skipNum = typeof skip === "string" ? parseInt(skip, 10) || 0 : 0;
    const limitNum = typeof limit === "string" ? parseInt(limit, 10) || 50 : 50;

    if (tagNumber && typeof tagNumber === "string" && tagNumber.trim()) {
      // Bib number search mode
      const photos = dedupePhotos(
        (
          await Promise.all(
            requestedAlbumIds.map((requestedId) =>
              fetchAlbumPhotosByTag(
                { id: requestedId },
                tagNumber.trim(),
                token,
              ),
            ),
          )
        ).flat(),
      );
      return response.status(200).json({
        photos,
        total: photos.length,
        albumId: typeof albumId === "string" ? albumId : undefined,
        albumIds: requestedAlbumIds,
        tagNumber: tagNumber.trim(),
      });
    } else {
      if (!albumId || typeof albumId !== "string") {
        return response
          .status(400)
          .json({ error: "albumId is required to browse all photos" });
      }
      // All photos mode (paginated)
      const { photos, total } = await fetchAlbumPhotos(
        albumId,
        token,
        skipNum,
        limitNum,
      );
      return response.status(200).json({ photos, total, albumId });
    }
  } catch (error) {
    console.error("Error fetching album photos:", error);
    const message =
      error instanceof Error ? error.message : "Error fetching album photos";
    const status = message.includes("Exact bib search is not available")
      ? 422
      : 500;
    return response.status(status).json({
      error: message,
    });
  }
}
