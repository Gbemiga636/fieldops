"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { ArrowRight, MapPin, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HomePage() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col page-enter">
      <AnimatedBackground />

      <motion.header
        className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-5 max-w-6xl mx-auto w-full"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Logo size="md" />
        <Link
          href="/admin/login"
          className="btn-ghost text-sm flex items-center gap-2 touch-manipulation"
        >
          <Shield size={16} />
          <span className="hidden sm:inline">Admin Login</span>
          <span className="sm:hidden">Admin</span>
        </Link>
      </motion.header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-mc-cyan font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-mc-cyan animate-pulse" />
            Powered by MultiChoice
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
          >
            <span className="text-white">Real-Time</span>
            <br />
            <span className="bg-gradient-to-r from-mc-blue to-mc-cyan bg-clip-text text-transparent">
              Field Intelligence
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-base sm:text-lg text-white/60 leading-relaxed mb-8"
          >
            Share your live location with your team instantly. Field agents
            report in with one tap — admins monitor everything in real time.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/share"
              className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto min-h-[52px] touch-manipulation"
            >
              <MapPin size={20} />
              Share My Location
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/admin/login"
              className="btn-ghost text-base px-8 py-3.5 w-full sm:w-auto min-h-[48px] touch-manipulation"
            >
              Admin Dashboard
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl w-full"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
          }}
        >
          {[
            {
              title: "One-Tap Sharing",
              desc: "Agents share live GPS location with a single button press",
            },
            {
              title: "Real-Time Tracking",
              desc: "Admins see updates instantly with timestamps and accuracy",
            },
            {
              title: "Smart Filters",
              desc: "Search by agent, location, date, time, and device info",
            },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-card rounded-2xl p-6 card-hover"
            >
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <motion.footer
        className="relative z-10 text-center py-6 text-sm text-white/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        FieldOps &copy; {new Date().getFullYear()} — MultiChoice Field Operations
      </motion.footer>
    </div>
  );
}
