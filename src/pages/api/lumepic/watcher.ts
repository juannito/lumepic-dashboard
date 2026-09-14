import type { NextApiRequest, NextApiResponse } from "next";
import { execFile } from "child_process";
import { promisify } from "util";
import { lumepicWatcher } from "@/lib/lumepic-watcher";
import {
  getProfileConfigs,
  lumepicFetch,
  fetchAllAlbums,
  getLumepicAuthHeaders,
  LUMEPIC_API_BASE_URL,
} from "@/lib/lumepic-api";

const execFileAsync = promisify(execFile);

function readArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  for (const key of ["items", "data", "results", "albums"]) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === "object") {
      const nestedRows = readArray(nested);
      if (nestedRows.length) return nestedRows;
    }
  }

  return [];
}

function normalizeAlbum(
  item: any,
  profile: ReturnType<typeof getProfileConfigs>[number],
) {
  const event = item.event && typeof item.event === "object" ? item.event : {};
  return {
    id: item.id || item.uuid || item._id,
    title: item.description || item.title || item.name || "Sin título",
    photosCount:
      item.photographCount ||
      item.photographsCount ||
      item.photosCount ||
      item.photos ||
      0,
    eventId: item.eventId || event.id,
    profileId: profile.id,
    photographerName: profile.label,
  };
}

function normalizeSelectedFolderPath(folderPath: string) {
  const trimmed = folderPath.trim();
  if (trimmed.length > 1 && trimmed.endsWith("/")) return trimmed.slice(0, -1);
  return trimmed;
}

async function selectLocalFolderPath(): Promise<string | null> {
  try {
    if (process.platform === "darwin") {
      const { stdout } = await execFileAsync(
        "osascript",
        [
          "-e",
          'POSIX path of (choose folder with prompt "Selecciona la carpeta local para Lumepic Watcher")',
        ],
        { timeout: 120000 },
      );
      return normalizeSelectedFolderPath(stdout);
    }

    if (process.platform === "win32") {
      const script = [
        "Add-Type -AssemblyName System.Windows.Forms",
        "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
        "$dialog.Description = 'Selecciona la carpeta local para Lumepic Watcher'",
        "if ($dialog.ShowDialog() -eq 'OK') { $dialog.SelectedPath } else { exit 1 }",
      ].join("; ");
      const { stdout } = await execFileAsync(
        "powershell.exe",
        ["-NoProfile", "-Command", script],
        { timeout: 120000 },
      );
      return normalizeSelectedFolderPath(stdout);
    }

    throw new Error("Folder picker is only supported on macOS and Windows.");
  } catch (error: any) {
    const message = String(error?.message || error || "");
    if (message.toLowerCase().includes("user canceled") || error?.code === 1)
      return null;
    throw error;
  }
}

