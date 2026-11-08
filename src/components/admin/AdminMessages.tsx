"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { orderCode } from "../../lib/order-ref";
import { 
  Search, User, Send, CheckCheck, Loader2, MoreVertical, Paperclip, 
  ShieldCheck, CheckCircle2, MessageSquare, RefreshCw, Clock, 
  Info, ExternalLink, Filter, ChevronRight, Mail, Phone,
  AlertCircle, Archive, CheckCircle, Radio, Send as SendIcon,
  Users, UserPlus, Zap, ChevronLeft, FileText, X, List, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { toast } from "react-hot-toast";
import { lsGet, lsRemove, lsSet } from "@/src/lib/storage";
import {
  GENERAL_THREAD_KEY,
  threadKeyOf,
  threadTitleOf,
  subjectForNewMessage,
} from "../../lib/message-threads";

// Fix Round 4 (item 3): the desk groups by THREAD — (username,
// subject group) per src/lib/message-threads.ts — so a customer's
// titled tickets appear as their own conversations next to the
// general "Customer Support" thread, and replies + ticket state act
// on the selected thread only.
// ধাপ ৫ক৩: the grouping owner is the STABLE identity — the row's
// user_id when present (every current write path stamps it), falling
// back to the username for pre-stamp rows. A customer who renames
// keeps ONE thread here; the display/addressing name resolves to the
// profile's CURRENT username.
interface AdminThread {
  id: string;
  username: string;
  userId: string | null;
  threadKey: string;
  title: string;
  msgs: any[];
}


export function AdminMessages({ setActiveTab }: { setActiveTab?: (tab: string) => void } = {}) {
  // Fix Round 6 (item 5): Order History rows are clickable — they hand
  // the order id to the Sold Orders screen (same localStorage preselect
  // pattern as Customers → Messages) and switch tabs; AdminOrders opens
  // that order's detail on arrival.
  const openOrder = (orderId: string) => {
    if (!setActiveTab) return;
    lsSet("openOrderId", orderId);
    setActiveTab("orders");
  };
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Selection = one THREAD of one user (Fix Round 4; userId added in
  // ধাপ ৫ক৩ so the selection survives the customer renaming).
  const [selection, setSelection] = useState<{ username: string; userId: string | null; threadKey: string } | null>(null);
  const selectedUser = selection?.username ?? null;
  const selectedThreadKey = selection?.threadKey ?? GENERAL_THREAD_KEY;
  const pendingPreselectRef = useRef(false);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  
  // Mobile navigation state
  const [viewMode, setViewMode] = useState<"list" | "chat">("list");

  // Broadcast state (P4: announcements via /api/admin/broadcast)
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Ticket queue filter (P3): open / awaiting_reply / closed
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "awaiting_reply" | "closed">("all");

  useEffect(() => {
    fetchMessages();
    fetchProfiles();

    const preSelected = lsGet("selectedUserChat");
    if (preSelected) {
      setSelection({ username: preSelected, userId: null, threadKey: GENERAL_THREAD_KEY });
      pendingPreselectRef.current = true;
      setViewMode("chat");
      lsRemove("selectedUserChat");
    }

    const channel = db
      .channel('helpdesk_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selection) {
      fetchUserOrders(selection.username);
      const msgs = messages.filter((m) => {
        if (threadKeyOf(m.subject) !== selection.threadKey) return false;
        // Stable identity first; username match for pre-stamp rows.
        return selection.userId ? m.user_id === selection.userId : m.username === selection.username;
      });
      markMessagesAsRead(msgs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  async function fetchUserOrders(username: string) {
    // Fix Round 5 (item 3): a buyer's orders are keyed three ways —
    // the username snapshot on the order, their user_id, and their
    // customer_email. Matching by username alone (the old query) hid
    // orders placed under a different snapshot (e.g. before a rename,
    // or via a flow that stamped only the email), which is how this
    // panel could show 2 orders while Sold Orders showed 0 for the
    // same store. Union all three keys and de-duplicate by order id.
    const profile =
      allProfiles.find((p) => p.username === username) ||
      (await db.from('profiles').select('id, email').eq('username', username).single()).data;
    const queries = [
      db.from('orders').select('*, products(title)').eq('username', username),
    ];
    if (profile?.email) queries.push(db.from('orders').select('*, products(title)').eq('customer_email', profile.email));
    if (profile?.id) queries.push(db.from('orders').select('*, products(title)').eq('user_id', profile.id));
    const results = await Promise.all(queries);
    const byId = new Map<string, any>();
    for (const r of results) for (const o of r.data || []) byId.set(o.id, o);
    const merged = [...byId.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setUserOrders(merged);
  }

  async function fetchProfiles() {
    const { data } = await db.from('profiles').select('*').order('username');
    setAllProfiles(data || []);
  }

  const startNewChat = (profile: any) => {
    setSelection({ username: profile.username, userId: profile.id ?? null, threadKey: GENERAL_THREAD_KEY });
    setViewMode("chat");
    setShowNewChatModal(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selection]);

  async function markMessagesAsRead(msgs: any[]) {
    const ids = msgs
      .filter((m) => m.status === 'unread' && m.message !== '[ADMIN_INITIATED]')
      .map((m) => m.id);
    if (ids.length === 0) return;
    try {
      await db.from('messages').update({ status: 'replied' }).in('id', ids);
    } catch (e) { console.error(e); }
  }

  async function fetchMessages() {
    try {
        const { data, error } = await db.from('messages').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
        // Fix Round 5 (item 6): NO auto-open here. This fetch used to
        // auto-select the most recently active thread on desktop, and
        // the selection effect immediately marked that thread's messages
        // read server-side — so merely opening the Messages page (or a
        // realtime refetch) drained the unread badge (observed live:
        // 14 → 13 and 14 → 9 with no thread ever clicked). A thread is
        // now marked read only when the admin explicitly opens it (or
        // arrives via the deliberate Customers → message preselect).
        setLoading(false);
    } catch (err: any) {
        setLoading(false);
    }
  }

  async function handleSendReply(e?: React.FormEvent, overrideText?: string) {
    if (e) e.preventDefault();
    const textToSend = overrideText || replyText;
    if (!selectedUser || !textToSend.trim()) return;

    setIsReplying(true);
    try {
        const { error } = await db.from('messages').insert({
            username: selectedUser,
            subject: subjectForNewMessage(selectedThreadKey, true),
            message: "[ADMIN_INITIATED]",
            reply: textToSend,
            status: 'replied'
            // NOTE: no replied_at — the messages table has no such column;
            // sending it makes Prisma reject the whole insert, so admin
            // replies silently never reached customers (found by QA round 5;
            // created_at is the reply timestamp).
        });
        if (error) throw error;
        setReplyText("");
        fetchMessages();
    } catch (err: any) {
        toast.error("Error: " + err.message);
    } finally {
        setIsReplying(false);
    }
  }

  async function handleBroadcast() {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
       // Real broadcast (P4): one announcement + a notification per buyer
       // (+ queued email when the provider is configured) — server-side.
       const res = await fetch("/api/admin/broadcast", {
         method: "POST",
         credentials: "same-origin",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ title: broadcastTitle.trim(), body: broadcastMessage.trim() }),
       });
       const json = await res.json();
       if (!res.ok) throw new Error(json.error || "Broadcast failed");
       toast.success(`Announcement sent to ${json.recipients} buyer(s)${json.emailed ? `, ${json.emailed} email(s) queued` : ""}`);
       setBroadcastTitle("");
       setBroadcastMessage("");
       setShowBroadcastModal(false);
    } catch (e: any) {
      toast.error("Broadcast Error: " + e.message);
    } finally {
      setIsBroadcasting(false);
    }
  }

  async function setTicketStatus(thread: AdminThread | undefined, status: "closed" | "open") {
    if (!thread || thread.msgs.length === 0) {
      toast.error("No messages in this thread yet");
      return;
    }
    try {
      const { error } = await db.from('messages').update({ ticket_status: status }).in('id', thread.msgs.map((m) => m.id));
      if (error) throw error;
      toast.success(status === "closed" ? "Ticket closed" : "Ticket reopened");
      fetchMessages();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const groupedThreads = useMemo(() => {
      const map = new Map<string, AdminThread>();
      messages.forEach(msg => {
          const tKey = threadKeyOf(msg.subject);
          // Stable owner key: user_id when the row carries it (all
          // current writes do), else the stamped username.
          const ownerKey = msg.user_id ? `u:${msg.user_id}` : `n:${msg.username}`;
          const id = `${ownerKey}::${tKey}`;
          if (!map.has(id)) {
            map.set(id, { id, username: msg.username, userId: msg.user_id ?? null, threadKey: tKey, title: threadTitleOf(tKey), msgs: [] });
          }
          map.get(id)!.msgs.push(msg);
      });
      // Display/addressing name = the owner's CURRENT profile username
      // when it can be resolved, so a renamed customer shows (and is
      // replied to) under their new name, in the same single thread.
      for (const t of map.values()) {
        if (t.userId) {
          const p = allProfiles.find((pr) => pr.id === t.userId);
          if (p?.username) t.username = p.username;
        }
      }
      return map;
  }, [messages, allProfiles]);

  const threadLastTime = (t: AdminThread) => {
    const last = t.msgs[t.msgs.length - 1];
    return last?.created_at ? new Date(last.created_at).getTime() : 0;
  };

  const threadStatusOf = (t: AdminThread) => {
    const last = t.msgs[t.msgs.length - 1];
    return (last?.ticket_status as string) || "open";
  };

  const sortedThreadList = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return Array.from(groupedThreads.values())
      .filter(t => t.username && (t.username.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)))
      .filter(t => ticketFilter === "all" || threadStatusOf(t) === ticketFilter)
      .sort((a, b) => threadLastTime(b) - threadLastTime(a));
  }, [groupedThreads, searchQuery, ticketFilter]);

  const selectedThread = selection
    ? Array.from(groupedThreads.values()).find((t) =>
        t.threadKey === selection.threadKey &&
        (selection.userId
          ? t.userId === selection.userId
          : t.username === selection.username || t.msgs.some((m) => m.username === selection.username)))
    : undefined;
  const activeThread = selectedThread?.msgs || [];
  const selectedThreadStatus = selectedThread ? threadStatusOf(selectedThread) : "open";
  const selectedProfile =
    (selection?.userId ? allProfiles.find(p => p.id === selection.userId) : undefined) ||
    allProfiles.find(p => p.username === selectedUser);

  // A preselected user (customers desk → "message" action) lands on
  // their most recent thread once messages have loaded.
  useEffect(() => {
    if (!pendingPreselectRef.current || !selection) return;
    const mine = Array.from(groupedThreads.values()).filter(
      t => t.username === selection.username || t.msgs.some((m) => m.username === selection.username),
    );
    if (mine.length === 0) return;
    pendingPreselectRef.current = false;
    if (!mine.some(t => t.threadKey === selection.threadKey)) {
      const latest = mine.reduce((a, b) => (threadLastTime(b) > threadLastTime(a) ? b : a));
      setSelection({ username: selection.username, userId: latest.userId ?? selection.userId, threadKey: latest.threadKey });
    }
  }, [groupedThreads, selection]);

  // ধাপ ৫ক৩ — the `quickReplies` canned-reply array that used to sit
  // here was dead code (defined, never rendered). Removed.

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f0f2f5] overflow-hidden relative">
      
      {/* ── Sidebar: Inbox List ── */}
      <div className={`w-full lg:w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 ${viewMode === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              Inbox
            </h2>
            <div className="flex gap-1">
               <button onClick={() => setShowBroadcastModal(true)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <Zap size={18} />
              </button>
              <button onClick={() => setShowNewChatModal(true)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                <UserPlus size={18} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] focus:outline-none focus:border-primary-500/40"
            />
          </div>
          {/* Ticket queue (P3) */}
          <div className="flex gap-1.5 mt-3">
            {([
              ["all", "All"],
              ["open", "Open"],
              ["awaiting_reply", "Awaiting reply"],
              ["closed", "Closed"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTicketFilter(id)}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${ticketFilter === id ? "bg-primary-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sortedThreadList.map((thread) => {
            const msgs = thread.msgs;
            const lastMsg = msgs[msgs.length - 1];
            if (!lastMsg) return null;
            const user = thread.username;
            const isUnread = msgs.some((m: any) => m.status === 'unread' && m.message !== '[ADMIN_INITIATED]');
            const isTicket = thread.threadKey !== GENERAL_THREAD_KEY;
            const status = threadStatusOf(thread);

            return (
              <button
                key={thread.id}
                onClick={() => { setSelection({ username: thread.username, userId: thread.userId, threadKey: thread.threadKey }); setViewMode("chat"); }}
                className={`w-full p-4 flex items-start gap-3 border-b border-slate-50 transition-all relative ${
                  selectedThread?.id === thread.id ? "bg-red-50/50" : "hover:bg-slate-50"
                }`}
              >
                {selectedThread?.id === thread.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[14px] ${isUnread ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {user[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-[13px] truncate uppercase tracking-tight ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{user}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lastMsg.created_at ? new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}
                    </span>
                  </div>
                  {isTicket && (
                    <div className="text-[11px] font-bold text-slate-700 truncate leading-tight" title={thread.title}>
                      Ticket: {thread.title}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 truncate leading-tight">
                    {lastMsg.message === '[ADMIN_INITIATED]' ? `You: ${lastMsg.reply}` : lastMsg.message}
                  </div>
                  <span className={`inline-block mt-1.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    status === 'closed' ? 'bg-slate-100 text-slate-400' :
                    status === 'awaiting_reply' ? 'bg-blue-50 text-blue-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {status === 'awaiting_reply' ? 'Awaiting reply' : status}
                  </span>
                </div>
                {isUnread && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 animate-pulse" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main: Support View ── */}
      <div className={`flex-1 flex flex-col bg-[#f0f2f5] ${viewMode === 'list' ? 'hidden lg:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Thread Header */}
            <div className="px-6 py-3 border-b border-slate-200 flex flex-col bg-white z-10 shadow-sm gap-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setViewMode("list")} className="lg:hidden p-1 -ml-1 text-slate-400 hover:text-slate-900">
                       <ChevronLeft size={24} />
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-primary-200 bg-primary-600 flex items-center justify-center">
                      <span className="text-white font-black text-sm uppercase">{(selectedUser || "?").charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-bold text-slate-900 truncate uppercase">{selectedUser}</h3>
                        {/* ধাপ ৫ক৩ — real profile id only (the hardcoded
                            '1493869' fallback fabricated an id when the
                            profile was missing); no presence label —
                            the desk cannot know if the customer is
                            online, so it no longer claims "Offline". */}
                        {selectedProfile?.id && (
                          <span className="text-[13px] text-primary-600 font-medium tracking-tight">ID:{selectedProfile.id.substring(0, 7)}</span>
                        )}
                      </div>
                      {selectedThreadKey !== GENERAL_THREAD_KEY && (
                        <span className="text-[11px] font-bold text-slate-500 truncate" title={threadTitleOf(selectedThreadKey)}>
                          Ticket: {threadTitleOf(selectedThreadKey)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Ticket state controls (P3) — per thread (Fix Round 4) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg ${
                      selectedThreadStatus === 'closed' ? 'bg-slate-100 text-slate-400' :
                      selectedThreadStatus === 'awaiting_reply' ? 'bg-blue-50 text-blue-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      Ticket: {selectedThreadStatus === 'awaiting_reply' ? 'Awaiting reply' : selectedThreadStatus}
                    </span>
                    {selectedThreadStatus === 'closed' ? (
                      <button onClick={() => setTicketStatus(selectedThread, 'open')} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50">
                        Reopen
                      </button>
                    ) : (
                      <button onClick={() => setTicketStatus(selectedThread, 'closed')} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-primary-700">
                        Close ticket
                      </button>
                    )}
                  </div>
              </div>
              <div className="flex gap-6">
                  <button onClick={() => setViewMode('chat')} className={`flex items-center gap-2 text-[13px] font-bold pb-2 transition-all ${viewMode === 'chat' ? 'text-slate-900 border-b-2 border-primary-500' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Clock size={16} /> Chat History
                  </button>
                  <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 text-[13px] font-bold pb-2 transition-all ${viewMode !== 'chat' ? 'text-slate-900 border-b-2 border-primary-500' : 'text-slate-400 hover:text-slate-600'}`}>
                      <List size={16} /> Order History
                  </button>
              </div>
            </div>

            {/* Ticket Thread Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f0f2f5] custom-scrollbar">
               <div className="max-w-5xl mx-auto space-y-4 pb-10">
                  {viewMode === 'chat' && activeThread.map((msg: any) => {
                    const isAdmin = msg.message === '[ADMIN_INITIATED]';
                    const timeString = new Date(msg.replied_at || msg.created_at).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false }).replace(',', '');
                    
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                         <div className={`flex gap-2 max-w-[80%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                             {!isAdmin && (
                                 <div className="w-10 h-10 rounded-xl bg-primary-600 shrink-0 overflow-hidden shadow-sm border border-primary-200 mt-1 flex items-center justify-center">
                                    <span className="text-white font-black text-sm uppercase">{(selectedUser || "?").charAt(0)}</span>
                                 </div>
                             )}
                             <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                 <div className={`px-4 py-2 rounded-lg shadow-sm relative ${isAdmin ? 'bg-[#dcf8c6] text-slate-800' : 'bg-white border border-slate-200 text-slate-800'}`}>
                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{isAdmin ? msg.reply : msg.message}</p>
                                    {/* ধাপ ৫ক৩ (QA3 D9) — the dead "show
                                        translation" button (no handler, no
                                        translation feature exists) removed. */}
                                    <div className="text-[11px] font-medium mt-1 text-right text-[#b5c49b]">
                                        {timeString}
                                    </div>
                                 </div>
                             </div>
                         </div>
                      </div>
                    );
                  })}

                  {viewMode !== 'chat' && (
                      <div className="space-y-4">
                          {userOrders.map(order => (
                             <div key={order.id} onClick={() => openOrder(order.id)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
                                 <div className="flex justify-between items-start mb-2">
                                     <h4 className="font-bold text-slate-900 uppercase tracking-tight">{order.products?.title || 'Unknown Product'}</h4>
                                 </div>
                                 <div className="flex justify-between items-center text-[13px] text-slate-500">
                                     <div>Order ID: <span className="bg-slate-50 px-2 py-0.5 rounded text-slate-700 font-mono">{orderCode(order.id)}</span></div>
                                     <div>Time: {new Date(order.created_at).toLocaleString('en-CA')}</div>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                     <span className={`text-[11px] px-2.5 py-1 rounded font-bold uppercase tracking-wider ${order.status === 'Delivered' || order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                         {order.status}
                                     </span>
                                     <button className="text-[11px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-1 transition-all">Details <ExternalLink size={12} /></button>
                                 </div>
                             </div>
                          ))}
                          {userOrders.length === 0 && <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-slate-200 uppercase tracking-widest text-[12px] font-bold">No Transaction History Found</div>}
                      </div>
                  )}
                  <div ref={chatEndRef} />
               </div>
            </div>

            {/* Input Area */}
            {viewMode === 'chat' && (
                <div className="p-4 lg:p-6 bg-[#f0f2f5]">
                  <form onSubmit={handleSendReply} className="relative max-w-5xl mx-auto flex gap-4">
                    <label className="w-[50px] h-[50px] bg-white border border-slate-200 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 shadow-sm transition-all shrink-0 cursor-pointer group relative">
                        <ImageIcon size={20} className="group-hover:text-emerald-500 transition-colors" />
                        <input type="file" multiple className="hidden" accept="image/*" onChange={() => toast('Photo upload feature coming soon!')} />
                        <span className="absolute -top-10 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest pointer-events-none">Photo</span>
                    </label>
                    <label className="w-[50px] h-[50px] bg-white border border-slate-200 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 shadow-sm transition-all shrink-0 cursor-pointer group relative">
                        <Paperclip size={20} className="group-hover:text-emerald-500 transition-colors" />
                        <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={() => toast('Document upload feature coming soon!')} />
                        <span className="absolute -top-10 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest pointer-events-none">Document</span>
                    </label>
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                      placeholder="Type your message..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3 text-[14px] shadow-sm focus:outline-none focus:border-emerald-500 min-h-[50px] resize-none transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={isReplying || !replyText.trim()}
                        className="w-[50px] h-[50px] bg-[#dcf8c6] text-slate-700 rounded-lg flex items-center justify-center hover:bg-emerald-100 shadow-sm transition-all disabled:opacity-50 shrink-0"
                    >
                        {isReplying ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </form>
                </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f0f2f5]">
            <div className="w-16 h-16 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Select a Conversation</h3>
            <p className="text-slate-500 max-w-xs text-[14px] font-medium">Choose a user from the left sidebar to view their activity history.</p>
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Intelligence & Orders ── */}
      {selectedUser && userOrders.length > 0 && (
        <div className="hidden xl:flex w-[320px] bg-white border-l border-slate-200 flex-col shrink-0">
           <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <h5 className="text-[11px] font-black text-slate-400 mb-6 tracking-[0.2em] uppercase">User Analytics</h5>
              
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-primary-600 font-black text-2xl shadow-sm">
                    {selectedUser[0].toUpperCase()}
                 </div>
                 <div>
                    <div className="text-[16px] font-black text-slate-900 uppercase tracking-tight">{selectedUser}</div>
                    <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Verified Buyer</div>
                 </div>
              </div>
              
              <div className="space-y-4 text-[12px] bg-slate-50 rounded-xl p-4 border border-slate-100 mb-8">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Registered</span>
                    <span className="text-slate-900 font-black">{selectedProfile?.created_at ? new Date(selectedProfile.created_at).toLocaleDateString() : "—"}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Status</span>
                    <span className={selectedProfile?.is_premium ? 'text-amber-500 font-black' : 'text-slate-900 font-black'}>{selectedProfile?.is_premium ? 'PREMIUM' : 'REGULAR'}</span>
                 </div>
              </div>

              {userOrders.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase">Recent Orders</h5>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">{userOrders.length}</span>
                    </div>
                    <div className="space-y-3">
                        {userOrders.slice(0, 5).map(order => (
                          <div key={order.id} onClick={() => openOrder(order.id)} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:border-primary-200 transition-all cursor-pointer group">
                              <div className="flex justify-between items-start mb-1.5">
                                  <div className="text-[12px] font-black text-slate-800 truncate pr-2 uppercase tracking-tight">{order.products?.title || 'Asset'}</div>
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                  <span>{order.status}</span>
                                  <span className="font-mono">#{orderCode(order.id)}</span>
                              </div>
                          </div>
                        ))}
                    </div>
                </div>
              )}

              {userOrders.length === 0 && (
                <div className="mt-10 text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                    <FileText className="mx-auto text-slate-200 mb-3" size={32} />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No order records</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Broadcast Modal ── */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBroadcastModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg panel shadow-2xl overflow-hidden flex flex-col">
              <div className="px-8 py-6 bg-primary-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <Zap size={24} />
                   <h3 className="text-xl font-black tracking-tight">Global Broadcast</h3>
                </div>
                <button onClick={() => setShowBroadcastModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 lg:p-8 space-y-4">
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                  Creates an announcement on every buyer's dashboard plus an in-app notification. Email copies are sent too when the email provider is configured (Settings → Integrations).
                </p>
                <input
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="Announcement title (e.g. Weekend maintenance)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold"
                />
                <textarea
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="Announcement message..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm min-h-[150px] resize-none"
                />
                <button
                  disabled={isBroadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                  onClick={handleBroadcast}
                  className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-600/20 disabled:opacity-40"
                >
                  {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : "Send Announcement"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Chat Modal ── */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewChatModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md panel shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-4">Initialize Ticket</h3>
                <input type="text" placeholder="Search username..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {allProfiles.filter(p => p.username && p.username.toLowerCase().includes(userSearch.toLowerCase())).map(profile => (
                  <button key={profile.username} onClick={() => startNewChat(profile)} className="w-full flex items-center gap-4 p-4 hover:bg-primary-50 rounded-2xl transition-all">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase">{profile.username[0]}</div>
                    <div className="text-left">
                      <div className="text-[14px] font-bold text-slate-900">{profile.username}</div>
                      <div className="text-[11px] text-slate-500">{profile.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

