"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { auth } from "@/src/lib/auth-client";
import { toast } from "react-hot-toast";

function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Use at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      const token = new URLSearchParams(window.location.search).get("token") || "";
      if (!token) throw new Error("This reset link is missing its token — request a new one.");
      const { error } = await auth.resetPassword({ newPassword: password, token });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      toast.error(err.message || "This reset link is invalid or has expired — request a new one.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={30} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">Password updated</h1>
        <p className="text-sm text-slate-500 font-medium">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-[1.5rem] flex items-center justify-center mb-6">
        <Lock size={30} className="text-primary-600" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Set a new password</h1>
      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
        Choose a strong new password for your account.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min. 8 characters)" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all" />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all" />
        <button disabled={busy} className="w-full py-4 bg-[#0C2254] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
        </button>
      </form>
      <p className="text-[11px] text-slate-400 font-medium mt-6 text-center">
        Link expired? <Link href="/forgot-password" className="text-primary-600 font-bold">Request a new one</Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10">
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