async function getWatcherDashboardData(config: any, bypassCache = false) {
  const profiles = getProfileConfigs();
  const allAlbumsMap: Record<string, any[]> = {};
  let events: any[] = [];

  // 1. Fetch albums for ALL profiles in parallel to cross-reference them
  await Promise.all(
    profiles.map(async (p) => {
      if (!p.token) return;
      try {
        const rawAlbums = await fetchAllAlbums(p.token, bypassCache);
        allAlbumsMap[p.id] = rawAlbums
          .map((item: any) => normalizeAlbum(item, p))
          .filter((album: any) => album.id);
      } catch (albumError) {
        console.error(
          `Error fetching albums for profile ${p.id} in watcher helper:`,
          albumError,
        );
      }
    }),
  );

  // 2. Fetch public events for the currently selected profile
  const profile =
    profiles.find((p) => p.id === config.profileId) || profiles[0];
  if (profile && profile.token) {
    try {
      const profileRaw = await lumepicFetch(
        "/users/profile",
        profile.token,
        bypassCache,
      );
      if (profileRaw && typeof profileRaw === "object") {
        const profileData = profileRaw as any;
        const userId = profileData.id;
        const countryCode = profileData.countryCode || "US";

        const rawEvents = await lumepicFetch(
          `/events/countryCode/${countryCode}?userId=${userId}`,
          profile.token,
          bypassCache,
        );

        const eventItems =
          (rawEvents as any).items ||
          (rawEvents as any).data ||
          (Array.isArray(rawEvents) ? rawEvents : []);
        const mappedEvents = eventItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          date: item.date,
          locationName: item.location?.spotName || "Ubicación desconocida",
          locationId: item.locationId,
          activityId: item.activityId,
          defaultImagePrice: item.defaultImagePrice || 15,
          currency: item.currency || "usd",
        }));

        // Sort events by date descending (newest/most recent first)
        const sortedEvents = [...mappedEvents].sort((a: any, b: any) => {
          const aTime = a.date ? new Date(a.date).getTime() : 0;
          const bTime = b.date ? new Date(b.date).getTime() : 0;
          return bTime - aTime;
        });

        // Limit public events to the closest 10 events as requested by the user
        events = sortedEvents.slice(0, 10);
      }
    } catch (profileError) {
      console.error(
        "Error fetching profile/events in watcher helper:",
        profileError,
      );
    }
  }

  return {
    albums: allAlbumsMap[config.profileId] || allAlbumsMap[profile?.id] || [],
    allAlbums: Object.values(allAlbumsMap).flat(),
    events,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      const config = await lumepicWatcher.getConfig();
      const history = await lumepicWatcher.getHistory();
      const isRunning = lumepicWatcher.getRunningStatus();

      const statusOnly = req.query.statusOnly === "true";
      const { albums, allAlbums, events } = statusOnly
        ? { albums: [], allAlbums: [], events: [] }
        : await getWatcherDashboardData(config, false);

      res.status(200).json({
        config,
        history,
        albums,
        allAlbums,
        events,
        isRunning,
      });
    } catch (err: any) {
      console.error("Error in watcher GET api route:", err);
      res.status(500).json({ error: "Failed to load watcher status" });
    }
  } else if (req.method === "POST") {
    try {
      const { action, ...payload } = req.body;

      if (action === "scan") {
        await lumepicWatcher.forceScan();
        const config = await lumepicWatcher.getConfig();
        const history = await lumepicWatcher.getHistory();
        res.status(200).json({
          success: true,
          config,
          history,
          isRunning: lumepicWatcher.getRunningStatus(),
        });
        return;
      }

      if (action === "select-folder") {
        const selectedPath = await selectLocalFolderPath();
        if (!selectedPath) {
          res.status(200).json({ success: false, canceled: true });
          return;
        }

        const updatedConfig = await lumepicWatcher.updateConfig({
          watchFolderPath: selectedPath,
        });
        const history = await lumepicWatcher.getHistory();
        const { albums, allAlbums, events } = await getWatcherDashboardData(
          updatedConfig,
          true,
        );

        res.status(200).json({
          success: true,
          selectedPath,
          config: updatedConfig,
          history,
          albums,
          allAlbums,
          events,
          isRunning: lumepicWatcher.getRunningStatus(),
        });
        return;
      }

      if (action === "create-album") {
        const {
          eventId,
          description,
          locationId,
          activityId,
          takenDate,
          defaultImagePrice,
        } = payload;

        const config = await lumepicWatcher.getConfig();
        const profiles = getProfileConfigs();
        const profile =
          profiles.find((p) => p.id === config.profileId) || profiles[0];

        if (!profile || !profile.token) {
          res
            .status(400)
            .json({
              error: "No photographer token configured for selected profile",
            });
          return;
        }

        const apiBase = LUMEPIC_API_BASE_URL;
        const tokenClean = profile.token.replace(/^Bearer\s+/i, "").trim();

        console.log(
          `[API Watcher] Creating album on Lumepic for event: ${description}`,
        );
        const createRes = await fetch(`${apiBase}/albums`, {
          method: "POST",
          headers: getLumepicAuthHeaders(tokenClean, {
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            description,
            eventId,
            locationId,
            activityId,
            takenDate: takenDate || new Date().toISOString(),
            defaultImagePrice: defaultImagePrice || 15,
            currency: "usd",
            status: "PUBLISHED",
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          res
            .status(createRes.status)
            .json({ error: `Lumepic album creation failed: ${errText}` });
          return;
        }

        const albumJson = (await createRes.json()) as any;
        const newAlbumId = albumJson.id;

        console.log(
          `[API Watcher] Album created successfully! ID: ${newAlbumId}`,
        );
        if (newAlbumId) {
          await lumepicWatcher.updateConfig({ targetAlbumId: newAlbumId });
        }

        res.status(200).json({
          success: true,
          album: albumJson,
        });
        return;
      }

      if (action === "list-album-photographs") {
        const { albumId, profileId } = payload;
        if (!albumId) {
          res.status(400).json({ error: "Missing albumId" });
          return;
        }

        const profiles = getProfileConfigs();
        const profile = profiles.find((p) => p.id === profileId) || profiles[0];
        if (!profile || !profile.token) {
          res
            .status(400)
            .json({
              error: "No photographer token configured for selected profile",
            });
          return;
        }

        const apiBase = LUMEPIC_API_BASE_URL;
        const tokenClean = profile.token.replace(/^Bearer\s+/i, "").trim();

        let allPhotographs: any[] = [];
        let skip = 0;
        const limit = 100;
        let hasMore = true;
        let attempts = 0;
        const maxAttempts = 100;

        try {
          while (hasMore && attempts < maxAttempts) {
            attempts++;
            const url = `${apiBase}/photographs?albumId=${encodeURIComponent(albumId)}&limit=${limit}&skip=${skip}`;
            const fetchRes = await fetch(url, {
              headers: getLumepicAuthHeaders(tokenClean),
            });

            if (!fetchRes.ok) {
              const errText = await fetchRes.text();
              throw new Error(`Failed to fetch photographs: ${errText}`);
            }

            const data = (await fetchRes.json()) as any;
            const items = data.items || [];
            allPhotographs.push(...items);

            if (
              items.length < limit ||
              allPhotographs.length >= (data.count || 0)
            ) {
              hasMore = false;
            } else {
              skip += limit;
            }
          }

          res.status(200).json({
            success: true,
            photographs: allPhotographs,
            count: allPhotographs.length,
          });
        } catch (err: any) {
          console.error("Error listing album photographs:", err);
          res
            .status(500)
            .json({ error: err.message || "Failed to fetch photographs" });
        }
        return;
      }

      if (action === "delete-photograph") {
        const photographId = String(payload.photographId || "").trim();
        if (!photographId) {
          res.status(400).json({ error: "Missing photographId" });
          return;
        }

        const apiBase = LUMEPIC_API_BASE_URL;
        const profiles = getProfileConfigs();
        let lastError = "";

        for (const profile of profiles) {
          if (!profile.token) continue;
          const tokenClean = profile.token.replace(/^Bearer\s+/i, "").trim();
          const deleteRes = await fetch(
            `${apiBase}/photographs/${encodeURIComponent(photographId)}`,
            {
              method: "DELETE",
              headers: getLumepicAuthHeaders(tokenClean),
            },
          );
          const deleteText = await deleteRes.text();
          let deleteJson: any = null;
          try {
            deleteJson = deleteText ? JSON.parse(deleteText) : null;
          } catch {
            deleteJson = null;
          }

          if (!deleteRes.ok) {
            lastError =
              deleteText || `Photograph delete returned ${deleteRes.status}`;
            continue;
          }

          const affected = Number(deleteJson?.affected || 0);
          if (affected > 0) {
            await lumepicWatcher.markPhotographDeleted(photographId);
            const config = await lumepicWatcher.getConfig();
            const history = await lumepicWatcher.getHistory();
            const { albums, allAlbums, events } = await getWatcherDashboardData(
              config,
              true,
            );

            res.status(200).json({
              success: true,
              deletedPhotographId: photographId,
              affected,
              config,
              history,
              albums,
              allAlbums,
              events,
              isRunning: lumepicWatcher.getRunningStatus(),
            });
            return;
          }
        }

        const deletedItem =
          await lumepicWatcher.markPhotographDeleted(photographId);
        if (deletedItem && lastError.includes("PHOTOGRAPH_NOT_FOUND")) {
          const config = await lumepicWatcher.getConfig();
          const history = await lumepicWatcher.getHistory();
          const { albums, allAlbums, events } = await getWatcherDashboardData(
            config,
            true,
          );

          res.status(200).json({
            success: true,
            alreadyDeleted: true,
            deletedPhotographId: photographId,
            affected: 0,
            config,
            history,
            albums,
            allAlbums,
            events,
            isRunning: lumepicWatcher.getRunningStatus(),
          });
          return;
        }

        res.status(404).json({
          error: lastError || "Photograph not found or was already deleted",
          photographId,
        });
        return;
      }

      // Update configuration
      const updatedConfig = await lumepicWatcher.updateConfig(payload);
      const history = await lumepicWatcher.getHistory();
      const { albums, allAlbums, events } = await getWatcherDashboardData(
        updatedConfig,
        true,
      );

      res.status(200).json({
        success: true,
        config: updatedConfig,
        history,
        albums,
        allAlbums,
        events,
        isRunning: lumepicWatcher.getRunningStatus(),
      });
    } catch (err: any) {
      console.error("Error in watcher POST api route:", err);
      res.status(500).json({ error: "Failed to perform watcher action" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
