#!/usr/bin/env node
/**
 * Backfill script — calls all 8 geo providers for every IP in the MongoDB logs
 * collection and saves the full per-provider result data.
 *
 * Usage: MONGODB_URI="mongodb+srv://..." node script/backfill-geo.mjs
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("❌ Set MONGODB_URI env var first");
    process.exit(1);
}

const DB = process.env.MONGODB_DB || "portfolio";
const COLL = process.env.MONGODB_COLLECTION || "logs";

/* ── provider fetchers (same logic as ip-location.ts) ────── */

const TIMEOUT = 8000;

async function callProvider(name, fn, ip) {
    const fetchedAt = new Date().toISOString();
    try {
        const raw = await fn(ip);
        if (raw && !isNaN(raw.lat) && !isNaN(raw.lng)) {
            return {
                raw,
                prov: {
                    provider: name, status: "success", fetchedAt,
                    lat: raw.lat, lng: raw.lng,
                    city: raw.city, region: raw.region, country: raw.country,
                    timezone: raw.timezone, isp: raw.isp, org: raw.org,
                },
            };
        }
        return { raw: null, prov: { provider: name, status: "failed", fetchedAt, error: "No geo data" } };
    } catch (err) {
        const msg = err?.message || String(err);
        const isTimeout = msg.includes("abort") || msg.includes("timed out");
        return { raw: null, prov: { provider: name, status: isTimeout ? "timeout" : "failed", fetchedAt, error: msg } };
    }
}

const providers = [
    {
        name: "ip-api.com",
        fn: async (ip) => {
            const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName,country,timezone,isp,org`, { signal: AbortSignal.timeout(TIMEOUT) });
            const d = await r.json();
            if (d.status !== "success") return null;
            return { lat: d.lat, lng: d.lon, city: d.city, region: d.regionName, country: d.country, timezone: d.timezone, isp: d.isp, org: d.org };
        },
    },
    {
        name: "ipwho.is",
        fn: async (ip) => {
            const r = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(TIMEOUT) });
            const d = await r.json();
            if (!d.success) return null;
            return { lat: d.latitude, lng: d.longitude, city: d.city, region: d.region, country: d.country, timezone: d.timezone?.id, isp: d.connection?.isp, org: d.connection?.org };
        },
    },
    {
        name: "freeipapi.com",
        fn: async (ip) => {
            const r = await fetch(`https://freeipapi.com/api/json/${ip}`, { signal: AbortSignal.timeout(TIMEOUT) });
            const d = await r.json();
            if (!d.latitude) return null;
            return { lat: d.latitude, lng: d.longitude, city: d.cityName, region: d.regionName, country: d.countryName, timezone: Array.isArray(d.timeZones) ? d.timeZones[0] : d.timeZone };
        },
    },
    {
        name: "ipinfo.io",
        fn: async (ip) => {
            const r = await fetch(`https://ipinfo.io/${ip}/json`, { signal: AbortSignal.timeout(TIMEOUT) });
            const d = await r.json();
            if (!d.loc) return null;
            const [lat, lng] = d.loc.split(",").map(Number);
            if (isNaN(lat) || isNaN(lng)) return null;
            return { lat, lng, city: d.city, region: d.region, country: d.country, timezone: d.timezone, isp: d.org, org: d.org };
        },
    },
    {
        name: "ipgeolocation.io",
        fn: async (ip) => {
            const key = process.env.IPGEOLOCATION_KEY || "a87a5956f4b84873bc8eee9d9bddad89";
            const r = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${key}&ip=${ip}`, { signal: AbortSignal.timeout(TIMEOUT) });
            const d = await r.json();
            if (!d.latitude) return null;
            return { lat: parseFloat(d.latitude), lng: parseFloat(d.longitude), city: d.city, region: d.state_prov, country: d.country_name, timezone: d.time_zone?.name, isp: d.isp, org: d.organization };
        },
    },
    {
        name: "abstractapi.com",
        fn: async (ip) => {
            const key = process.env.ABSTRACTAPI_KEY || "07df72bd82f7462abbd8aa502c2292ac";
            const r = await fetch(`https://ip-intelligence.abstractapi.com/v1/?api_key=${key}&ip_address=${ip}`, { signal: AbortSignal.timeout(TIMEOUT) });
            const d = await r.json();
            if (!d.location?.latitude) return null;
            return { lat: d.location.latitude, lng: d.location.longitude, city: d.location.city || undefined, region: d.location.region || undefined, country: d.location.country, timezone: d.timezone?.name, isp: d.company?.name, org: d.company?.name };
        },
    },
    {
        name: "ipstack.com",
        fn: async (ip) => {
            const key = process.env.IPSTACK_KEY || "ff9707d7528d8a0faa3fe025118ad451";
            const r = await fetch(`http://api.ipstack.com/${ip}?access_key=${key}`, { signal: AbortSignal.timeout(TIMEOUT) });
            const d = await r.json();
            if (!d.latitude || d.success === false) return null;
            return { lat: d.latitude, lng: d.longitude, city: d.city, region: d.region_name, country: d.country_name, timezone: d.time_zone?.id, isp: d.connection?.isp };
        },
    },
];

