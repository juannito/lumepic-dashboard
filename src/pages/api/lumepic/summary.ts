import type { NextApiRequest, NextApiResponse } from "next";
import { getLumepicDashboard } from "@/lib/lumepic-api";
import type { DashboardPayload } from "@/lib/lumepic-types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<DashboardPayload | { error: string }>
) {
  try {
    const limitQuery = request.query.limit ? parseInt(request.query.limit as string, 10) : 500;
    const limit = isNaN(limitQuery) ? 500 : limitQuery;
    const dashboard = await getLumepicDashboard(limit);
    response.status(200).json(dashboard);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "No pude cargar Lumepic"
    });
  }
}
