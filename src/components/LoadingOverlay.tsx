"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export default function LoadingOverlay({
  show,
  message = "Please wait...",
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-mc-navy/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative glass-card rounded-3xl px-8 py-10 flex flex-col items-center text-center max-w-xs w-full shadow-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
          >
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mc-blue/30 to-mc-cyan/30 flex items-center justify-center border border-white/10">
                <Loader2 size={32} className="text-mc-cyan animate-spin" />
              </div>
              <motion.div
                className="absolute -inset-2 rounded-3xl border-2 border-mc-cyan/30"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="text-base font-semibold text-white mb-1">{message}</p>
            <p className="text-sm text-white/45">This will only take a moment</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
