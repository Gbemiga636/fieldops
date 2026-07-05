"use client";

import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(0, 102, 204, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0, 163, 224, 0.1) 0%, transparent 40%), radial-gradient(ellipse at 60% 80%, rgba(0, 51, 102, 0.2) 0%, transparent 50%), linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #0066cc 0%, transparent 70%)",
          top: "10%",
          left: "-10%",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #00a3e0 0%, transparent 70%)",
          top: "60%",
          right: "-5%",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, -40, 0], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #3b9eff 0%, transparent 70%)",
          bottom: "20%",
          left: "30%",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Geometric shapes */}
      <motion.div
        className="absolute w-32 h-32 border border-white/5 rounded-3xl"
        style={{ top: "15%", right: "15%", rotate: "45deg" }}
        animate={{ rotate: [45, 50, 45], y: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-20 h-20 border border-cyan-500/10 rounded-full"
        style={{ bottom: "30%", left: "10%" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-16 h-16 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl"
        style={{ top: "40%", left: "5%", rotate: "12deg" }}
        animate={{ rotate: [12, 20, 12], y: [0, 10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