function roundCoord(n, decimals = 2) {
    const f = Math.pow(10, decimals);
    return Math.round(n * f) / f;
}

async function fetchIpLocation(ip) {
    if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") return null;
    const results = await Promise.all(providers.map(({ name, fn }) => callProvider(name, fn, ip)));
    const providerResults = results.map((r) => r.prov);
    const hits = results.filter((r) => r.raw !== null).map((r) => r.raw);

    let isp, org;
    for (const h of hits) {
        if (!isp && h.isp) isp = h.isp;
        if (!org && h.org) org = h.org;
    }

    const groups = new Map();
    for (const r of hits) {
        const key = `${roundCoord(r.lat)},${roundCoord(r.lng)}`;
        const ex = groups.get(key);
        if (ex) {
            ex.providers.push(r.source || "unknown");
            if (!ex.city && r.city) ex.city = r.city;
            if (!ex.region && r.region) ex.region = r.region;
            if (!ex.country && r.country) ex.country = r.country;
            if (!ex.timezone && r.timezone) ex.timezone = r.timezone;
        } else {
            groups.set(key, {
                latitude: r.lat, longitude: r.lng,
                city: r.city, region: r.region, country: r.country,
                timezone: r.timezone,
                providers: [r.source || "unknown"],
                mapUrl: `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`,
            });
        }
    }

    const locations = [...groups.values()].sort((a, b) => b.providers.length - a.providers.length);

    return { ip, isp, org, locations, providerResults, fetchedAt: new Date().toISOString() };
}

/* ── main ─────────────────────────────────────────────── */

async function main() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const col = client.db(DB).collection(COLL);
    const docs = await col.find({}).toArray();
    console.log(`📋 Found ${docs.length} visitor records`);

    const uniqueIps = [...new Set(docs.map((d) => d.ip).filter((ip) => ip && ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1"))];
    console.log(`🌐 ${uniqueIps.length} unique IPs to process\n`);

    // Build IP → geo map (call each IP once, even if shared among visitors)
    const geoMap = new Map();
    for (let i = 0; i < uniqueIps.length; i++) {
        const ip = uniqueIps[i];
        console.log(`[${i + 1}/${uniqueIps.length}] Fetching ${ip}...`);
        try {
            const geo = await fetchIpLocation(ip);
            if (geo) {
                const ok = geo.providerResults.filter((p) => p.status === "success").length;
                const fail = geo.providerResults.filter((p) => p.status === "failed").length;
                const timeout = geo.providerResults.filter((p) => p.status === "timeout").length;
                console.log(`  ✅ ${ok} success, ❌ ${fail} failed, ⏱ ${timeout} timeout — ${geo.locations[0]?.city || "?"}, ${geo.locations[0]?.country || "?"}`);
                geoMap.set(ip, geo);
            } else {
                console.log(`  ⚠️  No data returned`);
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
        }

        // Small delay to avoid rate-limiting across providers
        if (i < uniqueIps.length - 1) {
            await new Promise((r) => setTimeout(r, 1500));
        }
    }

    // Update all visitor docs
    let updated = 0;
    for (const doc of docs) {
        const geo = geoMap.get(doc.ip);
        if (geo) {
            await col.updateOne({ _id: doc._id }, { $set: { geoLocation: geo } });
            updated++;
        }
    }

    console.log(`\n🎯 Updated ${updated}/${docs.length} visitor records`);
    console.log("✅ Backfill complete!");

    await client.close();
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
