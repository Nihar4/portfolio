"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MessageSquare,
  Eye,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  Trash2,
  MapPin,
  Navigation,
  ExternalLink,
} from "lucide-react";

/* ── types ─────────────────────────────────────────────── */

type LogEvent = {
  type: string;
  endpoint?: string;
  method?: string;
  time: string;
  message?: string;
  data?: Record<string, unknown>;
};

type GeoPoint = {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  providers: string[];
  mapUrl: string;
};

type ProviderResult = {
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

type GeoLocation = {
  ip: string;
  isp?: string;
  org?: string;
  locations: GeoPoint[];
  providerResults?: ProviderResult[];
  fetchedAt: string;
} | null;

type Visitor = {
  visitorId: string;
  ip: string;
  meta: {
    userAgent?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    location?: Record<string, string | undefined>;
    gcpLatLon?: string;
    lastSeen?: string;
  };
  geoLocation?: GeoLocation;
  events: LogEvent[];
};

/* ── helpers ───────────────────────────────────────────── */

const toPST = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }) + " PST";
  } catch {
    return iso;
  }
};

const shortPST = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
};

const DeviceIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case "mobile":
      return <Smartphone className="w-4 h-4" />;
    case "tablet":
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
};

const eventColor = (type: string) => {
  switch (type) {
    case "chat":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "api":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "client":
      return "bg-green-500/15 text-green-400 border-green-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

/* ── page ──────────────────────────────────────────────── */

export default function AdminLogsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fetchingGeo, setFetchingGeo] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      if (data.ok) {
        setVisitors(data.visitors);
        setError(null);
      } else {
        setError(data.error || "Failed to load logs");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const deleteVisitor = async (visitorId: string) => {
    if (!confirm("Delete this visitor and all their events?")) return;
    setDeleting(visitorId);
    try {
      await fetch("/api/admin/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      setVisitors((prev) => prev.filter((v) => v.visitorId !== visitorId));
      setExpandedIds((prev) => { const n = new Set(prev); n.delete(visitorId); return n; });
    } catch {} finally {
      setDeleting(null);
    }
  };

  const deleteAll = async () => {
    if (!confirm(`Delete ALL ${visitors.length} visitor records? This cannot be undone.`)) return;
    setDeleting("__ALL__");
    try {
      await fetch("/api/admin/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: "__ALL__" }),
      });
      setVisitors([]);
      setExpandedIds(new Set());
    } catch {} finally {
      setDeleting(null);
    }
  };

  const fetchGeoForVisitor = async (visitorId: string, ip: string) => {
    setFetchingGeo(visitorId);
    try {
      const res = await fetch("/api/admin/logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, ip }),
      });
      const data = await res.json();
      if (data.ok && data.geoLocation) {
        setVisitors((prev) =>
          prev.map((v) => v.visitorId === visitorId ? { ...v, geoLocation: data.geoLocation } : v)
        );
      }
    } catch {} finally {
      setFetchingGeo(null);
    }
  };

  const fetchAllGeo = async () => {
    setFetchingGeo("__ALL__");
    try {
      await fetch("/api/admin/logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: "__ALL__" }),
      });
      await fetchLogs();
    } catch {} finally {
      setFetchingGeo(null);
    }
  };

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(filtered.map((v) => v.visitorId)));
  const collapseAll = () => setExpandedIds(new Set());

  /* ── derived stats ─────────────────────────────────── */

  const totalEvents = visitors.reduce((s, v) => s + v.events.length, 0);
  const chatEvents = visitors.reduce(
    (s, v) => s + v.events.filter((e) => e.type === "chat").length,
    0,
  );
  const pageViews = visitors.reduce(
    (s, v) =>
      s +
      v.events.filter(
        (e) => e.type === "client" && (e.data as any)?.path,
      ).length,
    0,
  );

  /* ── filtering ─────────────────────────────────────── */

  const filtered = visitors.filter((v) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      v.visitorId.toLowerCase().includes(q) ||
      v.ip.toLowerCase().includes(q) ||
      (v.meta.browser || "").toLowerCase().includes(q) ||
      (v.meta.os || "").toLowerCase().includes(q) ||
      v.events.some((e) => e.message?.toLowerCase().includes(q));

    const matchesType =
      filterType === "all" ||
      v.events.some((e) => e.type === filterType);

    return matchesSearch && matchesType;
  });

  /* ── render ────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background text-foreground select-text" style={{ userSelect: "text", WebkitUserSelect: "text" }}>
      {/* header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-lg font-bold tracking-tight">
              Admin<span className="text-primary">/</span>Logs
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllGeo}
              disabled={!!fetchingGeo}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              <MapPin className={`w-3.5 h-3.5 ${fetchingGeo === "__ALL__" ? "animate-pulse" : ""}`} />
              Fetch All Geo
            </button>
            <button
              onClick={deleteAll}
              disabled={!!deleting || visitors.length === 0}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete All
            </button>
            <button
              onClick={fetchLogs}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-border/50 bg-card/60 hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Visitors", value: visitors.length, icon: <Users className="w-4 h-4" />, color: "text-blue-400" },
            { label: "Total Events", value: totalEvents, icon: <Eye className="w-4 h-4" />, color: "text-green-400" },
            { label: "Chat Messages", value: chatEvents, icon: <MessageSquare className="w-4 h-4" />, color: "text-purple-400" },
            { label: "Page Views", value: pageViews, icon: <Globe className="w-4 h-4" />, color: "text-amber-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by IP, visitor ID, browser, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-card/60 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border/50 bg-card/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="all">All Types</option>
              <option value="chat">Chat</option>
              <option value="client">Client</option>
              <option value="api">API</option>
            </select>
            <button
              onClick={expandAll}
              className="px-3 py-2 rounded-lg border border-border/50 bg-card/60 text-xs hover:bg-muted/60 transition-colors whitespace-nowrap"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 rounded-lg border border-border/50 bg-card/60 text-xs hover:bg-muted/60 transition-colors whitespace-nowrap"
            >
              Collapse All
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {visitors.length} visitors
        </p>

        {/* loading state */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl" style={{ height: 80 }} />
            ))}
          </div>
        )}

        {/* error state */}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* visitor list */}
        {!loading && !error && (
          <div className="space-y-3">
            {filtered.map((visitor) => {
              const isExpanded = expandedIds.has(visitor.visitorId);
              const chatCount = visitor.events.filter((e) => e.type === "chat").length;
              const filteredEvents =
                filterType === "all"
                  ? visitor.events
                  : visitor.events.filter((e) => e.type === filterType);

              return (
                <div
                  key={visitor.visitorId}
                  className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden"
                >
                  {/* visitor header */}
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <button
                      onClick={() => toggle(visitor.visitorId)}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 cursor-text" onClick={() => toggle(visitor.visitorId)}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-sm font-medium truncate max-w-[200px]">
                          {visitor.ip}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DeviceIcon type={visitor.meta.deviceType} />
                          <span>{visitor.meta.browser || "?"}</span>
                          <span className="text-border">|</span>
                          <span>{visitor.meta.os || "?"}</span>
                        </div>
                        {visitor.meta.location?.country && (
                          <span className="text-xs text-muted-foreground">
                            📍 {[visitor.meta.location.city, visitor.meta.location.region, visitor.meta.location.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono text-[10px] opacity-60 truncate max-w-[220px]">
                          {visitor.visitorId}
                        </span>
                        {visitor.meta.lastSeen && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {shortPST(visitor.meta.lastSeen)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                        {visitor.events.length} events
                      </span>
                      {chatCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                          {chatCount} chats
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteVisitor(visitor.visitorId); }}
                        disabled={deleting === visitor.visitorId}
                        className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        aria-label="Delete visitor"
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${deleting === visitor.visitorId ? "animate-pulse" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* expanded: geo + events */}
                  {isExpanded && (
                    <div className="border-t border-border/30">
                      {/* geo location panel */}
                      <div className="px-4 py-3 border-b border-border/20 bg-muted/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Navigation className="w-3 h-3" /> Geolocation
                          </h4>
                          <button
                            onClick={() => fetchGeoForVisitor(visitor.visitorId, visitor.ip)}
                            disabled={fetchingGeo === visitor.visitorId}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-border/40 bg-card/60 hover:bg-muted/60 transition-colors disabled:opacity-50"
                          >
                            <MapPin className={`w-3 h-3 ${fetchingGeo === visitor.visitorId ? "animate-spin" : ""}`} />
                            {visitor.geoLocation ? "Re-fetch" : "Fetch"}
                          </button>
                        </div>
                        {visitor.geoLocation && visitor.geoLocation.locations.length > 0 ? (
                          <div className="space-y-2">
                            {visitor.meta.gcpLatLon && (
                              <p className="text-xs text-muted-foreground">
                                <span className="text-foreground font-medium">GCP LB Lat/Lon:</span>{" "}
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${visitor.meta.gcpLatLon}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline font-mono"
                                >
                                  {visitor.meta.gcpLatLon}
                                </a>
                              </p>
                            )}
                            {visitor.geoLocation.isp && (
                              <p className="text-xs text-muted-foreground">
                                <span className="text-foreground font-medium">ISP:</span> {visitor.geoLocation.isp}
                              </p>
                            )}
                            {visitor.geoLocation.locations.map((loc, li) => (
                              <div key={li} className="p-3 rounded-lg border border-border/30 bg-card/40 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <p className="text-sm font-medium">
                                      📍 {[loc.city, loc.region, loc.country].filter(Boolean).join(", ") || "Unknown"}
                                    </p>
                                    <p className="text-xs font-mono text-muted-foreground">
                                      {loc.latitude}, {loc.longitude}
                                    </p>
                                    {loc.timezone && (
                                      <p className="text-xs text-muted-foreground">🕐 {loc.timezone}</p>
                                    )}
                                  </div>
                                  <a
                                    href={loc.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Google Maps
                                  </a>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {loc.providers.map((p, pi) => (
                                    <span key={`${p}-${pi}`} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* Per-provider status breakdown */}
                            {visitor.geoLocation.providerResults && visitor.geoLocation.providerResults.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/20">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                  Provider Status ({visitor.geoLocation.providerResults.filter(p => p.status === "success").length}/{visitor.geoLocation.providerResults.length} success)
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  {visitor.geoLocation.providerResults.map((pr) => (
                                    <div
                                      key={pr.provider}
                                      className={`p-2 rounded-lg border text-[10px] space-y-0.5 ${
                                        pr.status === "success"
                                          ? "border-green-500/30 bg-green-500/5"
                                          : pr.status === "timeout"
                                            ? "border-yellow-500/30 bg-yellow-500/5"
                                            : "border-red-500/30 bg-red-500/5"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono font-medium truncate">{pr.provider}</span>
                                        <span className={`font-bold ${
                                          pr.status === "success" ? "text-green-400" : pr.status === "timeout" ? "text-yellow-400" : "text-red-400"
                                        }`}>
                                          {pr.status === "success" ? "✓" : pr.status === "timeout" ? "⏱" : "✗"}
                                        </span>
                                      </div>
                                      {pr.status === "success" && pr.city && (
                                        <p className="text-muted-foreground truncate">{[pr.city, pr.region, pr.country].filter(Boolean).join(", ")}</p>
                                      )}
                                      {pr.status === "success" && pr.lat != null && (
                                        <p className="text-muted-foreground/60 font-mono">{pr.lat}, {pr.lng}</p>
                                      )}
                                      {pr.status !== "success" && pr.error && (
                                        <p className="text-muted-foreground/60 truncate" title={pr.error}>{pr.error}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-[10px] text-muted-foreground/50">
                              Fetched: {toPST(visitor.geoLocation.fetchedAt)}
                            </p>
                          </div>
                        ) : visitor.geoLocation && visitor.geoLocation.providerResults && visitor.geoLocation.providerResults.length > 0 ? (
                          /* All providers failed but we have status data */
                          <div className="space-y-2">
                            <p className="text-xs text-red-400/80 font-medium">All providers failed for this IP</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {visitor.geoLocation.providerResults.map((pr) => (
                                <div
                                  key={pr.provider}
                                  className={`p-2 rounded-lg border text-[10px] space-y-0.5 ${
                                    pr.status === "timeout" ? "border-yellow-500/30 bg-yellow-500/5" : "border-red-500/30 bg-red-500/5"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-medium truncate">{pr.provider}</span>
                                    <span className={pr.status === "timeout" ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>
                                      {pr.status === "timeout" ? "⏱" : "✗"}
                                    </span>
                                  </div>
                                  {pr.error && <p className="text-muted-foreground/60 truncate" title={pr.error}>{pr.error}</p>}
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground/50">
                              Fetched: {toPST(visitor.geoLocation.fetchedAt)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 italic">
                            {fetchingGeo === visitor.visitorId ? "Fetching from all 8 providers..." : "No geolocation data. Click Fetch to resolve."}
                          </p>
                        )}
                      </div>

                      {/* events table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/30 text-muted-foreground">
                              <th className="text-left px-4 py-2 font-medium w-[180px]">Time (PST)</th>
                              <th className="text-left px-4 py-2 font-medium w-[80px]">Type</th>
                              <th className="text-left px-4 py-2 font-medium w-[140px]">Endpoint</th>
                              <th className="text-left px-4 py-2 font-medium">Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...filteredEvents]
                              .sort((a, b) => b.time.localeCompare(a.time))
                              .map((event, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-border/20 last:border-0 hover:bg-muted/20"
                                >
                                  <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                                    {toPST(event.time)}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${eventColor(event.type)}`}
                                    >
                                      {event.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-muted-foreground">
                                    {event.method && (
                                      <span className="text-primary font-semibold mr-1">
                                        {event.method}
                                      </span>
                                    )}
                                    {event.endpoint || "—"}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {event.message && (
                                      <p className="text-foreground mb-1 break-all">
                                        💬 {event.message}
                                      </p>
                                    )}
                                    {event.data && Object.keys(event.data).length > 0 && (
                                      <pre className="text-[10px] text-muted-foreground bg-muted/40 rounded px-2 py-1 overflow-x-auto max-w-md">
                                        {JSON.stringify(event.data, null, 2)}
                                      </pre>
                                    )}
                                    {!event.message &&
                                      (!event.data || Object.keys(event.data).length === 0) && (
                                        <span className="text-muted-foreground/50">—</span>
                                      )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      {filteredEvents.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No events match the current filter.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">No visitors found</p>
                <p className="text-sm mt-1">Try adjusting your search or filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
