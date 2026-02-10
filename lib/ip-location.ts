/**
 * IP Geolocation service — calls 8 providers in parallel, stores every
 * provider's raw result (success / failed / timeout), deduplicates by
 * lat/lng for a summary, and generates Google Maps URLs.
 *
 * SAFETY: every public function is wrapped so failures never propagate.
 */

/* ── exported types ───────────────────────────────────── */

export type ProviderResult = {
  provider: string;
  status: "success" | "failed" | "timeout";
  fetchedAt: string;
  lat?: number;
  lng?: number;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  isp?: string;
  org?: string;
  error?: string;
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  providers: string[];
  mapUrl: string;
};

export type IpLocationResult = {
  ip: string;
  isp?: string;
  org?: string;
  locations: GeoPoint[];
  providerResults: ProviderResult[];
  fetchedAt: string;
};

/* ── internal raw type ────────────────────────────────── */

type RawGeo = {
  source: string;
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  isp?: string;
  org?: string;
};

/* ── individual provider fetchers ─────────────────────── */
/* No try/catch — errors bubble to the callProvider wrapper */

async function fetchIpApi(ip: string): Promise<RawGeo | null> {
  const res = await fetch(
    `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName,country,timezone,isp,org`,
    { signal: AbortSignal.timeout(6000) },
  );
  const d = await res.json();
  if (d.status !== "success") return null;
  return {
    source: "ip-api.com",
    lat: d.lat, lng: d.lon,
    city: d.city, region: d.regionName, country: d.country,
    timezone: d.timezone, isp: d.isp, org: d.org,
  };
}

async function fetchIpWhoIs(ip: string): Promise<RawGeo | null> {
  const res = await fetch(`https://ipwho.is/${ip}`, {
    signal: AbortSignal.timeout(6000),
  });
  const d = await res.json();
  if (!d.success) return null;
  return {
    source: "ipwho.is",
    lat: d.latitude, lng: d.longitude,
    city: d.city, region: d.region, country: d.country,
    timezone: d.timezone?.id, isp: d.connection?.isp, org: d.connection?.org,
  };
}

async function fetchFreeIpApi(ip: string): Promise<RawGeo | null> {
  const res = await fetch(`https://freeipapi.com/api/json/${ip}`, {
    signal: AbortSignal.timeout(6000),
  });
  const d = await res.json();
  if (!d.latitude) return null;
  return {
    source: "freeipapi.com",
    lat: d.latitude, lng: d.longitude,
    city: d.cityName, region: d.regionName, country: d.countryName,
    timezone: Array.isArray(d.timeZones) ? d.timeZones[0] : d.timeZone,
  };
}

async function fetchIpInfo(ip: string): Promise<RawGeo | null> {
  const res = await fetch(`https://ipinfo.io/${ip}/json`, {
    signal: AbortSignal.timeout(6000),
  });
  const d = await res.json();
  if (!d.loc) return null;
  const [lat, lng] = d.loc.split(",").map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return {
    source: "ipinfo.io",
    lat, lng,
    city: d.city, region: d.region, country: d.country,
    timezone: d.timezone, isp: d.org, org: d.org,
  };
}


async function fetchIpGeolocationIo(ip: string): Promise<RawGeo | null> {
  const key = process.env.IPGEOLOCATION_KEY || "a87a5956f4b84873bc8eee9d9bddad89";
  const res = await fetch(
    `https://api.ipgeolocation.io/ipgeo?apiKey=${key}&ip=${ip}`,
    { signal: AbortSignal.timeout(6000) },
  );
  const d = await res.json();
  if (!d.latitude) return null;
  return {
    source: "ipgeolocation.io",
    lat: parseFloat(d.latitude), lng: parseFloat(d.longitude),
    city: d.city, region: d.state_prov, country: d.country_name,
    timezone: d.time_zone?.name, isp: d.isp, org: d.organization,
  };
}

async function fetchAbstractApi(ip: string): Promise<RawGeo | null> {
  const key = process.env.ABSTRACTAPI_KEY || "07df72bd82f7462abbd8aa502c2292ac";
  const res = await fetch(
    `https://ip-intelligence.abstractapi.com/v1/?api_key=${key}&ip_address=${ip}`,
    { signal: AbortSignal.timeout(6000) },
  );
  const d = await res.json();
  if (!d.location?.latitude) return null;
  return {
    source: "abstractapi.com",
    lat: d.location.latitude, lng: d.location.longitude,
    city: d.location.city || undefined, region: d.location.region || undefined,
    country: d.location.country, timezone: d.timezone?.name,
    isp: d.company?.name, org: d.company?.name,
  };
}

