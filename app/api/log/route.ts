import { getVisitorId, generateVisitorId } from "@/lib/log-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let visitorId = getVisitorId(req.headers);
    const isNew = !visitorId;
    if (!visitorId) visitorId = generateVisitorId();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isNew) {
      headers["Set-Cookie"] =
        `visitor_id=${visitorId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error in log route:", error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
