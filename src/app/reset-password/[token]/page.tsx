"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { use } from "react";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setIsSuccess(true);
        toast.success("Password updated successfully!");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        const data = await res.json();
        toast.error(data.error || "Invalid or expired token");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 relative z-10"
      >
        {isSuccess ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Password Reset!</h2>
            <p className="text-slate-500">Your password has been successfully updated. Redirecting to login...</p>
            <Link href="/" className="inline-block mt-4 text-primary font-semibold hover:underline">
              Go to Login now
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Set New Password</h1>
            <p className="text-slate-500 text-sm mt-2 mb-8">
              Please enter your new strong password below.
            </p>

            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password" required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isLoading || !password || !confirmPassword}
                className="w-full mt-4 bg-primary text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:bg-green-700 disabled:opacity-70"
              >
                {isLoading ? "Saving..." : <>Reset Password <ArrowRight size={18} /></>}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
