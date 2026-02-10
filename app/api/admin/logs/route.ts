import { loadLogs, deleteVisitorLog, deleteAllLogs, refetchGeoForVisitor, refetchGeoForAll } from "@/lib/log-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await loadLogs();
    const visitors = Object.values(store).sort((a, b) => {
      const aTime = a.meta?.lastSeen || "";
      const bTime = b.meta?.lastSeen || "";
      return bTime.localeCompare(aTime);
    });
    return Response.json({ ok: true, visitors, count: visitors.length });
  } catch (error) {
    console.error("Error loading logs:", error);
    return Response.json({ ok: false, error: "Failed to load logs" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { visitorId } = await req.json().catch(() => ({ visitorId: undefined }));

    if (visitorId === "__ALL__") {
      const count = await deleteAllLogs();
      return Response.json({ ok: true, deleted: count });
    }

    if (!visitorId) {
      return Response.json({ ok: false, error: "Missing visitorId" }, { status: 400 });
    }

    const deleted = await deleteVisitorLog(visitorId);
    return Response.json({ ok: true, deleted: deleted ? 1 : 0 });
  } catch (error) {
    console.error("Error deleting log:", error);
    return Response.json({ ok: false, error: "Failed to delete" }, { status: 500 });
  }
}

/** PATCH — re-fetch geolocation for a visitor (or all visitors) */
export async function PATCH(req: Request) {
  try {
    const { visitorId, ip } = await req.json().catch(() => ({ visitorId: undefined, ip: undefined }));

    if (visitorId === "__ALL__") {
      // Re-fetch for ALL visitors (full backfill)
      const { updated, failed } = await refetchGeoForAll();
      return Response.json({ ok: true, updated, failed });
    }

    if (!ip) return Response.json({ ok: false, error: "Missing ip" }, { status: 400 });

    const geo = await refetchGeoForVisitor(ip, visitorId);
    if (!geo) return Response.json({ ok: false, error: "Could not resolve location" }, { status: 404 });

    return Response.json({ ok: true, geoLocation: geo });
  } catch (error) {
    console.error("Error fetching geolocation:", error);
    return Response.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
