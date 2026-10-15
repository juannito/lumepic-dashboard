import type { NextApiRequest, NextApiResponse } from "next";
import {
  getLumepicAuthHeaders,
  getProfileConfigs,
  lumepicFetch,
  LUMEPIC_API_BASE_URL,
} from "@/lib/lumepic-api";
import {
  dedupePhotos,
  normalizePhotoList,
  type AlbumPhoto,
} from "./album-photos";

// The client downscales the selfie before sending it, but keep room to spare.
export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

export type FaceSearchResponse = {
  photos: AlbumPhoto[];
  total: number;
  albumIds: string[];
  faceSearch: true;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function decodeImage(value: string): { buffer: Buffer; contentType: string } {
  const trimmed = value.trim();
  const dataUrl = /^data:(image\/[a-z0-9+.-]+);base64,(.*)$/i.exec(trimmed);
  const contentType = dataUrl ? dataUrl[1] : "image/jpeg";
  const base64 = dataUrl ? dataUrl[2] : trimmed;
  return { buffer: Buffer.from(base64, "base64"), contentType };
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<FaceSearchResponse | { error: string }>,
) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const body = (request.body || {}) as {
    imageBase64?: string;
    albumId?: string;
    albumIds?: string[];
    profileId?: string;
  };

  const albumIds = Array.from(
    new Set(
      [body.albumId, ...(Array.isArray(body.albumIds) ? body.albumIds : [])]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  if (albumIds.length === 0) {
    return response
      .status(400)
      .json({ error: "albumId or albumIds is required" });
  }
  if (!body.imageBase64) {
    return response.status(400).json({ error: "imageBase64 is required" });
  }

  const { buffer, contentType } = decodeImage(body.imageBase64);
  if (buffer.length === 0) {
    return response.status(400).json({ error: "Invalid image payload" });
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    return response.status(413).json({ error: "Image is too large" });
  }

  const configs = getProfileConfigs();
  if (configs.length === 0) {
    return response.status(400).json({ error: "No profiles configured" });
  }
  let token = configs[0].token;
  if (body.profileId) {
    const found = configs.find((c) => c.id === body.profileId);
    if (found) token = found.token;
  }
  const cleanToken = token.replace(/^Bearer\s+/i, "").trim();

  try {
    // 1. Ask Lumepic for a temporary upload slot for the reference picture
    const uploadRes = await fetch(
      `${LUMEPIC_API_BASE_URL}/users/temporary-recognition-picture/upload-url`,
      {
        method: "POST",
        headers: getLumepicAuthHeaders(cleanToken, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({}),
      },
    );
    if (!uploadRes.ok) {
      throw new Error(
        `upload-url returned ${uploadRes.status}: ${await uploadRes.text()}`,
      );
    }
    const uploadData = (await uploadRes.json()) as {
      photographUrl?: string;
      uploadUrl?: string;
    };
    if (!uploadData.photographUrl || !uploadData.uploadUrl) {
      throw new Error("Lumepic did not return an upload URL");
    }

    // 2. Upload the picture straight to S3 (presigned, no auth header)
    const putRes = await fetch(uploadData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: new Uint8Array(buffer),
    });
    if (!putRes.ok) {
      throw new Error(
        `Uploading the reference picture returned ${putRes.status}`,
      );
    }

    // 3. Search each album with that reference picture
    const encodedUrl = encodeURIComponent(uploadData.photographUrl);
    const results = await Promise.all(
      albumIds.map(async (albumId) => {
        const path = `/photographs?albumId=${encodeURIComponent(albumId)}&limit=100&skip=0&recognitionImageUrl=${encodedUrl}`;
        const raw = await lumepicFetch(path, cleanToken, true);
        return normalizePhotoList(raw, { id: albumId });
      }),
    );

    const photos = dedupePhotos(results.flat());
    return response
      .status(200)
      .json({ photos, total: photos.length, albumIds, faceSearch: true });
  } catch (error) {
    console.error("Face search failed:", error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : "Face search failed",
    });
  }
}
