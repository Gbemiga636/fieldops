"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Map,
  List,
  Users,
  MapPin,
  Clock,
  LogOut,
  RefreshCw,
  X,
  ChevronDown,
  Navigation,
  Monitor,
  Globe,
  Crosshair,
} from "lucide-react";
import Logo from "@/components/Logo";
import AnimatedBackground from "@/components/AnimatedBackground";
import PasswordSetupModal from "@/components/PasswordSetupModal";
import { supabase, type LocationShare } from "@/lib/supabase";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] rounded-xl bg-white/5 flex items-center justify-center">
      <RefreshCw className="animate-spin text-white/30" size={24} />
    </div>
  ),
});

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<LocationShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLocations = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/locations?${params}`);
    const data = await res.json();
    if (data.data) setLocations(data.data);
    setLoading(false);
  }, [search, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/auth/session");
      const data = await res.json();

      if (!data.authenticated) {
        router.push("/admin/login");
        return;
      }

      setUsername(data.username);

      if (
        data.needsPasswordSetup ||
        searchParams.get("setup") === "password"
      ) {
        setShowPasswordModal(true);
      }
    }
    checkSession();
  }, [router, searchParams]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    const channel = supabase
      .channel("location_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "location_shares" },
        () => fetchLocations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLocations]);

  const stats = useMemo(() => {
    const today = locations.filter((l) => isToday(parseISO(l.shared_at)));
    const uniqueAgents = new Set(locations.map((l) => l.agent_name));
    const active = locations.filter(
      (l) =>
        Date.now() - new Date(l.shared_at).getTime() < 30 * 60 * 1000
    );
    return {
      total: locations.length,
      today: today.length,
      agents: uniqueAgents.size,
      active: active.length,
    };
  }, [locations]);

  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return `Today, ${format(date, "HH:mm:ss")}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, "HH:mm:ss")}`;
    return format(date, "MMM d, yyyy HH:mm:ss");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this location record?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/locations/${id}`, { method: "DELETE" });
      setLocations((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = () => {
    const headers = [
      "Agent Name",
      "Date",
      "Time",
      "Latitude",
      "Longitude",
      "Accuracy (m)",
      "Address",
      "Device",
      "Browser",
      "Status",
    ];
    const rows = locations.map((l) => {
      const d = parseISO(l.shared_at);
      return [
        l.agent_name,
        format(d, "yyyy-MM-dd"),
        format(d, "HH:mm:ss"),
        l.latitude,
        l.longitude,
        l.accuracy ?? "",
        l.address ?? "",
        l.device ?? "",
        l.browser ?? "",
        l.status,
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fieldops-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
  };

  const hasFilters = search || dateFrom || dateTo || statusFilter !== "all";

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <PasswordSetupModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onRemindLater={() => setShowPasswordModal(false)}
        onPasswordSet={() => setShowPasswordModal(false)}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 glass sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50 hidden sm:block">
              Welcome, <span className="text-white font-medium">{username}</span>
            </span>
            <button onClick={handleLogout} className="btn-ghost text-sm py-2 px-3">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Shares", value: stats.total, icon: MapPin, color: "from-blue-500 to-cyan-500" },
            { label: "Today", value: stats.today, icon: Clock, color: "from-emerald-500 to-teal-500" },
            { label: "Unique Agents", value: stats.agents, icon: Users, color: "from-violet-500 to-purple-500" },
            { label: "Active Now", value: stats.active, icon: Navigation, color: "from-orange-500 to-amber-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80`}>
                  <stat.icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field-input pl-10"
                placeholder="Search by agent name or location..."
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-ghost text-sm ${showFilters ? "bg-white/10" : ""}`}
              >
                <Filter size={16} />
                Filters
                {hasFilters && (
                  <span className="w-2 h-2 rounded-full bg-mc-cyan" />
                )}
              </button>

              <button onClick={fetchLocations} className="btn-ghost text-sm">
                <RefreshCw size={16} />
              </button>

              <button onClick={handleExport} className="btn-ghost text-sm">
                <Download size={16} />
                Export
              </button>

              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
                    viewMode === "map"
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <Map size={16} />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div>
                  <label className="text-xs text-white/40 mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="field-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="field-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Status</label>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="field-input text-sm appearance-none pr-8"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                    />
                  </div>
                </div>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn-ghost text-sm sm:col-span-3 justify-center"
                  >
                    <X size={14} />
                    Clear All Filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="animate-spin text-mc-cyan" size={32} />
          </div>
        ) : locations.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <MapPin size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-white/60 mb-2">
              No location shares yet
            </h3>
            <p className="text-sm text-white/30">
              Share the agent link with your field team to start receiving locations
            </p>
          </div>
        ) : viewMode === "map" ? (
          <div className="glass-card rounded-2xl p-2 h-[500px]">
            <MapView
              locations={locations}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((loc, i) => {
              const isRecent =
                Date.now() - new Date(loc.shared_at).getTime() < 30 * 60 * 1000;

              return (
                <motion.div
                  key={loc.id}
                  className={`glass-card rounded-2xl p-5 transition-all hover:border-white/20 ${
                    selectedId === loc.id ? "ring-1 ring-mc-cyan/50" : ""
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  onClick={() => setSelectedId(loc.id)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-mc-blue/30 to-mc-cyan/30 flex items-center justify-center shrink-0 border border-white/10">
                        <span className="text-sm font-bold text-mc-cyan">
                          {loc.agent_name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-white">
                            {loc.agent_name}
                          </h3>
                          {isRecent ? (
                            <span className="badge-active">Active</span>
                          ) : (
                            <span className="badge-inactive">Inactive</span>
                          )}
                        </div>

                        <p className="text-sm text-white/50 truncate mb-2">
                          <Globe size={12} className="inline mr-1 opacity-50" />
                          {loc.address || "Address unavailable"}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(loc.shared_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Crosshair size={12} />
                            {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </span>
                          {loc.accuracy && (
                            <span>±{Math.round(loc.accuracy)}m accuracy</span>
                          )}
                          {loc.device && (
                            <span className="flex items-center gap-1">
                              <Monitor size={12} />
                              {loc.device} · {loc.browser}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost text-xs py-2 px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin size={14} />
                        Open Map
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(loc.id);
                        }}
                        disabled={deleting === loc.id}
                        className="btn-danger"
                      >
                        <Trash2 size={14} />
                        {deleting === loc.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="animate-spin text-mc-cyan" size={32} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
