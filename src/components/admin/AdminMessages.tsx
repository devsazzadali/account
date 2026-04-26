import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  Search, User, Send, CheckCheck, Loader2, MoreVertical, Paperclip, 
  ShieldCheck, CheckCircle2, MessageSquare, RefreshCw, Clock, 
  Info, ExternalLink, Filter, ChevronRight, Mail, Phone,
  AlertCircle, Archive, CheckCircle, Radio, Send as SendIcon,
  Users, UserPlus, Zap, ChevronLeft, FileText
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
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  
  // Mobile navigation state
  const [viewMode, setViewMode] = useState<"list" | "chat">("list");

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchProfiles();
    
    const preSelected = localStorage.getItem("selectedUserChat");
    if (preSelected) {
      setSelectedUser(preSelected);
      setViewMode("chat");
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
    setViewMode("chat");
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
        if (data && data.length > 0 && !selectedUser && window.innerWidth > 1024) {
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

  async function handleBroadcast() {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
       const promises = allProfiles.map(profile => {
         return supabase.from('messages').insert({
           username: profile.username,
           subject: "Global Announcement",
           message: "[ADMIN_INITIATED]",
           reply: broadcastMessage,
           status: 'replied',
           replied_at: new Date().toISOString()
         });
       });
       await Promise.all(promises);
       alert(`Broadcast sent to ${allProfiles.length} users!`);
       setBroadcastMessage("");
       setShowBroadcastModal(false);
       fetchMessages();
    } catch (e: any) {
      alert("Broadcast Error: " + e.message);
    } finally {
      setIsBroadcasting(false);
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
    { label: "Greeting", text: "Hello! Thank you for contacting our support." },
    { label: "Order", text: "I'm checking the status of your order now." },
    { label: "Done", text: "Is there anything else I can help you with?" }
  ];

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl relative">
      
      {/* ── Sidebar: Inbox List ── */}
      <div className={`w-full lg:w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 ${viewMode === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              Support
            </h2>
            <div className="flex gap-1">
               <button onClick={() => setShowBroadcastModal(true)} className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
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
              placeholder="Search inquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] focus:outline-none focus:border-primary-600/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sortedUserList.map((user) => {
            const msgs = groupedUsers.get(user) || [];
            const lastMsg = msgs[msgs.length - 1];
            if (!lastMsg) return null;
            const isUnread = msgs.some((m: any) => m.status === 'unread' && m.message !== '[ADMIN_INITIATED]');
            
            return (
              <button 
                key={user}
                onClick={() => { setSelectedUser(user); setViewMode("chat"); }}
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
      <div className={`flex-1 flex flex-col bg-white ${viewMode === 'list' ? 'hidden lg:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col bg-white z-10 shadow-sm gap-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setViewMode("list")} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900">
                       <ChevronLeft size={24} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 border border-slate-200">
                      <User size={20} />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-slate-900 truncate">{selectedUser}</h3>
                        <span className="text-[12px] text-[#E62E04] font-medium">ID:{selectedProfile?.id?.substring(0, 7) || '1493869'}</span>
                        <span className="text-[12px] text-slate-500 font-medium">Offline</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded hover:bg-slate-50 transition-colors"><Archive size={16} /></button>
                     <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#14b8a6] text-white text-[13px] font-bold rounded hover:bg-teal-600 shadow-sm transition-colors">Resolve</button>
                  </div>
              </div>
              <div className="flex gap-8">
                  <button onClick={() => setViewMode('chat')} className={`flex items-center gap-2 text-[14px] font-bold pb-2 ${viewMode === 'chat' ? 'text-[#E62E04] border-b-2 border-[#E62E04]' : 'text-slate-500 hover:text-slate-700'}`}>
                      <Clock size={16} /> Chat History
                  </button>
                  <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 text-[14px] font-bold pb-2 ${viewMode !== 'chat' ? 'text-[#E62E04] border-b-2 border-[#E62E04]' : 'text-slate-500 hover:text-slate-700'}`}>
                      <FileText size={16} /> Order History
                  </button>
              </div>
            </div>

            {/* Ticket Thread Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f0f2f5] custom-scrollbar">
               <div className="max-w-4xl mx-auto space-y-6 pb-10">
                  {viewMode === 'chat' && activeThread.map((msg: any) => {
                    const isAdmin = msg.message === '[ADMIN_INITIATED]';
                    const timeString = new Date(msg.replied_at || msg.created_at).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false }).replace(',', '');
                    
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                         <div className={`flex gap-3 max-w-[75%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                             {!isAdmin && (
                                 <div className="w-10 h-10 rounded-full bg-white shrink-0 flex items-center justify-center text-[#E62E04] shadow-sm border border-slate-200 mt-1">
                                    <User size={20} />
                                 </div>
                             )}
                             <div className="flex flex-col">
                                 <div className={`px-4 py-2.5 rounded-lg shadow-sm ${isAdmin ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{isAdmin ? msg.reply : msg.message}</p>
                                 </div>
                                 {!isAdmin && (
                                     <button className="text-[12px] text-slate-400 hover:text-slate-600 mt-1 text-left">show translation</button>
                                 )}
                                 <span className={`text-[12px] font-medium mt-1 ${isAdmin ? 'text-right text-[#86bc86]' : 'text-right text-[#a3d9a5]'}`}>
                                     {timeString}
                                 </span>
                             </div>
                         </div>
                      </div>
                    );
                  })}

                  {viewMode !== 'chat' && (
                      <div className="space-y-4">
                          {userOrders.map(order => (
                             <div key={order.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                 <div className="flex justify-between items-start mb-2">
                                     <h4 className="font-bold text-slate-900">{order.products?.title || 'Unknown Product'}</h4>
                                     <div className="font-bold text-[#E62E04] text-lg">${order.total_price} USD</div>
                                 </div>
                                 <div className="flex justify-between items-center text-[13px] text-slate-500">
                                     <div>Order number: <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.id.split('-')[0]}</span></div>
                                     <div>Payment time: {new Date(order.created_at).toLocaleString('en-CA')}</div>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-slate-100">
                                     <span className={`text-[12px] px-2.5 py-1 rounded font-bold uppercase ${order.status === 'Delivered' || order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                         {order.status}
                                     </span>
                                 </div>
                             </div>
                          ))}
                          {userOrders.length === 0 && <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-slate-200">No order history found for this user.</div>}
                      </div>
                  )}
                  <div ref={chatEndRef} />
               </div>
            </div>

            {/* Input Area */}
            {viewMode === 'chat' && (
                <div className="p-4 lg:p-6 bg-[#f0f2f5] border-t border-slate-200">
                  <form onSubmit={handleSendReply} className="relative max-w-4xl mx-auto flex gap-4">
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                      placeholder="Reply..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-[14px] shadow-sm focus:outline-none focus:border-teal-500 min-h-[50px] resize-none"
                    />
                    <button 
                        type="submit"
                        disabled={isReplying || !replyText.trim()}
                        className="w-[50px] h-[50px] bg-[#86bc86] text-white rounded-full flex items-center justify-center hover:bg-teal-600 shadow-md transition-colors disabled:opacity-50 shrink-0"
                    >
                        {isReplying ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="-ml-1" />}
                    </button>
                  </form>
                </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f0f2f5]">
            <div className="w-16 h-16 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-slate-400 mb-6 border border-slate-200">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Conversation</h3>
            <p className="text-slate-500 max-w-xs text-[14px]">Choose a user from the left sidebar to view their chat history or orders.</p>
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Intelligence ── */}
      {selectedUser && (
        <div className="hidden xl:flex w-[300px] bg-[#f9fafb] border-l border-slate-200 flex-col shrink-0">
           <div className="p-6">
              <h5 className="text-[12px] font-bold text-slate-500 mb-6 tracking-wide">INTELLIGENCE</h5>
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-xl">
                    {selectedUser[0].toUpperCase()}
                 </div>
                 <div>
                    <div className="text-[15px] font-bold text-slate-900">{selectedUser}</div>
                    <div className="text-[11px] text-[#10b981] font-bold uppercase tracking-wide mt-0.5">Verified Buyer</div>
                 </div>
              </div>
              
              <div className="space-y-4 text-[13px] border-t border-b border-slate-200 py-4 mb-6">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">REGISTRATION:</span>
                    <span className="text-slate-900 font-bold">{selectedProfile?.created_at ? new Date(selectedProfile.created_at).toLocaleDateString() : "4/25/2026"}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">PREMIUM STATUS:</span>
                    <span className={selectedProfile?.is_premium ? 'text-amber-500 font-bold' : 'text-slate-900 font-bold'}>{selectedProfile?.is_premium ? 'Yes' : 'No'}</span>
                 </div>
              </div>

              <div className="space-y-4">
                  <h5 className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">Transactions</h5>
                  <div className="bg-[#0f172a] rounded-xl p-5 text-white shadow-lg">
                      <div className="text-3xl font-black mb-1">${userOrders.reduce((s,o) => s+(Number(o.total_price)||0), 0).toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Cumulative Value</div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Broadcast Modal ── */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBroadcastModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="px-8 py-6 bg-primary-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <Zap size={24} />
                   <h3 className="text-xl font-black tracking-tight">Global Broadcast</h3>
                </div>
                <button onClick={() => setShowBroadcastModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 lg:p-8 space-y-6">
                <textarea 
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="Global message..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm min-h-[150px] resize-none"
                />
                <button 
                  disabled={isBroadcasting || !broadcastMessage.trim()}
                  onClick={handleBroadcast}
                  className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-600/20"
                >
                  {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : "Dispatch Message"}
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-4">Initialize Ticket</h3>
                <input type="text" placeholder="Search username..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {allProfiles.filter(p => p.username && p.username.toLowerCase().includes(userSearch.toLowerCase())).map(profile => (
                  <button key={profile.username} onClick={() => startNewChat(profile.username)} className="w-full flex items-center gap-4 p-4 hover:bg-primary-50 rounded-2xl transition-all">
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
