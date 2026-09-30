"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSent(true);
        if (data.devResetLink) {
          setDevLink(data.devResetLink);
        }
        toast.success(data.devResetLink ? "Testing link generated!" : "Reset link sent to your email!");
      } else {
        toast.error(data.error || "Failed to send reset email.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 relative z-10"
      >
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-primary transition-colors mb-6">
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Forgot Password?</h1>
        <p className="text-slate-500 text-sm mt-2 mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {isSent ? (
          <div className="bg-green-50 text-green-800 p-6 rounded-2xl border border-green-200 text-center space-y-4">
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto text-green-700">
              <Mail size={24} />
            </div>
            {devLink ? (
              <div className="space-y-3">
                <h3 className="font-bold text-rose-600">Testing Mode Link</h3>
                <p className="text-sm">Email sending failed (or API key is missing). Click the link below to test the reset flow:</p>
                <div className="bg-white p-3 rounded-xl border border-rose-200 break-all text-xs text-left overflow-hidden shadow-sm">
                  <a href={devLink} className="text-blue-600 font-semibold hover:underline">{devLink}</a>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-bold">Check your inbox</h3>
                <p className="text-sm">We've sent a password reset link to <br/><strong>{email}</strong></p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-slate-400"
                  placeholder="admin@hotel.com"
                />
              </div>
            </div>

            <button
              type="submit" disabled={isLoading || !email}
              className="w-full mt-4 bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:bg-slate-800 disabled:opacity-70"
            >
              {isLoading ? "Sending..." : <><Send size={18} /> Send Reset Link</>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
