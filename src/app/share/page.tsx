"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  Crosshair,
  Signal,
  ExternalLink,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import BackToHome from "@/components/BackToHome";
import {
  getDeviceInfo,
  getBrowserInfo,
} from "@/lib/device";
import {
  acquireBestPosition,
  startLiveTracker,
  getGeoErrorMessage,
  formatAccuracy,
  type AcquireProgress,
} from "@/lib/geolocation";

const AGENT_NAME_KEY = "fieldops_agent_name";

export default function ShareLocationPage() {
  const [agentName, setAgentName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [sharing, setSharing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [gpsProgress, setGpsProgress] = useState<AcquireProgress | null>(null);
  const [lastShare, setLastShare] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    address: string;
    time: string;
  } | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const stopTrackerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AGENT_NAME_KEY);
    if (stored) {
      setAgentName(stored);
      setSavedName(stored);
    }
    return () => stopTrackerRef.current?.();
  }, []);

  const shareLocation = useCallback(
    async (position: GeolocationPosition) => {
      const name = agentName.trim() || savedName;
      if (!name) {
        setError("Please enter your name first");
        return false;
      }

      localStorage.setItem(AGENT_NAME_KEY, name);
      setSavedName(name);

      const { latitude, longitude, accuracy } = position.coords;

      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: name,
          latitude,
          longitude,
          accuracy,
          device: getDeviceInfo(),
          browser: getBrowserInfo(),
          status: "active",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to share location");
      }

      const { data } = await res.json();

      setLastShare({
        lat: latitude,
        lng: longitude,
        accuracy,
        address: data?.address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        time: new Date().toLocaleString(),
      });
      setSuccess(true);
      setError("");

      return true;
    },
    [agentName, savedName]
  );

  const handleShare = async () => {
    const name = agentName.trim();
    if (!name) {
      setError("Please enter your name");
      return;
    }

    if (!navigator.geolocation) {
      setError(getGeoErrorMessage("UNSUPPORTED"));
      return;
    }

    setSharing(true);
    setError("");
    setSuccess(false);
    setGpsProgress({ samples: 0, bestAccuracy: null, phase: "searching" });

    try {
      const position = await acquireBestPosition(setGpsProgress);
      await shareLocation(position);
    } catch (err) {
      const code = err instanceof Error ? err.message : "UNAVAILABLE";
      setError(
        getGeoErrorMessage(
          code as "PERMISSION_DENIED" | "UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED"
        )
      );
    } finally {
      setSharing(false);
      setGpsProgress(null);
    }
  };

  const toggleLiveSharing = async () => {
    if (isWatching) {
      stopTrackerRef.current?.();
      stopTrackerRef.current = null;
      setIsWatching(false);
      return;
    }

    const name = agentName.trim() || savedName;
    if (!name) {
      setError("Please enter your name first");
      return;
    }

    if (!navigator.geolocation) {
      setError(getGeoErrorMessage("UNSUPPORTED"));
      return;
    }

    setError("");
    setSharing(true);
    setGpsProgress({ samples: 0, bestAccuracy: null, phase: "searching" });

    try {
      const position = await acquireBestPosition(setGpsProgress);
      await shareLocation(position);
    } catch (err) {
      const code = err instanceof Error ? err.message : "UNAVAILABLE";
      setError(getGeoErrorMessage(code as "PERMISSION_DENIED" | "UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED"));
      setSharing(false);
      setGpsProgress(null);
      return;
    }

    setSharing(false);
    setGpsProgress(null);
    setIsWatching(true);

    stopTrackerRef.current = startLiveTracker({
      onPosition: async (position) => {
        try {
          await shareLocation(position);
        } catch {
          /* keep tracking on transient errors */
        }
      },
      onError: (code) => setError(getGeoErrorMessage(code)),
    });
  };

  const progressLabel =
    gpsProgress?.phase === "searching"
      ? "Getting your GPS fix..."
      : gpsProgress?.phase === "refining"
        ? "Fine-tuning accuracy..."
        : "Location locked";

  return (
    <div className="relative min-h-[100dvh] flex flex-col safe-bottom">
      <AnimatedBackground />

      <header className="relative z-10 px-4 pt-safe py-4 max-w-lg mx-auto w-full shrink-0 flex items-center justify-between gap-3">
        <Logo size="sm" showTagline />
        <BackToHome />
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-4 pb-4 max-w-lg mx-auto w-full">
        <motion.div
          className="flex-1 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="glass-card rounded-3xl p-5 sm:p-8 flex-1 flex flex-col"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
          >
            <div className="text-center mb-6">
              <motion.div
                className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-mc-blue/20 to-mc-cyan/20 flex items-center justify-center border border-white/10"
                animate={
                  isWatching || sharing
                    ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0 0 rgba(0,163,224,0.4)", "0 0 0 12px rgba(0,163,224,0)", "0 0 0 0 rgba(0,163,224,0)"] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                {sharing ? (
                  <Crosshair size={32} className="text-mc-cyan animate-pulse" />
                ) : (
                  <Navigation
                    size={32}
                    className={`text-mc-cyan ${isWatching ? "animate-pulse" : ""}`}
                  />
                )}
              </motion.div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                Share Your Location
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                High-accuracy GPS will be sent to your operations team
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label
                  htmlFor="agent-name"
                  className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2"
                >
                  <User size={16} />
                  Your Name
                </label>
                <input
                  id="agent-name"
                  type="text"
                  inputMode="text"
                  autoComplete="name"
                  enterKeyHint="done"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="field-input field-input-mobile text-base"
                  placeholder="Enter your full name"
                  disabled={isWatching}
                />
                {savedName && !agentName && (
                  <p className="text-xs text-white/30 mt-1.5">
                    Welcome back, {savedName}
                  </p>
                )}
              </div>

              <AnimatePresence mode="wait">
                {sharing && gpsProgress && (
                  <motion.div
                    className="p-4 rounded-xl bg-mc-cyan/10 border border-mc-cyan/20"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 size={20} className="text-mc-cyan animate-spin shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-mc-cyan">
                          {progressLabel}
                        </p>
                        {gpsProgress.bestAccuracy != null && (
                          <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
                            <Signal size={12} />
                            ±{Math.round(gpsProgress.bestAccuracy)}m —{" "}
                            {formatAccuracy(gpsProgress.bestAccuracy)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-mc-blue to-mc-cyan rounded-full"
                        initial={{ width: "10%" }}
                        animate={{
                          width:
                            gpsProgress.phase === "locked"
                              ? "100%"
                              : `${Math.min(90, 15 + gpsProgress.samples * 15)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-white/35 mt-2">
                      Tip: Stand in an open area for best GPS accuracy
                    </p>
                  </motion.div>
                )}

                {error && !sharing && (
                  <motion.div
                    className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-300 leading-relaxed">{error}</p>
                  </motion.div>
                )}

                {success && lastShare && !sharing && (
                  <motion.div
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                      <span className="text-sm font-medium text-green-300">
                        Location shared successfully
                      </span>
                    </div>
                    <div className="text-xs text-white/50 space-y-1.5 pl-0 sm:pl-7">
                      <p className="text-sm text-white/85 leading-relaxed font-medium">
                        {lastShare.address}
                      </p>
                      <p className="font-mono text-white/35 text-[11px]">
                        GPS: {lastShare.lat.toFixed(6)}, {lastShare.lng.toFixed(6)}
                      </p>
                      <p className="flex flex-wrap gap-x-3 gap-y-1">
                        <span>±{Math.round(lastShare.accuracy)}m accuracy</span>
                        <span>{lastShare.time}</span>
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${lastShare.lat},${lastShare.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-mc-cyan mt-1 active:opacity-70"
                      >
                        <ExternalLink size={12} />
                        View on map
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isWatching && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium text-green-300">
                    Live tracking active
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sticky mobile action bar */}
          <div className="sticky bottom-0 pt-4 pb-safe space-y-3 bg-gradient-to-t from-mc-navy via-mc-navy/95 to-transparent -mx-4 px-4">
            <button
              onClick={handleShare}
              disabled={sharing || isWatching}
              className="btn-primary w-full py-4 sm:py-4 text-base min-h-[52px] touch-manipulation active:scale-[0.98] transition-transform"
            >
              {sharing && !isWatching ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Finding location and address...
                </>
              ) : (
                <>
                  <MapPin size={22} />
                  Share Live Location
                </>
              )}
            </button>

            <button
              onClick={toggleLiveSharing}
              disabled={sharing}
              className={`w-full min-h-[48px] py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] ${
                isWatching
                  ? "bg-red-500/15 text-red-300 border border-red-500/25"
                  : "glass text-white/70 active:bg-white/10"
              }`}
            >
              {isWatching ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  Stop Live Tracking
                </>
              ) : (
                <>
                  <Navigation size={16} />
                  Enable Continuous Tracking
                </>
              )}
            </button>

            <p className="text-center text-[11px] sm:text-xs text-white/30 leading-relaxed px-2">
              Location is only sent when you tap share or during live tracking.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
