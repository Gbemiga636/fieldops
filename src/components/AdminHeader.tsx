"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, Home, Radio } from "lucide-react";
import Logo from "./Logo";

interface AdminHeaderProps {
  username: string;
  onLogout: () => void;
  liveCount?: number;
}

export default function AdminHeader({
  username,
  onLogout,
  liveCount = 0,
}: AdminHeaderProps) {
  const initial = username.charAt(0).toUpperCase();

  return (
    <motion.header
      className="relative z-20 sticky top-0 pt-safe"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="border-b border-white/8 bg-mc-navy/70 backdrop-blur-2xl backdrop-saturate-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-[4.5rem] gap-3">
            {/* Left: logo + title */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
                <Logo size="sm" />
              </Link>
              <div className="hidden sm:block h-8 w-px bg-white/10" />
              <div className="hidden sm:block min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-mc-cyan/80 font-semibold">
                  Command Center
                </p>
                <p className="text-sm text-white/50 truncate">
                  Live field operations
                </p>
              </div>
            </div>

            {/* Center: live indicator (tablet+) */}
            {liveCount > 0 && (
              <motion.div
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={liveCount}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <span className="text-xs font-medium text-green-300">
                  {liveCount} active now
                </span>
              </motion.div>
            )}

            {/* Right: actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/"
                className="btn-ghost text-xs sm:text-sm py-2 px-2.5 sm:px-3 gap-1.5"
              >
                <Home size={15} />
                <span className="hidden sm:inline">Home</span>
              </Link>

              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-mc-blue to-mc-cyan flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
                  {initial}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white leading-tight">
                    {username}
                  </p>
                  <p className="text-[11px] text-white/40 flex items-center gap-1">
                    <Radio size={10} className="text-mc-cyan" />
                    Administrator
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn-ghost text-xs sm:text-sm py-2 px-2.5 sm:px-3 text-white/50 hover:text-red-300 hover:border-red-500/20 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
