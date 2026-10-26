"use client";

// AccountStoreOne — the vault's Two-Factor Authentication section.
// Shown when a delivered account carries a 2FA secret: renders the
// recovery email, the raw secret (masked until revealed) and a LIVE
// RFC 6238 TOTP code computed in the browser with WebCrypto — the code
// refreshes every 30 seconds with a countdown bar. An invalid/non-base32
// secret degrades gracefully to the raw secret + a note, never a crash.

import React, { useEffect, useState } from "react";
import { KeyRound, Eye, EyeOff, Copy, Check, Mail, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { totp, totpSecondsRemaining, isValidBase32Secret } from "../lib/totp";

interface Props {
  secret: string;
  recoveryEmail?: string | null;
}

function groupSecret(s: string): string {
  return s.replace(/[\s-]/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
}

export function TotpVault({ secret, recoveryEmail }: Props) {
  const [showSecret, setShowSecret] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [copied, setCopied] = useState<string | null>(null);
  const valid = isValidBase32Secret(secret);

  useEffect(() => {
    if (!valid) return;
    let alive = true;
    const tick = async () => {
      const now = Date.now();
      const c = await totp(secret, now).catch(() => null);
      if (!alive) return;
      setCode(c);
      setSecondsLeft(totpSecondsRemaining(now));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => { alive = false; clearInterval(timer); };
  }, [secret, valid]);

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyBtn = (text: string, field: string) => (
    <button
      onClick={() => copy(text, field)}
      className="shrink-0 p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-primary-600 border border-slate-200"
      aria-label={`Copy ${field}`}
    >
      {copied === field ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
    </button>
  );

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <KeyRound size={12} className="text-primary-600" /> Two-Factor Authentication (2FA)
      </p>

      {recoveryEmail && (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Mail size={11} /> Recovery Email
          </p>
          <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
            <code className="text-sm font-mono font-bold text-slate-900 break-all">{recoveryEmail}</code>
            {copyBtn(recoveryEmail, "Recovery email")}
          </div>
        </div>
      )}

      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">2FA Secret Key</p>
        <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
          <code className="text-sm font-mono font-bold text-slate-900 break-all">
            {showSecret ? groupSecret(secret) : "•••• •••• •••• •••• ••••"}
          </code>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-primary-600 border border-slate-200"
              aria-label={showSecret ? "Hide secret" : "Reveal secret"}
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {copyBtn(secret.replace(/[\s-]/g, "").toUpperCase(), "2FA secret")}
          </div>
        </div>
      </div>

      {valid ? (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Login Code</p>
          <div className="bg-[#0C2254] rounded-xl px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-3xl font-mono font-black text-white tracking-[0.3em]">
                {code ? `${code.slice(0, 3)} ${code.slice(3)}` : "······"}
              </span>
              {code && (
                <button
                  onClick={() => copy(code, "Login code")}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/25"
                >
                  {copied === "Login code" ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />} Copy
                </button>
              )}
            </div>
            <div className="mt-3 h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F4751F] rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${(secondsLeft / 30) * 100}%` }}
              />
            </div>
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-2">
              New code in {secondsLeft}s — use this code when the account asks for two-factor authentication
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            This secret isn't in the standard authenticator format, so a live code can't be generated here.
            Use the secret key above exactly as provided (for example, enter it into your authenticator app manually).
          </p>
        </div>
      )}
    </div>
  );
}
