import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  Search, User, Send, CheckCheck, Loader2, MoreVertical, Paperclip, 
  ShieldCheck, CheckCircle2, MessageSquare, RefreshCw, Clock, 
  Info, ExternalLink, Filter, ChevronRight, Mail, Phone,
  AlertCircle, Archive, CheckCircle, Radio, Send as SendIcon,
  Users, UserPlus, Zap, ChevronLeft, FileText, X, List, Image as ImageIcon
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
      .filter(u => u && (u as string).toLowerCase().includes(searchQuery.toLowerCase()))
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
    <div className="flex h-[calc(100vh-64px)] bg-[#f0f2f5] overflow-hidden relative">
      
      {/* ── Sidebar: Inbox List ── */}
      <div className={`w-full lg:w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 ${viewMode === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E62E04] animate-pulse" />
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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] focus:outline-none focus:border-[#E62E04]/30"
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
                  selectedUser === user ? "bg-red-50/50" : "hover:bg-slate-50"
                }`}
              >
                {selectedUser === user && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E62E04]" />}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[14px] ${isUnread ? 'bg-[#E62E04] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {user[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`text-[13px] truncate uppercase tracking-tight ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{user}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lastMsg.created_at ? new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate leading-tight">
                    {lastMsg.message === '[ADMIN_INITIATED]' ? `You: ${lastMsg.reply}` : lastMsg.message}
                  </div>
                </div>
                {isUnread && <div className="w-2 h-2 bg-[#E62E04] rounded-full mt-2 animate-pulse" />}
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
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                      <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=trenchkidfr" alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-bold text-slate-900 truncate uppercase">{selectedUser}</h3>
                        <span className="text-[13px] text-[#E62E04] font-medium tracking-tight">ID:{selectedProfile?.id?.substring(0, 7) || '1493869'}</span>
                        <span className="text-[13px] text-slate-500 font-medium">Offline</span>
                      </div>
                    </div>
                  </div>
              </div>
              <div className="flex gap-6">
                  <button onClick={() => setViewMode('chat')} className={`flex items-center gap-2 text-[13px] font-bold pb-2 transition-all ${viewMode === 'chat' ? 'text-slate-900 border-b-2 border-[#E62E04]' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Clock size={16} /> Chat History
                  </button>
                  <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 text-[13px] font-bold pb-2 transition-all ${viewMode !== 'chat' ? 'text-slate-900 border-b-2 border-[#E62E04]' : 'text-slate-400 hover:text-slate-600'}`}>
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
                                 <div className="w-10 h-10 rounded-xl bg-white shrink-0 overflow-hidden shadow-sm border border-slate-200 mt-1">
                                    <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=trenchkidfr" alt="avatar" className="w-full h-full object-cover" />
                                 </div>
                             )}
                             <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                 <div className={`px-4 py-2 rounded-lg shadow-sm relative ${isAdmin ? 'bg-[#dcf8c6] text-slate-800' : 'bg-white border border-slate-200 text-slate-800'}`}>
                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{isAdmin ? msg.reply : msg.message}</p>
                                    {!isAdmin && (
                                      <button className="text-[12px] text-slate-400 hover:text-slate-600 mt-1 block">show translation</button>
                                    )}
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
                             <div key={order.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                 <div className="flex justify-between items-start mb-2">
                                     <h4 className="font-bold text-slate-900 uppercase tracking-tight">{order.products?.title || 'Unknown Product'}</h4>
                                 </div>
                                 <div className="flex justify-between items-center text-[13px] text-slate-500">
                                     <div>Order ID: <span className="bg-slate-50 px-2 py-0.5 rounded text-slate-700 font-mono">{order.id.split('-')[0].toUpperCase()}</span></div>
                                     <div>Time: {new Date(order.created_at).toLocaleString('en-CA')}</div>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                     <span className={`text-[11px] px-2.5 py-1 rounded font-black uppercase tracking-widest ${order.status === 'Delivered' || order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
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
                        <input type="file" multiple className="hidden" accept="image/*" onChange={() => alert('Photo upload feature coming soon!')} />
                        <span className="absolute -top-10 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest pointer-events-none">Photo</span>
                    </label>
                    <label className="w-[50px] h-[50px] bg-white border border-slate-200 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 shadow-sm transition-all shrink-0 cursor-pointer group relative">
                        <Paperclip size={20} className="group-hover:text-emerald-500 transition-colors" />
                        <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={() => alert('Document upload feature coming soon!')} />
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
                 <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#E62E04] font-black text-2xl shadow-sm">
                    {selectedUser[0].toUpperCase()}
                 </div>
                 <div>
                    <div className="text-[16px] font-black text-slate-900 uppercase tracking-tight">{selectedUser}</div>
                    <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Verified Buyer</div>
                 </div>
              </div>
              
              <div className="space-y-4 text-[12px] bg-slate-50 rounded-xl p-4 border border-slate-100 mb-8">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Registered</span>
                    <span className="text-slate-900 font-black">{selectedProfile?.created_at ? new Date(selectedProfile.created_at).toLocaleDateString() : "4/25/2026"}</span>
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
                          <div key={order.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:border-[#E62E04]/20 transition-all cursor-pointer group">
                              <div className="flex justify-between items-start mb-1.5">
                                  <div className="text-[12px] font-black text-slate-800 truncate pr-2 uppercase tracking-tight">{order.products?.title || 'Asset'}</div>
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                  <span>{order.status}</span>
                                  <span className="font-mono">#{order.id.split('-')[0].substring(0, 4)}</span>
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
