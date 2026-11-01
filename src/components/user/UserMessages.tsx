"use client";

import React, { useState, useEffect, useRef } from "react";
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
  FileText
} from "lucide-react";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { lsGet, lsSet, lsRemove } from "@/src/lib/storage";
import { formatMessageBody, parseMessageBody, isImageAttachment } from "../../lib/message-format";

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const inboxMenuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const favKey = `aso_fav_thread:${username}`;

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
  }, [messages]);

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
            fetchMessages(profile.username);
            fetchLastOrder(profile.username);
        } else {
            fetchMessages(username);
            fetchLastOrder(username);
        }
    } else {
        setLoading(false);
    }
  }

  async function fetchMessages(overrideUser?: string) {
    const targetUser = overrideUser || username;
    try {
        const { data, error } = await db
            .from('messages')
            .select('*')
            .eq('username', targetUser)
            .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        setLoading(false);
    } catch (err: any) {
        console.error("Message Fetch Error:", err.message);
    }
  }

  async function fetchLastOrder(overrideUser?: string) {
    const targetUser = overrideUser || username;
    try {
      const { data } = await db
        .from('orders')
        .select('*, products(title, image)')
        .eq('username', targetUser)
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

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !pendingAttachment) return;

    setIsSending(true);
    try {
        const { error } = await db.from('messages').insert({
            username: username,
            subject: "Inbox Inquiry",
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
  const ticketStatus: string = messages.length > 0 ? (messages[messages.length - 1]?.ticket_status || "open") : "open";
  async function setTicket(status: "closed" | "open") {
    setTicketBusy(true);
    try {
      const res = await fetch("/api/messages/ticket", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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

  // ── F-09(e): export the conversation as a text file ──
  function exportTranscript() {
    const lines = messages.map((msg) => {
      const isAdmin = msg.message === '[ADMIN_INITIATED]';
      const parsed = parseMessageBody(isAdmin ? (msg.reply || "") : (msg.message || ""));
      const when = new Date(msg.created_at).toLocaleString();
      const attach = parsed.attachment ? `\n   [Attachment: ${parsed.attachment.name} — ${parsed.attachment.url}]` : "";
      return `[${when}] ${isAdmin ? "Customer Support" : "Me"}: ${parsed.text}${attach}`;
    });
    const blob = new Blob([`Customer Support conversation\n${"=".repeat(31)}\n\n${lines.join("\n\n")}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "support-conversation.txt";
    a.click();
    URL.revokeObjectURL(url);
    setHeaderMenuOpen(false);
  }

  // ── F-09(d): in-thread find ──
  const q = threadQuery.trim().toLowerCase();
  const matchIdxs = q
    ? messages.map((m, i) => (displayText(m).toLowerCase().includes(q) ? i : -1)).filter((i) => i >= 0)
    : [];
  useEffect(() => { setMatchPos(0); }, [threadQuery, messages.length]);
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

  // ── F-10: inbox filter (title, preview, or any message text) ──
  const lastMsg = messages[messages.length - 1];
  const threadPreview = lastMsg ? (displayText(lastMsg) || "Attachment") : "How can we help you today?";
  const iq = searchQuery.trim().toLowerCase();
  const threadMatches = !iq
    || "customer support".includes(iq)
    || threadPreview.toLowerCase().includes(iq)
    || messages.some((m) => displayText(m).toLowerCase().includes(iq));
  const showThread = threadMatches && (!starredOnly || fav);

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
        </div>
        <div className="flex-1 overflow-y-auto">
            {showThread ? (
            <button className="w-full p-4 flex items-center gap-3 bg-[#f1fdf7] border-l-4 border-[#1dbf73] transition-all">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#1dbf73] flex items-center justify-center text-white shrink-0 font-bold">
                        S
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#1dbf73] rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[14px] font-bold text-[#404145] truncate flex items-center gap-1.5">
                          Customer Support
                          {fav && <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />}
                        </span>
                        <span className="text-[11px] text-[#74767e]">Online</span>
                    </div>
                    <p className="text-[12px] text-[#74767e] truncate font-normal">{threadPreview}</p>
                </div>
            </button>
            ) : (
              <p className="p-4 text-[12px] text-[#74767e] leading-relaxed">
                {starredOnly && !fav
                  ? "No starred conversations yet — star this conversation from the ★ in its header."
                  : "No conversations match your search."}
              </p>
            )}
        </div>
      </div>

      {/* ── Main: Chat Area (Fiverr Style) ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e4e5e7] flex items-center justify-between bg-white">
           <div className="flex items-center gap-3">
              <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-[#1dbf73] flex items-center justify-center text-white font-bold text-sm">
                    S
                 </div>
                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#1dbf73] rounded-full border-2 border-white" />
              </div>
              <div>
                 <div className="text-[15px] font-bold text-[#404145] flex items-center gap-2">
                    Customer Support
                 </div>
                 <p className="text-[12px] text-[#1dbf73] font-medium flex items-center gap-2">
                    Online
                    {/* Ticket state (P3) — mirrors the admin desk */}
                    {messages.length > 0 && (() => {
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
           ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-4">
                     <MessageSquare className="text-[#b5b6ba]" size={32} />
                  </div>
                  <p className="text-[15px] font-bold text-[#404145]">No messages yet</p>
                  <p className="text-[13px] text-[#74767e] mt-1">Start a conversation with our support team.</p>
              </div>
           ) : (
              messages.map((msg, idx) => {
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
                  <button type="button" onClick={() => setPendingAttachment(null)} className="text-[#74767e] hover:text-red-500 shrink-0" title="Remove attachment"><X size={14} /></button>
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
              <p>Press Enter to send</p>
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
                     <div className="text-[11px] text-[#74767e]">24/7 Availability</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#74767e]">
                     <Clock size={20} />
                  </div>
                  <div>
                     <div className="text-[13px] font-bold text-[#404145]">Avg. Response</div>
                     <div className="text-[11px] text-[#74767e]">Within 1 hour</div>
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

    </div>
  );
}
