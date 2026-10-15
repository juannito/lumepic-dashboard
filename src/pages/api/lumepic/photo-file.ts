import type { NextApiRequest, NextApiResponse } from "next";
import { getProfileConfigs, lumepicFetch } from "@/lib/lumepic-api";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Streams the Lumepic web preview (the same `url` the lightbox shows) of one
// photograph. The URL is resolved from the photo ID through the Lumepic API,
// so this is not an open proxy.
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }
  const id = typeof request.query.id === "string" ? request.query.id : "";
  if (!UUID_RE.test(id)) {
    return response.status(400).json({ error: "Invalid photo id" });
  }

  let url = "";
  for (const profile of getProfileConfigs()) {
    try {
      const record = (await lumepicFetch(`/photographs/${id}`, profile.token)) as {
        url?: string;
      };
      if (record?.url) {
        url = record.url;
        break;
      }
    } catch {
      // Try the next profile.
    }
  }
  if (!url) return response.status(404).json({ error: "Photo not found" });

  const upstream = await fetch(url);
  if (!upstream.ok) {
    return response
      .status(502)
      .json({ error: `Download failed: ${upstream.status}` });
  }
  const body = Buffer.from(await upstream.arrayBuffer());
  response.setHeader(
    "Content-Type",
    upstream.headers.get("content-type") || "image/jpeg",
  );
  response.setHeader("Content-Length", String(body.length));
  response.setHeader("Cache-Control", "private, max-age=3600");
  response.status(200).send(body);
}
