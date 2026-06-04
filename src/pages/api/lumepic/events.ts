import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import type { CustomEvent } from "@/lib/lumepic-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb();

    if (req.method === "GET") {
      const rows = await db.all("SELECT * FROM custom_events");
      const events: CustomEvent[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        albumIds: JSON.parse(row.album_ids || "[]"),
        subEvents: JSON.parse(row.sub_events || "[]"),
        localDirName: row.local_dir_name || null,
      }));
      res.status(200).json(events);
    } else if (req.method === "POST") {
      const event = req.body as CustomEvent;
      if (!event || !event.id || !event.name) {
        res.status(400).json({ error: "Missing event id or name" });
        return;
      }

      await db.run(
        "INSERT OR REPLACE INTO custom_events (id, name, album_ids, sub_events, local_dir_name) VALUES (?, ?, ?, ?, ?)",
        event.id,
        event.name,
        JSON.stringify(event.albumIds || []),
        JSON.stringify(event.subEvents || []),
        event.localDirName || null
      );
      res.status(200).json({ success: true });
    } else if (req.method === "DELETE") {
      const id = req.query.id as string;
      if (!id) {
        res.status(400).json({ error: "Missing event id" });
        return;
      }

      await db.run("DELETE FROM custom_events WHERE id = ?", id);
      res.status(200).json({ success: true });
    } else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err: any) {
    console.error("Error in events API route:", err);
    res.status(500).json({ error: err.message || "Failed to process events request" });
  }
}
