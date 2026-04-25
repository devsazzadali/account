import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  User,
  ShieldCheck,
  CheckCheck,
  Loader2,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  MessageSquare,
  Clock,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Info,
  LifeBuoy,
  Zap,
  ArrowRight,
  Star,
  Package,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function UserMessages() {
  const [username, setUsername] = useState<string>(localStorage.getItem("username") || "User");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [lastOrder, setLastOrder] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessionAndData();
    
    // Real-time Subscription
    const channel = supabase
      .channel('user_messages_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchSessionAndData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
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
        const { data, error } = await supabase
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
      const { data } = await supabase
        .from('orders')
        .select('*, products(title, image)')
        .eq('username', targetUser)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setLastOrder(data);
    } catch (e) { /* ignore */ }
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
        const { error } = await supabase.from('messages').insert({
            username: username,
            subject: "User Communication",
            message: newMessage,
            status: 'unread'
        });

        if (error) throw error;
        setNewMessage("");
        fetchMessages();
    } catch (err: any) {
        alert("Encryption Node Error: " + err.message);
    } finally {
        setIsSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden font-sans relative">
      
      {/* ── Left Sidebar: Inbox Navigation ── */}
      <div className="hidden lg:flex w-[340px] flex-col border-r border-slate-100 bg-white">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">Inbox</h3>
              <div className="w-2.5 h-2.5 rounded-full bg-[#1dbf73] animate-pulse shadow-lg shadow-emerald-500/50" />
           </div>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search threads..." 
                className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-[13px] font-bold focus:outline-none focus:border-[#1dbf73] transition-all"
              />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <button className="w-full p-6 flex items-center gap-5 bg-emerald-50 border border-emerald-100 rounded-[2rem] transition-all shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#1dbf73] flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 shrink-0">
                    <Headphones size={28} />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[15px] font-black text-slate-900">Support Agent</span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-emerald-100">Live</span>
                    </div>
                    <p className="text-[12px] text-slate-500 font-medium truncate">System protocols active. How can we assist?</p>
                </div>
            </button>
        </div>
      </div>

      {/* ── Center: Communication Interface ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Thread Header */}
        <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between z-10 bg-white shadow-sm">
           <div className="flex items-center gap-5">
              <div className="relative">
                 <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                    <User size={24} />
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-lg" />
              </div>
              <div>
                 <div className="text-[18px] font-black text-slate-900 flex items-center gap-3">
                    Support Intelligence Node
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-[9px] text-white font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-[#1dbf73] rounded-lg shadow-lg shadow-emerald-500/20">Verified</span>
                 </div>
                 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Tier: High Priority</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"><Info size={20} /></button>
              <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"><MoreVertical size={20} /></button>
           </div>
        </div>

        {/* Message Flow */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[#f8fafc]/50">
           <div className="flex justify-center mb-12">
              <div className="px-8 py-2.5 bg-white rounded-full border border-slate-200 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                 <ShieldCheck size={16} className="text-[#1dbf73]" />
                 Quantum Encryption: Protocol 7G Active
              </div>
           </div>

           {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                 <Loader2 className="animate-spin text-[#1dbf73] w-12 h-12 mb-6" />
                 <p className="text-[12px] text-slate-400 font-black uppercase tracking-widest">Decrypting Secure Thread...</p>
              </div>
           ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center opacity-40">
                  <MessageSquare size={64} className="text-slate-200 mb-6" />
                  <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Communication Channel Empty</p>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">Send a message to initialize the node.</p>
              </div>
           ) : (
              messages.map((msg) => {
                 const isAdmin = msg.message === '[ADMIN_INITIATED]';
                 return (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        key={msg.id} 
                        className="space-y-4"
                    >
                       {!isAdmin && (
                          <div className="flex justify-end">
                             <div className="max-w-[85%] md:max-w-[65%] bg-slate-900 text-white p-7 rounded-[2rem] rounded-tr-sm shadow-2xl shadow-slate-900/20">
                                <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                <div className="mt-4 flex items-center justify-end gap-3 text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                                   {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                   <CheckCheck size={16} className={msg.status === 'replied' ? "text-[#1dbf73]" : ""} />
                                </div>
                             </div>
                          </div>
                       )}
                       {isAdmin && (
                          <div className="flex gap-5 items-start">
                             <div className="w-12 h-12 rounded-2xl bg-[#1dbf73]/10 border border-[#1dbf73]/20 flex items-center justify-center shrink-0 shadow-sm">
                                <Zap size={22} className="text-[#1dbf73]" />
                             </div>
                             <div className="max-w-[85%] md:max-w-[65%]">
                                <div className="bg-white border border-slate-200 p-7 rounded-[2.5rem] rounded-tl-sm shadow-xl shadow-slate-200/50">
                                   <p className="text-[15px] text-slate-800 font-bold leading-relaxed whitespace-pre-wrap">{msg.reply}</p>
                                   <div className="mt-5 pt-5 border-t border-slate-50 flex items-center justify-between">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(msg.replied_at || msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                      <div className="flex gap-3">
                                         <button className="p-2 hover:bg-slate-50 text-slate-300 hover:text-[#1dbf73] rounded-xl transition-all"><ThumbsUp size={16} /></button>
                                         <button className="p-2 hover:bg-slate-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"><ThumbsDown size={16} /></button>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       )}
                    </motion.div>
                 )
              })
           )}
           <div ref={chatEndRef} />
        </div>

        {/* Action Node */}
        <div className="p-10 bg-white border-t border-slate-100 relative">
           <form onSubmit={handleSendMessage} className="relative group">
              <div className="absolute left-6 top-6 text-slate-300 group-focus-within:text-[#1dbf73] transition-colors">
                 <Smile size={24} className="cursor-pointer" />
              </div>
              <textarea 
                 value={newMessage}
                 onChange={e => setNewMessage(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                 placeholder="Transmit communication data..."
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] pl-16 pr-32 py-6 text-[15px] font-bold text-slate-900 focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all resize-none min-h-[100px] shadow-inner"
              />
              <div className="absolute right-6 bottom-6 flex items-center gap-4">
                 <Paperclip size={24} className="text-slate-300 cursor-pointer hover:text-slate-900 transition-colors" />
                 <button 
                  disabled={isSending || !newMessage.trim()}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all disabled:opacity-50 shadow-2xl shadow-slate-900/30 active:scale-95 flex items-center gap-3"
                 >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <>Send <Send size={18} className="text-[#1dbf73]" /></>}
                 </button>
              </div>
           </form>
           <div className="mt-6 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">
              <div className="flex items-center gap-3">
                 <Zap size={14} className="text-amber-500" />
                 Encrypted Link Authorized
              </div>
              <p>Shift + Enter for new line</p>
           </div>
        </div>
      </div>

      {/* ── Right Sidebar: Tactical Context ── */}
      <div className="hidden xl:flex w-[320px] flex-col bg-slate-50/30 border-l border-slate-100 overflow-y-auto">
         <div className="p-10 border-b border-slate-100">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                <Clock size={14} className="text-[#1dbf73]" /> Order Intelligence
            </h4>
            {lastOrder ? (
              <div className="space-y-8">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-200 overflow-hidden shrink-0 shadow-lg p-1">
                       <img src={lastOrder.products?.image} alt="" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="min-w-0">
                       <div className="text-[15px] font-black text-slate-900 truncate tracking-tight">{lastOrder.products?.title}</div>
                       <div className="text-[12px] font-black text-[#1dbf73] mt-1">${lastOrder.total_price}</div>
                    </div>
                 </div>
                 <div className="p-6 bg-white rounded-[2rem] border border-slate-100 space-y-5 shadow-sm">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                       <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">{lastOrder.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hash</span>
                       <span className="text-[10px] font-bold text-slate-900 font-mono">#{lastOrder.id.split('-')[0].toUpperCase()}</span>
                    </div>
                 </div>
                 <button className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20">
                    <Package size={18} /> Asset Ledger
                 </button>
              </div>
            ) : (
              <div className="text-center py-16 opacity-30">
                 <ShieldAlert size={56} className="mx-auto mb-6 text-slate-200" />
                 <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Context Null</p>
              </div>
            )}
         </div>

         <div className="p-10">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                <HelpCircle size={14} className="text-[#1dbf73]" /> Support FAQ
            </h4>
            <div className="space-y-6">
                {[
                    { q: "How to claim assets?", a: "Go to procurement history." },
                    { q: "2FA protocols?", a: "Ask in secure thread." },
                    { q: "Refund policy?", a: "Check service grid terms." }
                ].map((faq, i) => (
                    <div key={i} className="group cursor-pointer">
                        <div className="text-[13px] font-black text-slate-900 flex items-center justify-between group-hover:text-[#1dbf73] transition-colors">
                            {faq.q} <ChevronRight size={14} />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

    </div>
  );
}