async function fetchIpStack(ip: string): Promise<RawGeo | null> {
  const key = process.env.IPSTACK_KEY || "ff9707d7528d8a0faa3fe025118ad451";
  const res = await fetch(
    `http://api.ipstack.com/${ip}?access_key=${key}`,
    { signal: AbortSignal.timeout(6000) },
  );
  const d = await res.json();
  if (!d.latitude || d.success === false) return null;
  return {
    source: "ipstack.com",
    lat: d.latitude, lng: d.longitude,
    city: d.city, region: d.region_name, country: d.country_name,
    timezone: d.time_zone?.id, isp: d.connection?.isp,
  };
}

/* ── provider registry ────────────────────────────────── */

const PROVIDERS: { name: string; fn: (ip: string) => Promise<RawGeo | null> }[] = [
  { name: "ip-api.com",       fn: fetchIpApi },
  { name: "ipwho.is",         fn: fetchIpWhoIs },
  { name: "freeipapi.com",    fn: fetchFreeIpApi },
  { name: "ipinfo.io",        fn: fetchIpInfo },
  { name: "ipgeolocation.io", fn: fetchIpGeolocationIo },
  { name: "abstractapi.com",  fn: fetchAbstractApi },
  { name: "ipstack.com",      fn: fetchIpStack },
];

/* ── provider call wrapper (captures success/fail/timeout) ── */

type CallResult = { raw: RawGeo | null; prov: ProviderResult };

async function callProvider(
  name: string,
  fn: (ip: string) => Promise<RawGeo | null>,
  ip: string,
): Promise<CallResult> {
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
    return {
      raw: null,
      prov: { provider: name, status: "failed", fetchedAt, error: "No geo data in response" },
    };
  } catch (err: unknown) {
    const isTimeout =
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.message.includes("timed out")) ||
      (err instanceof Error && err.message.includes("abort"));
    return {
      raw: null,
      prov: {
        provider: name,
        status: isTimeout ? "timeout" : "failed",
        fetchedAt,
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/* ── helpers ──────────────────────────────────────────── */

function roundCoord(n: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function makeMapUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/* ── public API ───────────────────────────────────────── */

/**
 * Fetch geolocation from all 8 providers for the given IP.
 * Returns per-provider results (including failures) plus a deduplicated summary.
 * NEVER throws — returns null only for invalid/local IPs.
 */
export async function fetchIpLocation(
  ip: string,
): Promise<IpLocationResult | null> {
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") return null;

  try {
    const callResults = await Promise.all(
      PROVIDERS.map(({ name, fn }) => callProvider(name, fn, ip)),
    );

    const providerResults = callResults.map((cr) => cr.prov);
    const hits = callResults
      .filter((cr): cr is CallResult & { raw: RawGeo } => cr.raw !== null);

    let isp: string | undefined;
    let org: string | undefined;
    for (const { raw } of hits) {
      if (!isp && raw.isp) isp = raw.isp;
      if (!org && raw.org) org = raw.org;
    }

    /* deduplicate by rounded lat/lng */
    const groups = new Map<string, GeoPoint>();
    for (const { raw } of hits) {
      const key = `${roundCoord(raw.lat)},${roundCoord(raw.lng)}`;
      const existing = groups.get(key);
      if (existing) {
        existing.providers.push(raw.source);
        if (!existing.city && raw.city) existing.city = raw.city;
        if (!existing.region && raw.region) existing.region = raw.region;
        if (!existing.country && raw.country) existing.country = raw.country;
        if (!existing.timezone && raw.timezone) existing.timezone = raw.timezone;
      } else {
        groups.set(key, {
          latitude: raw.lat,
          longitude: raw.lng,
          city: raw.city,
          region: raw.region,
          country: raw.country,
          timezone: raw.timezone,
          providers: [raw.source],
          mapUrl: makeMapUrl(raw.lat, raw.lng),
        });
      }
    }

    const locations = [...groups.values()].sort(
      (a, b) => b.providers.length - a.providers.length,
    );

    return {
      ip,
      isp,
      org,
      locations,
      providerResults,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    /* absolute safety net — never crash */
    return null;
  }
}
