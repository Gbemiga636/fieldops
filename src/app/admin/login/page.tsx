"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: needsPassword ? password : password || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.needsPasswordSetup) {
        router.push("/admin/dashboard?setup=password");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.needsPasswordSetup) {
        router.push("/admin/dashboard?setup=password");
      } else {
        setNeedsPassword(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />

      <header className="relative z-10 px-6 py-5 max-w-md mx-auto w-full">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-card rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-mc-blue to-mc-cyan flex items-center justify-center">
                <LogIn size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Admin Login
              </h2>
              <p className="text-sm text-white/50">
                Access the FieldOps command center
              </p>
            </div>

            <form
              onSubmit={needsPassword ? handleLogin : handleUsernameSubmit}
              className="space-y-5"
            >
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                  <User size={16} />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="field-input"
                  placeholder="Enter username"
                  required
                  disabled={needsPassword}
                />
              </div>

              {needsPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                    <Lock size={16} />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field-input pr-10"
                      placeholder="Enter your password"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.p
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : needsPassword ? (
                  "Sign In"
                ) : (
                  "Continue"
                )}
              </button>

              {needsPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setNeedsPassword(false);
                    setPassword("");
                    setError("");
                  }}
                  className="btn-ghost w-full text-sm"
                >
                  Use different username
                </button>
              )}
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
