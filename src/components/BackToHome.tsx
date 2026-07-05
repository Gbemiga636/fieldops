"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";

interface BackToHomeProps {
  variant?: "pill" | "text";
  className?: string;
}

export default function BackToHome({
  variant = "pill",
  className = "",
}: BackToHomeProps) {
  if (variant === "text") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={className}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Back to Home
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all group touch-manipulation"
      >
        <Home
          size={15}
          className="text-mc-cyan transition-transform group-hover:scale-110"
        />
        <span className="hidden sm:inline">Home</span>
      </Link>
    </motion.div>
  );
}
