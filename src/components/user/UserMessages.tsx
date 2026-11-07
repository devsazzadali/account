"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { orderCode } from "../../lib/order-ref";
import {
  ShieldCheck,
  CheckCheck,
  Loader2,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  MessageSquare,
  Clock,
  LifeBuoy,
  Star,
  Package,
  Check,
  MoreHorizontal,
  X,
  ChevronUp,
  ChevronDown,
  Download,
  RefreshCw,
  FileText,
  Plus
} from "lucide-react";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { lsGet, lsSet, lsRemove } from "@/src/lib/storage";
import { formatMessageBody, parseMessageBody, isImageAttachment } from "../../lib/message-format";
import {
  GENERAL_THREAD_KEY,
  threadKeyOf,
  threadSubjectOf,
  threadTitleOf,
  subjectForNewMessage,
  normalizeTicketTitle,
} from "../../lib/message-threads";

// R2 (F-09/F-10/F-29): every control on this desk is real now —
//  - Paperclip: uploads through the existing /api/upload route (bucket
//    "messages") and sends the file as a message attachment marker
//    (src/lib/message-format.ts) that renders as an image / file link.
//  - Emoji: a built-in picker that inserts the character at the cursor.
//  - Package icon: "reference your latest order" — inserts the order
//    reference into the composer (it was an unlabeled dead button).
//  - Thread-header search: real in-thread find with match navigation.
//  - Both ⋯ menus: only actions the backend/data actually supports
//    (find, close/reopen ticket via /api/messages/ticket, export
//    transcript, refresh, starred-only filter).
//  - Star: a per-device favourite (localStorage) — the messages schema
//    has no starred column and no migration was run; it persists across
//    reloads on this device and is marked in the inbox list.
//  - Inbox search actually filters the thread list.
//  - Fix Round 4 (item 3): "New ticket" — a customer can open a
//    SEPARATE ticket thread with its own subject (subject + first
//    message). Threads are (username, subject group) per
//    src/lib/message-threads.ts: the legacy labels form the general
//    "Customer Support" thread; any other subject is a ticket listed
//    alongside it. Star, find, close/reopen and export all act on the
//    ACTIVE thread.

const EMOJIS = [
  "😀", "😁", "😂", "🙂", "😉", "😍", "🤔", "😎",
  "😅", "😊", "🙏", "👍", "👎", "👋", "💪", "👀",
  "🔥", "🎉", "⭐", "💯", "🚀", "✅", "❌", "⚠️",
  "💡", "📎", "📦", "🖼️", "💳", "🔒", "⏰", "🛠️",
  "❤️", "✍️", "🤝", "🎧", "💬", "📩", "🏆", "🌟",
];

