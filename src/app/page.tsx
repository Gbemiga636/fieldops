import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { ArrowRight, MapPin, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <Logo size="md" />
        <Link
          href="/admin/login"
          className="btn-ghost text-sm flex items-center gap-2"
        >
          <Shield size={16} />
          Admin Login
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-mc-cyan font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-mc-cyan animate-pulse" />
            Powered by MultiChoice
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="text-white">Real-Time</span>
            <br />
            <span className="bg-gradient-to-r from-mc-blue to-mc-cyan bg-clip-text text-transparent">
              Field Intelligence
            </span>
          </h1>

          <p className="text-lg text-white/60 leading-relaxed mb-8">
            Share your live location with your team instantly. Field agents
            report in with one tap — admins monitor everything in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/share" className="btn-primary text-base px-8 py-3.5">
              <MapPin size={20} />
              Share My Location
              <ArrowRight size={18} />
            </Link>
            <Link href="/admin/login" className="btn-ghost text-base px-8 py-3.5">
              Admin Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
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
            <div key={feature.title} className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 text-center py-6 text-sm text-white/30">
        FieldOps &copy; {new Date().getFullYear()} — MultiChoice Field Operations
      </footer>
    </div>
  );
}
