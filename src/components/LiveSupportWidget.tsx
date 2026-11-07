"use client";

// AccountStoreOne — floating support chat (ধাপ ৫ক redesign).
//
// Rules this component now follows:
//  - SIGNED-IN ONLY. The widget renders nothing until a real Neon Auth
//    session exists, and it disappears again on sign-out. There is no
//    "Guest" identity anywhere: the thread is addressed by the signed-in
//    profile's username (resolved from the session, never localStorage),
//    and the server independently forces/ scopes message rows to that
//    same profile — unauthenticated calls to /api/db/messages are 401.
//  - The thread is the SAME general "Customer Support" thread the buyer
//    dashboard desk shows (subject "Live Chat Inquiry" is one of the
//    legacy general-thread labels in src/lib/message-threads.ts), so a
//    conversation started here continues seamlessly in the dashboard
//    and is answered from the admin Messages desk.
//  - Live updates ride the working polling subscription in
//    src/lib/dbclient.ts (db.channel → PollingChannel, 4s tick): any
//    change to the thread triggers an authoritative refetch, so an
//    admin reply appears in the open widget on its own — no manual
//    refresh, and no append-by-payload duplication.
//  - Unread badge: counts store replies (rows with
//    message = '[ADMIN_INITIATED]') newer than the last time this
//    device opened the widget (per-device marker in localStorage — the
//    same per-device pattern the dashboard desk uses for favourites).
//    Opening the panel marks the thread seen and clears the badge.
//  - Design: storefront tokens only (primary scale + #f8fafc surface),
//    a compact 52px launcher anchored bottom-right; on mobile it sits
//    above the tab bar so it no longer covers right-edge card content.
//    No presence claims: the header never says "online" — it cannot
//    know that, so it doesn't pretend to.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, Loader2, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../lib/dbclient";
import { auth } from "../lib/auth-client";
import { lsGet, lsSet } from "@/src/lib/storage";
import { parseMessageBody, isImageAttachment } from "../lib/message-format";

const GENERAL_SUBJECT = "Live Chat Inquiry"; // general-thread label (message-threads.ts)

