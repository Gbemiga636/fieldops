"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: "text-lg", tag: "text-xs" },
    md: { icon: 28, text: "text-2xl", tag: "text-sm" },
    lg: { icon: 36, text: "text-3xl", tag: "text-base" },
  };

  const s = sizes[size];

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mc-blue to-mc-cyan flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <MapPin size={s.icon * 0.6} className="text-white" />
        </div>
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-mc-blue to-mc-cyan opacity-20 blur-sm -z-10" />
      </div>
      <div>
        <h1 className={`${s.text} font-bold tracking-tight`}>
          <span className="text-white">Field</span>
          <span className="text-mc-cyan">Ops</span>
        </h1>
        {showTagline && (
          <p className={`${s.tag} text-white/50 font-medium`}>
            Live Field Intelligence
          </p>
        )}
      </div>
    </motion.div>
  );
}
