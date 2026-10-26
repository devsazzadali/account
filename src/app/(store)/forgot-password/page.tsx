"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { auth } from "@/src/lib/auth-client";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Enter a valid email address"); return; }
    setBusy(true);
    try {
      const { error } = await auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Could not send the reset email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors mb-8">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={30} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">Check your email</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              If an account exists for <span className="font-bold text-slate-900">{email}</span>, a password reset link is on its way. The link expires after a short time — use it soon.
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-[1.5rem] flex items-center justify-center mb-6">
              <Mail size={30} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Forgot your password?</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              Enter the email you signed up with and we will send you a secure link to set a new password.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
              />
              <button disabled={busy} className="w-full py-4 bg-[#0C2254] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
