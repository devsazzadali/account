import React, { useEffect, useState, useRef } from "react";
import { 
  Search, 
  User, 
  Send, 
  CheckCheck, 
  Loader2,
  MoreVertical,
  Paperclip,
  Smile,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
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
    
    // Check for user pre-selection from Orders
    const preSelected = localStorage.getItem("selectedUserChat");
    if (preSelected) {
      setSelectedUser(preSelected);
      localStorage.removeItem("selectedUserChat");
    }

    // Set up Realtime listener
    const channel = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
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
            subject: "Direct Chat",
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

  const groupedUsers = React.useMemo(() => {
      const map = new Map<string, any[]>();
      messages.forEach(msg => {
          if (!map.has(msg.username)) map.set(msg.username, []);
          map.get(msg.username)!.push(msg);
      });
      return map;
  }, [messages]);

  const sortedUserList = Array.from(groupedUsers.keys())
      .filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
          const lastMsgA = groupedUsers.get(a)!.slice(-1)[0];
          const lastMsgB = groupedUsers.get(b)!.slice(-1)[0];
          return new Date(lastMsgB.created_at).getTime() - new Date(lastMsgA.created_at).getTime();
      });

  const activeThread = selectedUser ? groupedUsers.get(selectedUser) || [] : [];
  const selectedProfile = allProfiles.find(p => p.username === selectedUser);

  const quickReplies = [
    "Hello! How can I help you today?",
    "Your order is currently being processed.",
    "The credentials have been sent. Please check your order details.",
    "Thank you for your purchase!",
    "Is there anything else you need assistance with?"
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl font-sans">
      
      {/* Sidebar: Chat List */}
      <div className="w-[350px] border-r border-slate-100 flex flex-col bg-white shrink-0">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight">Inbox</h2>
            <button onClick={() => setShowNewChatModal(true)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-600">
              <MessageSquare size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-[13px] focus:ring-2 focus:ring-primary-600/10 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sortedUserList.map((user) => {
            const msgs = groupedUsers.get(user)!;
            const lastMsg = msgs[msgs.length - 1];
            const unread = msgs.some((m: any) => m.status === 'unread' && m.message !== '[ADMIN_INITIATED]');
            
            return (
              <button 
                key={user}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 flex items-center gap-4 transition-all relative ${
                  selectedUser === user ? "bg-slate-50" : "hover:bg-slate-50/50"
                }`}
              >
                {selectedUser === user && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />}
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 relative">
                  <User size={24} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[14px] font-bold text-slate-900 truncate">{user}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-[12px] text-slate-500 truncate pr-4">
                    {lastMsg.message === '[ADMIN_INITIATED]' ? `Me: ${lastMsg.reply}` : lastMsg.message}
                  </div>
                </div>
                {unread && <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className="flex-1 flex flex-col bg-[#f9fbfd]">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">{selectedUser}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="p-2 text-slate-400 hover:text-slate-600"><Search size={18} /></button>
                 <button className="p-2 text-slate-400 hover:text-slate-600"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {activeThread.map((msg: any) => {
                const isUser = msg.message !== '[ADMIN_INITIATED]';
                return (
                  <div key={msg.id} className={`flex ${!isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group`}>
                      <div className={`p-4 rounded-3xl shadow-sm ${
                        !isUser 
                          ? "bg-primary-600 text-white rounded-tr-none" 
                          : "bg-white text-slate-900 border border-slate-100 rounded-tl-none"
                      }`}>
                        {isUser && msg.subject !== "Direct Chat" && (
                          <div className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1">{msg.subject}</div>
                        )}
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{isUser ? msg.message : msg.reply}</p>
                      </div>
                      <div className={`mt-1.5 flex items-center gap-2 text-[10px] text-slate-400 px-2 ${!isUser ? 'justify-end' : 'justify-start'}`}>
                        {new Date(msg.replied_at || msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        {!isUser && <CheckCheck size={12} className="text-primary-600" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
              {quickReplies.map((qr, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendReply(undefined, qr)}
                  className="whitespace-nowrap px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[12px] text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleSendReply} className="flex items-center gap-4">
                <button type="button" className="p-2 text-slate-400 hover:text-slate-600"><Paperclip size={20} /></button>
                <div className="flex-1 relative">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                    placeholder="Type your message here..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[14px] focus:ring-2 focus:ring-primary-600/10 outline-none resize-none transition-all"
                    rows={1}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isReplying || !replyText.trim()}
                  className="w-11 h-11 bg-primary-600 text-white rounded-2xl flex items-center justify-center hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50"
                >
                  {isReplying ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 rounded-3xl bg-primary-50 flex items-center justify-center text-primary-600 mb-6">
              <MessageSquare size={48} />
            </div>
            <h3 className="text-2xl font-display font-black text-slate-900 mb-2">Your Conversations</h3>
            <p className="text-slate-500 max-w-sm">Select a contact from the left to start messaging. Your communication is secure and monitored.</p>
          </div>
        )}
      </div>

      {/* Right Sidebar: User Context (Fiverr-like) */}
      {selectedUser && (
        <div className="w-[300px] border-l border-slate-100 bg-white flex flex-col shrink-0">
          <div className="p-6 text-center border-b border-slate-50">
             <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-400 mb-4 shadow-sm relative">
                <User size={40} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white" />
             </div>
             <h4 className="font-black text-slate-900 text-[16px]">{selectedUser}</h4>
             <p className="text-[12px] text-slate-400 mb-4">{selectedProfile?.full_name || "Premium Member"}</p>
             <button className="w-full py-2.5 bg-slate-900 text-white text-[12px] font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">View Profile</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
             <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Current Orders</h5>
             <div className="space-y-3">
               {userOrders.length === 0 ? (
                 <div className="text-[12px] text-slate-400 bg-slate-50 p-4 rounded-2xl text-center border border-dashed border-slate-200">No active orders</div>
               ) : userOrders.map(order => (
                 <div key={order.id} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary-600/30 transition-all cursor-default">
                    <div className="text-[11px] font-bold text-slate-900 truncate mb-1">{order.products?.title}</div>
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="text-primary-600 font-black">${order.total_price}</span>
                       <span className="text-slate-400">#{order.id.split('-')[0].toUpperCase()}</span>
                    </div>
                 </div>
               ))}
             </div>

             <div className="mt-8">
               <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quick Stats</h5>
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                     <div className="text-[14px] font-black text-slate-900">{userOrders.length}</div>
                     <div className="text-[9px] font-bold text-slate-400 uppercase">Orders</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                     <div className="text-[14px] font-black text-slate-900">${userOrders.reduce((s,o) => s+Number(o.total_price), 0)}</div>
                     <div className="text-[9px] font-bold text-slate-400 uppercase">Total</div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewChatModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-display font-black text-slate-900">Start New Chat</h3>
                <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm outline-none" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {allProfiles.filter(p => p.username.toLowerCase().includes(userSearch.toLowerCase())).map(profile => (
                  <button key={profile.username} onClick={() => startNewChat(profile.username)} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all text-left">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold">{profile.username[0].toUpperCase()}</div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-900">{profile.username}</div>
                      <div className="text-[11px] text-slate-400">{profile.full_name || "Member"}</div>
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
