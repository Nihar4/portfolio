import { getVisitorId, generateVisitorId, appendLog } from "@/lib/log-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let visitorId = getVisitorId(req.headers);
    if (!visitorId) visitorId = generateVisitorId();

    // Store client event and trigger geolocation
    const event = body.event || "client_event";
    await appendLog(req.headers, {
      type: "client",
      endpoint: "/api/log",
      method: "POST",
      time: new Date().toISOString(),
      data: { event, ...(body.data || {}) },
    }, visitorId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in log route:", error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
