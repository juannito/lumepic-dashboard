import type { NextApiRequest, NextApiResponse } from "next";
import { getProfileConfigs, lumepicFetch } from "@/lib/lumepic-api";

export type PhotoLookupResult = {
  id: string;
  found: boolean;
  originalFileName?: string;
  albumId?: string;
  ownerId?: string;
  takenDate?: string;
  uploadedAt?: string;
  thumbnailUrl?: string;
  url?: string;
  width?: number;
  height?: number;
  profileLabel?: string;
  error?: string;
};

export type PhotoLookupResponse = { results: PhotoLookupResult[] };

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const MAX_IDS = 200;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function str(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function num(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<PhotoLookupResponse | { error: string }>,
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  // Accepts raw IDs, S3/Lumepic URLs or any pasted text: every UUID found is looked up.
  const raw = Array.isArray(request.query.ids)
    ? request.query.ids.join(" ")
    : request.query.ids || "";
  const ids = Array.from(
    new Set((raw.match(UUID_RE) || []).map((id) => id.toLowerCase())),
  ).slice(0, MAX_IDS);

  if (ids.length === 0) {
    return response.status(400).json({ error: "No photo IDs found" });
  }

  const profiles = getProfileConfigs();
  if (profiles.length === 0) {
    return response
      .status(500)
      .json({ error: "No Lumepic photographer token configured" });
  }

  const lookup = async (id: string): Promise<PhotoLookupResult> => {
    let lastError = "";
    for (const profile of profiles) {
      try {
        const record = asRecord(
          await lumepicFetch(`/photographs/${id}`, profile.token),
        );
        if (!str(record, "id")) continue;
        return {
          id,
          found: true,
          originalFileName: str(record, "originalFileName"),
          albumId: str(record, "albumId"),
          ownerId: str(record, "ownerId"),
          takenDate: str(record, "takenDate"),
          uploadedAt: str(record, "uploadedAt"),
          thumbnailUrl: str(record, "thumbnailUrl"),
          url: str(record, "url"),
          width: num(record, "width"),
          height: num(record, "height"),
          profileLabel: profile.label,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
    return { id, found: false, error: lastError || "Not found" };
  };

  const results: PhotoLookupResult[] = [];
  const CONCURRENCY = 6;
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    results.push(...(await Promise.all(ids.slice(i, i + CONCURRENCY).map(lookup))));
  }

  return response.status(200).json({ results });
}
