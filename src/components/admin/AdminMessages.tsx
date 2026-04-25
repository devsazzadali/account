import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  Search, User, Send, CheckCheck, Loader2, MoreVertical, Paperclip, 
  ShieldCheck, CheckCircle2, MessageSquare, RefreshCw, Clock, 
  Info, ExternalLink, Filter, ChevronRight, Mail, Phone,
  AlertCircle, Archive, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchMessages();
    fetchProfiles();
    
    const preSelected = localStorage.getItem("selectedUserChat");
    if (preSelected) {
      setSelectedUser(preSelected);
      localStorage.removeItem("selectedUserChat");
    }

    const channel = supabase
      .channel('helpdesk_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserOrders(selectedUser);
      markMessagesAsRead(selectedUser);
    }
  }, [selectedUser]);

  async function fetchUserOrders(username: string) {
    const { data } = await supabase.from('orders').select('*, products(title)').eq('username', username).order('created_at', { ascending: false });
    setUserOrders(data || []);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('*').order('username');
    setAllProfiles(data || []);
  }

  const startNewChat = (username: string) => {
    setSelectedUser(username);
    setShowNewChatModal(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  async function markMessagesAsRead(username: string) {
    try {
      await supabase.from('messages').update({ status: 'replied' }).eq('username', username).eq('status', 'unread');
    } catch (e) { console.error(e); }
  }

  async function fetchMessages() {
    try {
        const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
        if (data && data.length > 0 && !selectedUser) {
            const uniqueUsers = Array.from(new Set(data.map(m => m.username)));
            if (uniqueUsers.length > 0) setSelectedUser(uniqueUsers[0]);
        }
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
        const { error } = await supabase.from('messages').insert({
            username: selectedUser,
            subject: "Helpdesk Ticket",
            message: "[ADMIN_INITIATED]",
            reply: textToSend,
            status: 'replied',
            replied_at: new Date().toISOString()
        });
        if (error) throw error;
        setReplyText("");
        fetchMessages();
    } catch (err: any) {
        alert("Error: " + err.message);
    } finally {
        setIsReplying(false);
    }
  }

  const groupedUsers = useMemo(() => {
      const map = new Map<string, any[]>();
      messages.forEach(msg => {
          if (!map.has(msg.username)) map.set(msg.username, []);
          map.get(msg.username)!.push(msg);
      });
      return map;
  }, [messages]);

  const sortedUserList = useMemo(() => {
    return Array.from(groupedUsers.keys())
      .filter(u => u && u.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
          const msgsA = groupedUsers.get(a) || [];
          const msgsB = groupedUsers.get(b) || [];
          const lastMsgA = msgsA[msgsA.length - 1];
          const lastMsgB = msgsB[msgsB.length - 1];
          if (!lastMsgA || !lastMsgB) return 0;
          return new Date(lastMsgB.created_at).getTime() - new Date(lastMsgA.created_at).getTime();
      });
  }, [groupedUsers, searchQuery]);

  const activeThread = selectedUser ? groupedUsers.get(selectedUser) || [] : [];
  const selectedProfile = allProfiles.find(p => p.username === selectedUser);

  const quickReplies = [
    { label: "Greeting", text: "Hello! Thank you for contacting our support. How can I assist you today?" },
    { label: "Order Check", text: "I'm checking the status of your order now. One moment please." },
    { label: "Credentials", text: "The account details have been securely updated in your 'Orders' tab. Please let me know if you face any login issues." },
    { label: "Closing", text: "Is there anything else I can help you with before we close this ticket?" }
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#f8fafc] border border-slate-200 rounded-3xl overflow-hidden shadow-2xl font-sans">
      
      {/* ── Sidebar: Inbox List ── */}
      <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              Support Portal
            </h2>
            <button onClick={() => setShowNewChatModal(true)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <PlusCircleIcon size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] focus:outline-none focus:border-primary-600/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sortedUserList.length === 0 ? (
            <div className="p-10 text-center text-[12px] text-slate-400 font-medium">No active inquiries</div>
          ) : sortedUserList.map((user) => {
            const msgs = groupedUsers.get(user) || [];
            const lastMsg = msgs[msgs.length - 1];
            if (!lastMsg) return null;
            const isUnread = msgs.some((m: any) => m.status === 'unread' && m.message !== '[ADMIN_INITIATED]');
            
            return (
              <button 
                key={user}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 flex items-start gap-3 border-b border-slate-50 transition-all relative ${
                  selectedUser === user ? "bg-primary-50/50" : "hover:bg-slate-50"
                }`}
              >
                {selectedUser === user && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[14px] ${isUnread ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-slate-100 text-slate-400'}`}>
                  {user[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-[13px] truncate ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{user}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lastMsg.created_at ? new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate leading-tight">
                    {lastMsg.message === '[ADMIN_INITIATED]' ? `Reply: ${lastMsg.reply}` : lastMsg.message}
                  </div>
                </div>
                {isUnread && <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 animate-pulse" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main: Support View ── */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
                  <User size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-slate-900">{selectedUser}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-100">Live Support</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Customer Support Thread • {(selectedProfile?.email || selectedUser).toLowerCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-all"><Archive size={14} /> Archive</button>
                 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"><CheckCircle size={14} /> Mark Resolved</button>
              </div>
            </div>

            {/* Ticket Thread Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
               <div className="max-w-3xl mx-auto space-y-8 pb-10">
                  <div className="flex items-center gap-4 py-4 opacity-50">
                     <div className="h-px flex-1 bg-slate-200"></div>
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Inquiry started on {activeThread[0]?.created_at ? new Date(activeThread[0].created_at).toLocaleDateString() : "Today"}</span>
                     <div className="h-px flex-1 bg-slate-200"></div>
                  </div>

                  {activeThread.map((msg: any) => {
                    const isAdmin = msg.message === '[ADMIN_INITIATED]';
                    return (
                      <div key={msg.id} className="flex gap-4">
                         <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-[12px] font-bold ${isAdmin ? 'bg-primary-600 shadow-md shadow-primary-600/20' : 'bg-slate-400'}`}>
                            {isAdmin ? 'A' : (selectedUser[0] || 'U').toUpperCase()}
                         </div>
                         <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1.5">
                               <span className="text-[13px] font-bold text-slate-900">{isAdmin ? 'Support Agent' : selectedUser}</span>
                               <span className="text-[11px] text-slate-400 font-medium">{new Date(msg.replied_at || msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                               {isAdmin && <CheckCheck size={14} className="text-primary-600 ml-auto" />}
                            </div>
                            <div className={`p-4 rounded-2xl border ${isAdmin ? 'bg-white border-primary-100 shadow-sm' : 'bg-slate-100 border-slate-200'}`}>
                               <p className="text-[13.5px] leading-relaxed text-slate-700 whitespace-pre-wrap">{isAdmin ? msg.reply : msg.message}</p>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
               </div>
            </div>

            {/* Quick Response & Input Area ── */}
            <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              {/* Canned Response bar */}
              <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap mr-2 flex items-center gap-1.5"><Filter size={10} /> Macros:</span>
                 {quickReplies.map((qr, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSendReply(undefined, qr.text)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-primary-50 hover:border-primary-100 hover:text-primary-700 transition-all whitespace-nowrap active:scale-95"
                    >
                      {qr.label}
                    </button>
                 ))}
              </div>

              <form onSubmit={handleSendReply} className="relative">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                  placeholder={`Write a professional reply to ${selectedUser}...`}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-[14px] focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5 transition-all min-h-[100px] resize-none shadow-sm"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                   <button type="button" className="p-2 text-slate-400 hover:text-slate-600"><Paperclip size={20} /></button>
                   <button 
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 active:scale-95"
                  >
                    {isReplying ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </form>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                 <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    Auto-scroll enabled
                 </div>
                 <div className="italic font-bold">Shift + Enter for new line</div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/10">
            <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center text-primary-600 mb-8 border border-slate-100">
              <MessageSquare size={36} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Agent Console</h3>
            <p className="text-slate-500 max-w-sm text-[14px] leading-relaxed">Select a customer inquiry to begin support operations. All communication is recorded for quality assurance.</p>
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Customer Data ── */}
      {selectedUser && (
        <div className="w-[280px] bg-white border-l border-slate-200 flex flex-col shrink-0">
           <div className="p-6 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-6">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intelligence</h5>
                 <button className="p-1.5 bg-slate-50 rounded text-slate-400 hover:text-slate-600"><ExternalLink size={14} /></button>
              </div>
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-lg">
                    {selectedUser[0].toUpperCase()}
                 </div>
                 <div>
                    <div className="text-[14px] font-bold text-slate-900">{selectedUser}</div>
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       Qualified Buyer
                    </div>
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Registration:</span>
                    <span className="text-slate-900 font-bold">{selectedProfile?.created_at ? new Date(selectedProfile.created_at).toLocaleDateString() : "Jan 2024"}</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Status:</span>
                    <span className="text-emerald-600 font-bold">Verified</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/20">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Involved Transactions</h5>
              <div className="space-y-3">
                 {userOrders.length === 0 ? (
                    <div className="p-6 bg-white border border-slate-100 rounded-xl text-center border-dashed">
                       <AlertCircle size={20} className="mx-auto text-slate-200 mb-2" />
                       <span className="text-[11px] text-slate-400 font-bold">No Transaction Data</span>
                    </div>
                 ) : userOrders.map(order => (
                    <div key={order.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-primary-600/30 transition-all cursor-default shadow-sm">
                       <div className="text-[11px] font-bold text-slate-900 mb-1 truncate">{order.products?.title}</div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-primary-600">${order.total_price}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${order.status === 'Delivered' || order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                             {order.status}
                          </span>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="mt-8">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">LTV Analysis</h5>
                 <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
                    <div className="text-[20px] font-black mb-1">${userOrders.reduce((s,o) => s+(Number(o.total_price)||0), 0).toFixed(2)}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">Cumulative Spending</div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* New Chat Modal ── */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewChatModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="px-8 py-6 border-b border-slate-100 bg-white">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Create Support Ticket</h3>
                <p className="text-[13px] text-slate-500 font-medium">Internal manual ticket creation for existing users.</p>
              </div>
              <div className="p-6 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search by username..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-primary-600 transition-all" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {allProfiles.filter(p => p.username && p.username.toLowerCase().includes(userSearch.toLowerCase())).map(profile => (
                  <button key={profile.username} onClick={() => startNewChat(profile.username)} className="w-full flex items-center gap-4 p-4 hover:bg-primary-50 rounded-2xl transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary-600 group-hover:text-white transition-colors">
                       {profile.username[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-[14px] font-bold text-slate-900">{profile.username}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{profile.email || "Registered Account"}</div>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-primary-600 transition-all" />
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

function PlusCircleIcon({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
    )
}