export function UserMessages() {
  const [username, setUsername] = useState<string>(lsGet("username") || "User");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [lastOrder, setLastOrder] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // F-10 — inbox search
  const [searchQuery, setSearchQuery] = useState("");
  // F-29 — favourite (per-device)
  const [fav, setFav] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  // F-09 — composer + header tooling
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [inboxMenuOpen, setInboxMenuOpen] = useState(false);
  const [threadSearchOpen, setThreadSearchOpen] = useState(false);
  const [threadQuery, setThreadQuery] = useState("");
  const [matchPos, setMatchPos] = useState(0);
  const [ticketBusy, setTicketBusy] = useState(false);
  // Fix Round 4 — ticket threads + the New ticket compose
  const [activeThreadKey, setActiveThreadKey] = useState<string>(GENERAL_THREAD_KEY);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketBody, setTicketBody] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const inboxMenuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  // The general thread keeps its original key so favourites set
  // before Fix Round 4 stay favourites; each ticket thread gets its
  // own key.
  const favKeyFor = (key: string) =>
    key === GENERAL_THREAD_KEY ? `aso_fav_thread:${username}` : `aso_fav_thread:${username}:${key}`;
  const favKey = favKeyFor(activeThreadKey);
  const isFavThread = (key: string) => lsGet(favKeyFor(key)) === "1";

  useEffect(() => {
    fetchSessionAndData();

    // Real-time Subscription
    const channel = db
      .channel('user_messages_fiverr')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
        db.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeThreadKey]);

  // Favourite state is per username — (re)read it once the real
  // username is known.
  useEffect(() => {
    setFav(lsGet(favKey) === "1");
  }, [favKey]);

  // Menus / emoji picker close on outside click.
  useEffect(() => {
    if (!headerMenuOpen && !inboxMenuOpen && !emojiOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (headerMenuRef.current && !headerMenuRef.current.contains(t)) setHeaderMenuOpen(false);
      if (inboxMenuRef.current && !inboxMenuRef.current.contains(t)) setInboxMenuOpen(false);
      if (emojiRef.current && !emojiRef.current.contains(t)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [headerMenuOpen, inboxMenuOpen, emojiOpen]);

  async function fetchSessionAndData() {
    const { data: { session } } = await auth.getSession();
    if (session?.user) {
        const { data: profile } = await db.from('profiles').select('username').eq('id', session.user.id).single();
        if (profile?.username) {
            setUsername(profile.username);
        }
        fetchMessages();
        fetchLastOrder();
    } else {
        setLoading(false);
    }
  }

  // ধাপ ৫ক৩ — no client-side username filter on either fetch: the
  // server scopes message rows to the session's stable identity (user
  // id, username as legacy fallback), so filtering by the CURRENT
  // username here would hide history written under a previous name.
  // Orders are likewise ownership-scoped server-side.
  async function fetchMessages() {
    try {
        const { data, error } = await db
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        setLoading(false);
    } catch (err: any) {
        console.error("Message Fetch Error:", err.message);
    }
  }

  async function fetchLastOrder() {
    try {
      const { data } = await db
        .from('orders')
        .select('*, products(title, image)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setLastOrder(data);
    } catch (e) { /* ignore */ }
  }

  /** The text a message bubble actually displays (marker stripped). */
  function displayText(msg: any): string {
    const raw = msg.message === '[ADMIN_INITIATED]' ? (msg.reply || "") : (msg.message || "");
    return parseMessageBody(raw).text;
  }

  // ── Fix Round 4: threads = (username, subject group). The general
  // "Customer Support" thread is always listed first (even when it has
  // no messages yet); ticket threads follow by latest activity. ──
  interface ThreadView { key: string; title: string; subject: string | null; msgs: any[] }
  const threads = useMemo<ThreadView[]>(() => {
    const map = new Map<string, any[]>();
    for (const m of messages) {
      const k = threadKeyOf(m.subject);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    const general: ThreadView = {
      key: GENERAL_THREAD_KEY,
      title: threadTitleOf(GENERAL_THREAD_KEY),
      subject: null,
      msgs: map.get(GENERAL_THREAD_KEY) || [],
    };
    const tickets = Array.from(map.entries())
      .filter(([k]) => k !== GENERAL_THREAD_KEY)
      .map(([key, msgs]) => ({ key, title: threadTitleOf(key), subject: threadSubjectOf(key), msgs }))
      .sort((a, b) => {
        const la = a.msgs[a.msgs.length - 1]?.created_at || "";
        const lb = b.msgs[b.msgs.length - 1]?.created_at || "";
        return String(lb).localeCompare(String(la));
      });
    return [general, ...tickets];
  }, [messages]);
  const activeThread = threads.find((t) => t.key === activeThreadKey) || threads[0];
  const activeMessages: any[] = activeThread.msgs;

  function selectThread(key: string) {
    setActiveThreadKey(key);
    setThreadQuery("");
    setThreadSearchOpen(false);
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !pendingAttachment) return;

    setIsSending(true);
    try {
        const { error } = await db.from('messages').insert({
            username: username,
            subject: subjectForNewMessage(activeThread.key, false),
            message: formatMessageBody(newMessage, pendingAttachment),
            status: 'unread'
        });

        if (error) throw error;
        setNewMessage("");
        setPendingAttachment(null);
        fetchMessages();
    } catch (err: any) {
        toast.error("Error: " + err.message);
    } finally {
        setIsSending(false);
    }
  }

  // ── Fix Round 4: open a NEW ticket thread (subject + first message).
  // The first message carries the ticket's title as its subject, which
  // is what makes it a separate thread on both desks. A title that
  // already has a thread simply continues that thread. ──
  async function createTicket() {
    const title = normalizeTicketTitle(ticketTitle);
    const bodyText = ticketBody.trim();
    if (!title || !bodyText || creatingTicket) return;
    setCreatingTicket(true);
    try {
      const key = threadKeyOf(title);
      const existed = threads.some((t) => t.key === key && t.key !== GENERAL_THREAD_KEY);
      const { error } = await db.from('messages').insert({
        username: username,
        subject: title,
        message: bodyText,
        status: 'unread'
      });
      if (error) throw error;
      setTicketTitle("");
      setTicketBody("");
      setNewTicketOpen(false);
      setActiveThreadKey(key);
      toast.success(existed ? "Added to your existing ticket with that subject." : "Ticket created — the store will reply here.");
      fetchMessages();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setCreatingTicket(false);
    }
  }

  // ── F-09(a): attachment via the existing /api/upload route ──
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("bucket", "messages");
      const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) throw new Error(json.error || "Upload failed");
      setPendingAttachment({ url: json.url, name: file.name });
    } catch (err: any) {
      toast.error("Attachment failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  // ── F-09(b): emoji insert at cursor ──
  function insertEmoji(emoji: string) {
    const ta = textareaRef.current;
    if (!ta) { setNewMessage((m) => m + emoji); return; }
    const start = ta.selectionStart ?? newMessage.length;
    const end = ta.selectionEnd ?? newMessage.length;
    const next = newMessage.slice(0, start) + emoji + newMessage.slice(end);
    setNewMessage(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  // ── F-09(c): the old unlabeled cube = reference your latest order ──
  function referenceLastOrder() {
    if (!lastOrder) return;
    const ref = `About my order #${orderCode(lastOrder.id)}${lastOrder.products?.title ? ` (${lastOrder.products.title})` : ""}: `;
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? newMessage.length;
    setNewMessage((m) => m.slice(0, start) + ref + m.slice(start));
    textareaRef.current?.focus();
  }

  // ── F-29: favourite toggle (per-device, reflected in the list) ──
  function toggleFav() {
    if (fav) { lsRemove(favKey); setFav(false); }
    else { lsSet(favKey, "1"); setFav(true); }
  }

  // ── F-09(e): ticket close / reopen via the dedicated endpoint ──
  const ticketStatus: string = activeMessages.length > 0 ? (activeMessages[activeMessages.length - 1]?.ticket_status || "open") : "open";
  async function setTicket(status: "closed" | "open") {
    setTicketBusy(true);
    try {
      const res = await fetch("/api/messages/ticket", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, thread: activeThread.key }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not update the ticket");
      toast.success(status === "closed" ? "Ticket closed — replying reopens it." : "Ticket reopened.");
      setHeaderMenuOpen(false);
      await fetchMessages();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTicketBusy(false);
    }
  }

  // ── F-09(e): export the ACTIVE thread's conversation as a text file ──
  function exportTranscript() {
    const lines = activeMessages.map((msg) => {
      const isAdmin = msg.message === '[ADMIN_INITIATED]';
      const parsed = parseMessageBody(isAdmin ? (msg.reply || "") : (msg.message || ""));
      const when = new Date(msg.created_at).toLocaleString();
      const attach = parsed.attachment ? `\n   [Attachment: ${parsed.attachment.name} — ${parsed.attachment.url}]` : "";
      return `[${when}] ${isAdmin ? "Customer Support" : "Me"}: ${parsed.text}${attach}`;
    });
    const blob = new Blob([`${activeThread.title} conversation\n${"=".repeat(31)}\n\n${lines.join("\n\n")}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "support-conversation.txt";
    a.click();
    URL.revokeObjectURL(url);
    setHeaderMenuOpen(false);
  }

  // ── F-09(d): in-thread find (active thread) ──
  const q = threadQuery.trim().toLowerCase();
  const matchIdxs = q
    ? activeMessages.map((m, i) => (displayText(m).toLowerCase().includes(q) ? i : -1)).filter((i) => i >= 0)
    : [];
  useEffect(() => { setMatchPos(0); }, [threadQuery, activeMessages.length]);
  function goToMatch(dir: 1 | -1) {
    if (matchIdxs.length === 0) return;
    const next = (matchPos + dir + matchIdxs.length) % matchIdxs.length;
    setMatchPos(next);
    flowRef.current
      ?.querySelector(`[data-msg-idx="${matchIdxs[next]}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function highlight(text: string): React.ReactNode {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
    return parts.map((p, i) =>
      p.toLowerCase() === q ? <mark key={i} className="bg-amber-200 text-inherit rounded-sm px-0.5">{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>
    );
  }

  // ── F-10: inbox filter (title, preview, or any message text), per
  // thread; the starred-only filter is per thread too (Fix Round 4). ──
  const iq = searchQuery.trim().toLowerCase();
  const threadPreview = (t: ThreadView) => {
    const last = t.msgs[t.msgs.length - 1];
    return last ? (displayText(last) || "Attachment") : "How can we help you today?";
  };
  const visibleThreads = threads.filter((t) => {
    if (starredOnly && !isFavThread(t.key)) return false;
    if (!iq) return true;
    return t.title.toLowerCase().includes(iq)
      || threadPreview(t).toLowerCase().includes(iq)
      || t.msgs.some((m) => displayText(m).toLowerCase().includes(iq));
  });

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-[#e4e5e7] rounded-lg overflow-hidden font-sans">

      {/* ── Sidebar: Inbox List (Fiverr Style) ── */}
      <div className="hidden lg:flex w-[300px] flex-col border-r border-[#e4e5e7]">
        <div className="p-4 border-b border-[#e4e5e7] flex items-center justify-between bg-white relative">
           <h3 className="text-[18px] font-bold text-[#404145]">Inbox</h3>
           <div className="relative" ref={inboxMenuRef}>
             <button onClick={() => setInboxMenuOpen((o) => !o)} className="p-2 text-[#74767e] hover:bg-[#f5f5f5] rounded-full transition-all" title="Inbox options">
                <MoreHorizontal size={18} />
             </button>
             {inboxMenuOpen && (
               <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#e4e5e7] rounded-xl shadow-xl z-30 py-1.5 text-[13px] font-medium text-[#404145]">
                 <button onClick={() => { fetchMessages(); setInboxMenuOpen(false); }} className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-[#f5f5f5] text-left">
                   <RefreshCw size={14} /> Refresh inbox
                 </button>
                 <button onClick={() => setStarredOnly((s) => !s)} className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-[#f5f5f5] text-left">
                   <Star size={14} className={starredOnly ? "text-amber-500" : ""} fill={starredOnly ? "currentColor" : "none"} /> Starred only
                   {starredOnly && <Check size={14} className="ml-auto text-[#1dbf73]" />}
                 </button>
               </div>
             )}
           </div>
        </div>
        <div className="p-4 border-b border-[#e4e5e7] bg-white">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b5b6ba]" size={16} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages"
                    className="w-full bg-[#f5f5f5] border-none rounded py-2.5 pl-10 pr-4 text-[13px] focus:ring-1 focus:ring-[#1dbf73] focus:bg-white transition-all outline-none"
                />
            </div>
            <button
              onClick={() => setNewTicketOpen(true)}
              className="mt-3 w-full py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white rounded font-bold text-[13px] flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={15} /> New ticket
            </button>
        </div>
        <div className="flex-1 overflow-y-auto">
            {visibleThreads.length > 0 ? visibleThreads.map((t) => {
            const isActive = t.key === activeThread.key;
            const tFav = isFavThread(t.key);
            const isGeneral = t.key === GENERAL_THREAD_KEY;
            return (
            <button key={t.key} onClick={() => selectThread(t.key)} className={`w-full p-4 flex items-center gap-3 transition-all ${isActive ? "bg-[#f1fdf7] border-l-4 border-[#1dbf73]" : "border-l-4 border-transparent hover:bg-[#fafafa]"}`}>
                <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 font-bold ${isGeneral ? "bg-[#1dbf73]" : "bg-[#404145]"}`}>
                        {isGeneral ? "S" : (t.title[0] || "T").toUpperCase()}
                    </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[14px] font-bold text-[#404145] truncate flex items-center gap-1.5">
                          {t.title}
                          {tFav && <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />}
                        </span>
                    </div>
                    <p className="text-[12px] text-[#74767e] truncate font-normal">{threadPreview(t)}</p>
                </div>
            </button>
            );
            }) : (
              <p className="p-4 text-[12px] text-[#74767e] leading-relaxed">
                {starredOnly
                  ? "No starred conversations yet — star a conversation from the ★ in its header."
                  : "No conversations match your search."}
              </p>
            )}
        </div>
      </div>

      {/* ── Main: Chat Area (Fiverr Style) ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile thread switcher (the inbox sidebar is desktop-only) */}
        <div className="lg:hidden px-4 py-2.5 border-b border-[#e4e5e7] flex items-center gap-2 overflow-x-auto bg-white shrink-0">
          {threads.map((t) => (
            <button
              key={t.key}
              onClick={() => selectThread(t.key)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${t.key === activeThread.key ? "bg-[#1dbf73] text-white" : "bg-[#f5f5f5] text-[#404145]"}`}
            >
              {t.title}
            </button>
          ))}
          <button
            onClick={() => setNewTicketOpen(true)}
            className="px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap bg-white border border-[#1dbf73] text-[#1dbf73] flex items-center gap-1 shrink-0"
          >
            <Plus size={13} /> New ticket
          </button>
        </div>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e4e5e7] flex items-center justify-between bg-white">
           <div className="flex items-center gap-3">
              <div className="relative">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${activeThread.key === GENERAL_THREAD_KEY ? "bg-[#1dbf73]" : "bg-[#404145]"}`}>
                    {activeThread.key === GENERAL_THREAD_KEY ? "S" : (activeThread.title[0] || "T").toUpperCase()}
                 </div>
              </div>
              <div>
                 <div className="text-[15px] font-bold text-[#404145] flex items-center gap-2">
                    {activeThread.title}
                 </div>
                 <p className="text-[12px] text-[#74767e] font-medium flex items-center gap-2">
                    {/* ধাপ ৫ক৩ — honest copy: no presence/response-time
                        claim the system cannot know. */}
                    Store support — replies land right here
                    {/* Ticket state (P3) — mirrors the admin desk, per thread */}
                    {activeMessages.length > 0 && (() => {
                      const label = ticketStatus === "awaiting_reply" ? "answered" : ticketStatus;
                      return (
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          ticketStatus === "closed" ? "bg-slate-100 text-slate-400" :
                          ticketStatus === "awaiting_reply" ? "bg-emerald-50 text-emerald-600" :
                          "bg-amber-50 text-amber-600"
                        }`}>
                          {`Ticket ${label}`}
                        </span>
                      );
                    })()}
                 </p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button
                onClick={toggleFav}
                title={fav ? "Remove from favourites" : "Mark as favourite"}
                className={`p-2 transition-all ${fav ? "text-amber-500" : "text-[#74767e] hover:text-amber-500"}`}
              >
                <Star size={18} fill={fav ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => { setThreadSearchOpen((o) => !o); setThreadQuery(""); }}
                title="Find in conversation"
                className={`p-2 transition-all ${threadSearchOpen ? "text-[#1dbf73]" : "text-[#74767e] hover:text-[#1dbf73]"}`}
              >
                <Search size={18} />
              </button>
              <div className="relative" ref={headerMenuRef}>
                <button onClick={() => setHeaderMenuOpen((o) => !o)} title="Conversation options" className="text-[#74767e] hover:text-[#1dbf73] p-2 transition-all">
                  <MoreVertical size={18} />
                </button>
                {headerMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-[#e4e5e7] rounded-xl shadow-xl z-30 py-1.5 text-[13px] font-medium text-[#404145]">
                    <button onClick={() => { setThreadSearchOpen(true); setHeaderMenuOpen(false); }} className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-[#f5f5f5] text-left">
                      <Search size={14} /> Find in conversation
                    </button>
                    {ticketStatus !== "closed" ? (
                      <button disabled={ticketBusy} onClick={() => setTicket("closed")} className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-[#f5f5f5] text-left disabled:opacity-50">
                        <CheckCheck size={14} /> Close ticket (resolved)
                      </button>
                    ) : (
                      <button disabled={ticketBusy} onClick={() => setTicket("open")} className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-[#f5f5f5] text-left disabled:opacity-50">
                        <RefreshCw size={14} /> Reopen ticket
                      </button>
                    )}
                    <button onClick={exportTranscript} className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-[#f5f5f5] text-left">
                      <Download size={14} /> Export transcript (.txt)
                    </button>
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* In-thread search bar (F-09d) */}
        {threadSearchOpen && (
          <div className="px-6 py-2.5 border-b border-[#e4e5e7] bg-[#fafafa] flex items-center gap-3">
            <Search size={15} className="text-[#b5b6ba] shrink-0" />
            <input
              autoFocus
              value={threadQuery}
              onChange={(e) => setThreadQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); goToMatch(e.shiftKey ? -1 : 1); } if (e.key === "Escape") { setThreadSearchOpen(false); setThreadQuery(""); } }}
              placeholder="Find in this conversation…"
              className="flex-1 bg-transparent outline-none text-[13px] py-1"
            />
            <span className="text-[11px] text-[#74767e] font-bold whitespace-nowrap">
              {q ? (matchIdxs.length > 0 ? `${matchPos + 1} of ${matchIdxs.length}` : "No matches") : ""}
            </span>
            <button onClick={() => goToMatch(-1)} disabled={matchIdxs.length === 0} className="p-1.5 text-[#74767e] hover:text-[#1dbf73] disabled:opacity-30" title="Previous match"><ChevronUp size={15} /></button>
            <button onClick={() => goToMatch(1)} disabled={matchIdxs.length === 0} className="p-1.5 text-[#74767e] hover:text-[#1dbf73] disabled:opacity-30" title="Next match"><ChevronDown size={15} /></button>
            <button onClick={() => { setThreadSearchOpen(false); setThreadQuery(""); }} className="p-1.5 text-[#74767e] hover:text-[#404145]" title="Close search"><X size={15} /></button>
          </div>
        )}

        {/* Messages Flow */}
        <div ref={flowRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
           {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                 <Loader2 className="animate-spin text-[#1dbf73] w-8 h-8 mb-4" />
                 <p className="text-[13px] text-[#74767e]">Loading conversation...</p>
              </div>
           ) : activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-4">
                     <MessageSquare className="text-[#b5b6ba]" size={32} />
                  </div>
                  <p className="text-[15px] font-bold text-[#404145]">No messages yet</p>
                  <p className="text-[13px] text-[#74767e] mt-1">Start a conversation with our support team.</p>
              </div>
           ) : (
              activeMessages.map((msg, idx) => {
                 const isAdmin = msg.message === '[ADMIN_INITIATED]';
                 const parsed = parseMessageBody(isAdmin ? (msg.reply || "") : (msg.message || ""));
                 const isMatch = q && parsed.text.toLowerCase().includes(q);
                 return (
                    <div key={msg.id} data-msg-idx={idx} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} group`}>
                       <div className={`flex gap-3 max-w-[85%] ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold ${isAdmin ? 'bg-[#1dbf73]' : 'bg-[#404145]'}`}>
                             {isAdmin ? 'S' : (username[0] || 'U').toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-[13px] font-bold text-[#404145]">{isAdmin ? 'Support' : 'Me'}</span>
                                <span className="text-[11px] text-[#b5b6ba]">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                             </div>
                             <div className={`p-4 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${
                                isAdmin
                                ? 'bg-[#f5f5f5] text-[#404145] rounded-tl-none'
                                : 'bg-[#1dbf73] text-white rounded-tr-none'
                             } ${isMatch && matchIdxs[matchPos] === idx ? 'ring-2 ring-amber-400' : ''}`}>
                                {parsed.text && <span>{threadSearchOpen ? highlight(parsed.text) : parsed.text}</span>}
                                {parsed.attachment && (
                                  isImageAttachment(parsed.attachment) ? (
                                    <a href={parsed.attachment.url} target="_blank" rel="noreferrer" className="block mt-1">
                                      <img src={parsed.attachment.url} alt={parsed.attachment.name} className="max-w-[240px] max-h-[240px] rounded-xl object-cover border border-black/10" />
                                      <span className="block mt-1.5 text-[11px] font-bold opacity-70 truncate">{parsed.attachment.name}</span>
                                    </a>
                                  ) : (
                                    <a href={parsed.attachment.url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-xl text-[12px] font-bold ${isAdmin ? 'bg-white border border-[#e4e5e7] text-[#404145]' : 'bg-white/15 text-white'}`}>
                                      <FileText size={14} className="shrink-0" /> <span className="truncate">{parsed.attachment.name}</span>
                                    </a>
                                  )
                                )}
                             </div>
                             {!isAdmin && (
                                <div className="mt-1 flex justify-end">
                                   <CheckCheck size={14} className={msg.status === 'replied' ? "text-[#1dbf73]" : "text-[#b5b6ba]"} />
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 )
              })
           )}
           <div ref={chatEndRef} />
        </div>

        {/* Input Area (Fiverr Style) */}
        <div className="p-4 border-t border-[#e4e5e7] bg-white">
           <form onSubmit={handleSendMessage} className="border border-[#e4e5e7] rounded-md bg-white focus-within:border-[#1dbf73] transition-all relative">
              <textarea
                 ref={textareaRef}
                 value={newMessage}
                 onChange={e => setNewMessage(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                 placeholder="Type your message here..."
                 className="w-full p-4 text-[14px] text-[#404145] outline-none resize-none h-[100px]"
              />
              {pendingAttachment && (
                <div className="mx-4 mb-2 flex items-center gap-2 bg-[#f1fdf7] border border-[#1dbf73]/30 rounded-lg px-3 py-2">
                  <Paperclip size={13} className="text-[#1dbf73] shrink-0" />
                  <span className="text-[12px] font-bold text-[#404145] truncate flex-1">{pendingAttachment.name}</span>
                  <button type="button" onClick={() => setPendingAttachment(null)} className="text-[#74767e] hover:text-slate-600 shrink-0" title="Remove attachment"><X size={14} /></button>
                </div>
              )}
              <div className="px-4 py-3 bg-[#f5f5f5] flex items-center justify-between border-t border-[#e4e5e7] rounded-b-md">
                 <div className="flex items-center gap-4 text-[#74767e]">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="hover:text-[#1dbf73] transition-all disabled:opacity-50" title="Attach a file (image, PDF or text, max 5 MB)">
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                    </button>
                    <div className="relative" ref={emojiRef}>
                      <button type="button" onClick={() => setEmojiOpen((o) => !o)} className={`hover:text-[#1dbf73] transition-all block ${emojiOpen ? "text-[#1dbf73]" : ""}`} title="Insert emoji">
                        <Smile size={18} />
                      </button>
                      {emojiOpen && (
                        <div className="absolute bottom-[calc(100%+10px)] left-0 w-[264px] bg-white border border-[#e4e5e7] rounded-2xl shadow-2xl z-30 p-2.5 grid grid-cols-8 gap-0.5">
                          {EMOJIS.map((e) => (
                            <button key={e} type="button" onClick={() => insertEmoji(e)} className="text-[18px] leading-none p-1.5 hover:bg-[#f1fdf7] rounded-lg transition-all">
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={referenceLastOrder}
                      disabled={!lastOrder}
                      className="hover:text-[#1dbf73] transition-all disabled:opacity-30 disabled:hover:text-[#74767e]"
                      title={lastOrder ? "Reference your latest order in this message" : "No recent order to reference"}
                    >
                      <Package size={18} />
                    </button>
                 </div>
                 <button
                  disabled={isSending || uploading || (!newMessage.trim() && !pendingAttachment)}
                  className="px-6 py-2 bg-[#1dbf73] text-white rounded font-bold text-[14px] hover:bg-[#19a463] transition-all disabled:opacity-50"
                 >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : "Send"}
                 </button>
              </div>
           </form>
           <div className="mt-2 flex items-center justify-between text-[11px] text-[#74767e]">
              <div className="flex items-center gap-1">
                 <ShieldCheck size={12} className="text-[#1dbf73]" />
                 Secure Conversation
              </div>
              <p className="hidden sm:block">Press Enter to send</p>
           </div>
        </div>
      </div>

      {/* ── Sidebar: Info Panel (Fiverr Style) ── */}
      <div className="hidden xl:flex w-[300px] flex-col border-l border-[#e4e5e7] bg-white">
         <div className="p-6 border-b border-[#e4e5e7]">
            <h4 className="text-[14px] font-bold text-[#404145] mb-6">About Support</h4>
            <div className="space-y-5">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#74767e]">
                     <LifeBuoy size={20} />
                  </div>
                  <div>
                     <div className="text-[13px] font-bold text-[#404145]">Help Center</div>
                     <div className="text-[11px] text-[#74767e]">Send a message any time</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#74767e]">
                     <Clock size={20} />
                  </div>
                  <div>
                     <div className="text-[13px] font-bold text-[#404145]">Support Replies</div>
                     <div className="text-[11px] text-[#74767e]">Right here in this conversation</div>
                  </div>
               </div>
            </div>
         </div>

         {lastOrder && (
            <div className="p-6 border-b border-[#e4e5e7]">
               <h4 className="text-[14px] font-bold text-[#404145] mb-4">Latest Order</h4>
               <div className="p-4 border border-[#e4e5e7] rounded-lg space-y-3">
                  <div className="text-[13px] font-bold text-[#404145] truncate">{lastOrder.products?.title}</div>
                  <div className="flex justify-between items-center">
                     <span className="text-[12px] text-[#74767e]">Order ID</span>
                     <span className="text-[12px] font-bold text-[#404145]">#{orderCode(lastOrder.id)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[12px] text-[#74767e]">Status</span>
                     <span className="px-2 py-0.5 bg-[#f1fdf7] text-[#1dbf73] rounded text-[10px] font-bold uppercase">{lastOrder.status}</span>
                  </div>
                  <Link href={`/order/${lastOrder.id}`} className="w-full mt-2 py-2.5 bg-white border border-[#e4e5e7] text-[#404145] rounded font-bold text-[12px] hover:bg-[#f5f5f5] transition-all flex items-center justify-center gap-2">
                     <Package size={14} /> View Details
                  </Link>
               </div>
            </div>
         )}

         <div className="p-6">
            <h4 className="text-[14px] font-bold text-[#404145] mb-4">Safety Tips</h4>
            <ul className="space-y-3">
               {[
                  "Never share your login credentials.",
                  "Only pay through our secure checkout.",
                  "Check asset details before finalizing."
               ].map((tip, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-[#74767e] leading-relaxed">
                     <Check size={14} className="text-[#1dbf73] shrink-0 mt-0.5" /> {tip}
                  </li>
               ))}
            </ul>
         </div>
      </div>

      {/* ── New ticket compose (Fix Round 4) ── */}
      {newTicketOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !creatingTicket && setNewTicketOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 bg-[#1dbf73] text-white flex justify-between items-center">
              <h3 className="text-lg font-black tracking-tight">New support ticket</h3>
              <button onClick={() => !creatingTicket && setNewTicketOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Cancel">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 lg:p-8 space-y-4">
              <p className="text-[12px] text-[#74767e] leading-relaxed">
                Opens a separate conversation with its own subject — use one ticket per topic so nothing gets mixed up with your general support chat.
              </p>
              <div>
                <label className="block text-[11px] font-black text-[#404145] uppercase tracking-widest mb-1.5">Subject</label>
                <input
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Question about my Xbox gift card order"
                  maxLength={120}
                  className="w-full bg-[#f5f5f5] border border-[#e4e5e7] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-[#404145] uppercase tracking-widest mb-1.5">Message</label>
                <textarea
                  value={ticketBody}
                  onChange={(e) => setTicketBody(e.target.value)}
                  placeholder="Describe what you need help with…"
                  rows={5}
                  className="w-full bg-[#f5f5f5] border border-[#e4e5e7] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setNewTicketOpen(false)}
                  disabled={creatingTicket}
                  className="flex-1 py-3.5 bg-white border border-[#e4e5e7] text-[#404145] rounded-xl font-bold text-[13px] hover:bg-[#f5f5f5] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createTicket}
                  disabled={creatingTicket || !ticketTitle.trim() || !ticketBody.trim()}
                  className="flex-1 py-3.5 bg-[#1dbf73] text-white rounded-xl font-bold text-[13px] hover:bg-[#19a463] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {creatingTicket ? <Loader2 size={16} className="animate-spin" /> : "Create ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
