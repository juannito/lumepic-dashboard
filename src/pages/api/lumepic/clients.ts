import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "clients.json");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      res.status(200).json(JSON.parse(data));
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // Return empty object if file doesn't exist yet
        res.status(200).json({});
      } else {
        console.error("Error reading clients.json:", err);
        res.status(500).json({ error: "Failed to read clients data" });
      }
    }
  } else if (req.method === "POST") {
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2), "utf-8");
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error writing to clients.json:", err);
      res.status(500).json({ error: "Failed to save clients data" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