export function LiveSupportWidget({ storeName }: { storeName: string }) {
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined);
  const [username, setUsername] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const usernameRef = useRef<string | null>(null);
  usernameRef.current = username;

  // ── Session gate: render only for a signed-in user ──────────────
  useEffect(() => {
    let cancelled = false;
    auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setSessionUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // ── Resolve the profile username for the signed-in user ─────────
  useEffect(() => {
    if (!sessionUserId) {
      setUsername(null);
      setMessages([]);
      setIsOpen(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: profile } = await db
        .from("profiles")
        .select("username")
        .eq("id", sessionUserId)
        .single();
      if (!cancelled) setUsername(profile?.username ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  const fetchMessages = useCallback(async () => {
    const uname = usernameRef.current;
    if (!uname) return;
    try {
      // ধাপ ৫ক৩ — no client-side username filter: the server scopes
      // rows to the session's stable identity (user id, username as
      // legacy fallback), so history written under a previous username
      // still loads after a rename.
      const { data } = await db
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ── Initial load + unread baseline ──────────────────────────────
  useEffect(() => {
    if (!username) return;
    fetchMessages();
  }, [username, fetchMessages]);

  useEffect(() => {
    if (!username || messages.length === 0 || seenAt !== null) return;
    const stored = lsGet(`aso_widget_seen:${username}`);
    if (stored) {
      setSeenAt(stored);
      return;
    }
    // First run on this device: replies in the trailing run of store
    // messages (after the buyer's own last message) count as unseen;
    // anything older is history the buyer has lived with.
    let baseline = "";
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].message !== "[ADMIN_INITIATED]") {
        baseline = messages[i].created_at;
        break;
      }
    }
    setSeenAt(baseline);
  }, [username, messages, seenAt]);

  // ── Live updates via the polling channel (dbclient PollingChannel)
  useEffect(() => {
    if (!username) return;
    const channel = db
      .channel("live-support")
      .on(
        "postgres_changes",
        // ধাপ ৫ক৩ — no username filter on the poll: the poll endpoint
        // is ownership-scoped server-side, and a username filter would
        // blind the trigger to rows written under a previous name.
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchMessages();
        }
      )
      .subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [username, fetchMessages]);

  useEffect(() => {
    if (isOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // While the panel is open, everything in it is being looked at:
  // keep the seen marker at the newest message so a reply that arrived
  // live (and was read) never resurfaces as "unread" after closing.
  useEffect(() => {
    if (!isOpen || !username || messages.length === 0) return;
    const latest = String(messages[messages.length - 1].created_at);
    if (seenAt !== latest) {
      setSeenAt(latest);
      lsSet(`aso_widget_seen:${username}`, latest);
    }
  }, [isOpen, username, messages, seenAt]);

  const storeReplies = messages.filter((m) => m.message === "[ADMIN_INITIATED]");
  const unreadCount =
    !isOpen && seenAt !== null
      ? storeReplies.filter((m) => String(m.created_at) > seenAt).length
      : 0;

  function markSeen() {
    if (!username) return;
    const latest = messages.length
      ? String(messages[messages.length - 1].created_at)
      : new Date().toISOString();
    setSeenAt(latest);
    lsSet(`aso_widget_seen:${username}`, latest);
  }

  function toggleOpen() {
    if (!isOpen) markSeen();
    setIsOpen((o) => !o);
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || !username || isSending) return;
    setIsSending(true);
    setSendError(null);
    try {
      const { error } = await db.from("messages").insert({
        username: username,
        subject: GENERAL_SUBJECT,
        message: text,
        status: "unread",
      });
      if (error) throw error;
      setNewMessage("");
      await fetchMessages();
      markSeen();
    } catch (err: any) {
      setSendError(err?.message || "Could not send — please try again.");
    } finally {
      setIsSending(false);
    }
  }

  // Guests (and the brief moment before the session resolves) get
  // nothing at all — no launcher, no panel, no code path.
  if (!sessionUserId || !username) return null;

  const initial = (storeName || "S").trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="fixed bottom-[5.75rem] right-3 sm:right-5 md:bottom-5 z-[2000] font-sans flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="w-[min(360px,calc(100vw-1.5rem))] h-[min(520px,calc(100dvh-13rem))] md:h-[min(520px,calc(100dvh-8rem))] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Panel header — store identity, no fake presence */}
            <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-primary-500 text-white flex items-center justify-center font-black text-[15px] shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900 truncate">
                  {storeName}
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Customer support — send a message and the store replies right here.
                </p>
              </div>
              <button
                onClick={toggleOpen}
                aria-label="Close support chat"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#f8fafc]">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-3">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-[13px] font-bold text-slate-700">No messages yet</p>
                  <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
                    Ask about an order, a product, or anything else — we&apos;ll get back to you in this chat.
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isStore = msg.message === "[ADMIN_INITIATED]";
                const parsed = parseMessageBody(isStore ? msg.reply : msg.message);
                return (
                  <div key={msg.id} className={`flex ${isStore ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13.5px] shadow-sm ${
                        isStore
                          ? "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
                          : "bg-primary-500 text-white rounded-br-md"
                      }`}
                    >
                      {parsed.text && (
                        <p className="leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
                      )}
                      {parsed.attachment &&
                        (isImageAttachment(parsed.attachment) ? (
                          <a href={parsed.attachment.url} target="_blank" rel="noreferrer" className="block mt-1">
                            <img
                              src={parsed.attachment.url}
                              alt={parsed.attachment.name}
                              className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-black/10"
                            />
                            <span className="block mt-1.5 text-[11px] font-bold opacity-70 truncate">
                              {parsed.attachment.name}
                            </span>
                          </a>
                        ) : (
                          <a
                            href={parsed.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-xl text-[12px] font-bold ${
                              isStore ? "bg-slate-50 border border-slate-100 text-slate-700" : "bg-white/15 text-white"
                            }`}
                          >
                            <Paperclip size={13} className="shrink-0" />{" "}
                            <span className="truncate">{parsed.attachment.name}</span>
                          </a>
                        ))}
                      <div
                        className={`mt-2 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                          isStore ? "text-slate-400" : "text-white/60"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <span className={`w-1 h-1 rounded-full ${isStore ? "bg-slate-300" : "bg-white/30"}`} />
                        {isStore ? "Support" : "You"}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-slate-100 bg-white shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message…"
                  aria-label="Type your message"
                  className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  aria-label="Send message"
                  className="w-11 h-11 shrink-0 bg-primary-500 hover:bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none"
                >
                  {isSending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                </button>
              </form>
              {sendError && <p className="mt-2 text-[11px] font-bold text-red-600">{sendError}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        onClick={toggleOpen}
        aria-label={isOpen ? "Close support chat" : "Chat with support"}
        className="relative w-[52px] h-[52px] bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 transition-colors"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary-800 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
