import { loadLogs } from "@/lib/log-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await loadLogs();
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error reading logs:", error);
    return new Response(JSON.stringify({ error: "Failed to read logs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
