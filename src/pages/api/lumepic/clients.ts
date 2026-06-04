import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb();

    if (req.method === "GET") {
      const rows = await db.all("SELECT * FROM clients");
      const clientsMap: Record<string, any> = {};
      for (const row of rows) {
        if (row.data) {
          clientsMap[row.id] = JSON.parse(row.data);
        }
      }
      res.status(200).json(clientsMap);
    } else if (req.method === "POST") {
      const payload = req.body as Record<string, any>;
      if (!payload || typeof payload !== "object") {
        res.status(400).json({ error: "Invalid client payload" });
        return;
      }

      await db.exec("BEGIN TRANSACTION;");
      try {
        await db.run("DELETE FROM clients;");
        for (const [id, client] of Object.entries(payload)) {
          await db.run(
            "INSERT INTO clients (id, data) VALUES (?, ?)",
            id,
            JSON.stringify(client)
          );
        }
        await db.exec("COMMIT;");
        res.status(200).json({ success: true });
      } catch (transactionError) {
        await db.exec("ROLLBACK;");
        throw transactionError;
      }
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err: any) {
    console.error("Error in clients API route:", err);
    res.status(500).json({ error: err.message || "Failed to process clients request" });
  }
}
