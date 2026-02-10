import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { appendLog, getVisitorId, generateVisitorId } from "@/lib/log-store";

export async function GET(req: Request) {
    try {
        let visitorId = getVisitorId(req.headers);
        if (!visitorId) visitorId = generateVisitorId();

        await appendLog(req.headers, {
            type: "api",
            endpoint: "/api/projects",
            method: "GET",
            time: new Date().toISOString(),
        }, visitorId);

        const filePath = path.join(process.cwd(), "data", "data.json");
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "data.json not found" }, { status: 500 });
        }
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        return NextResponse.json(parsed);
    } catch (error) {
        console.error("Error loading projects:", error);
        return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
    }
}
