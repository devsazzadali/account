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
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function UserMessages() {
  const username = localStorage.getItem("username") || "User";
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [lastOrder, setLastOrder] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchLastOrder();
    const interval = setInterval(() => {
        fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages(data || []);
        setLoading(false);
    } catch (err: any) {
        console.error("Inquiry Fetch Error:", err.message);
    }
  }

  async function fetchLastOrder() {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('username', username)
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
            subject: "Active Inquiry",
            message: newMessage,
            status: 'unread'
        });

        if (error) throw error;
        setNewMessage("");
        fetchMessages();
    } catch (err: any) {
        alert("Transmission Node Error: " + err.message);
    } finally {
        setIsSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden font-sans relative">
      
      {/* ── Left Sidebar: Inbox (Fiverr Style) ── */}
      <div className="hidden lg:flex w-[320px] flex-col border-r border-slate-100 bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-xl font-black text-slate-900 tracking-tight">Messages</h3>
           <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <Search size={20} />
           </button>
        </div>
        <div className="flex-1 overflow-y-auto">
           <div className="p-2">
              <button className="w-full p-4 flex items-center gap-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 group transition-all">
                 <div className="w-12 h-12 rounded-xl bg-[#1dbf73] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                    <LifeBuoy size={24} />
                 </div>
                 <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                       <span className="text-[14px] font-black text-slate-900 truncate">Support Agent</span>
                       <span className="text-[10px] text-emerald-600 font-bold">Online</span>
                    </div>
                    <p className="text-[12px] text-slate-500 truncate font-medium">How can we assist you today?</p>
                 </div>
              </button>
           </div>
        </div>
      </div>

      {/* ── Center: Chat Interface ── */}
      <div className="flex-1 flex flex-col bg-[#f7f7f7]">
        {/* Chat Header */}
        <div className="px-8 py-5 bg-white border-b border-slate-100 flex items-center justify-between z-10">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white absolute translate-x-3 translate-y-3" />
                 <User size={20} className="text-slate-400" />
              </div>
              <div>
                 <div className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                    Official Support
                    <Star size={12} className="text-[#ffb33e] fill-[#ffb33e]" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded">PRO</span>
                 </div>
                 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Average response time: 1 hour</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
                 <Clock size={16} /> History
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-900"><MoreVertical size={20} /></button>
           </div>
        </div>

        {/* Messages Flow */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
           <div className="flex justify-center mb-10">
              <div className="px-6 py-2 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck size={14} className="text-emerald-500" />
                 Encrypted Identity Node: Active
              </div>
           </div>

           {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                 <Loader2 className="animate-spin text-[#1dbf73] w-10 h-10 mb-4" />
                 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Decrypting Thread...</p>
              </div>
           ) : (
              messages.map((msg) => {
                 const isAdmin = msg.message === '[ADMIN_INITIATED]';
                 return (
                    <div key={msg.id} className="space-y-4">
                       {!isAdmin && (
                          <div className="flex justify-end">
                             <div className="max-w-[85%] md:max-w-[70%] bg-slate-50 border border-slate-200 p-5 rounded-2xl rounded-tr-sm">
                                <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                <div className="mt-3 flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                   {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                   <CheckCheck size={14} className={msg.status === 'replied' ? "text-emerald-500" : ""} />
                                </div>
                             </div>
                          </div>
                       )}
                       {isAdmin && (
                          <div className="flex gap-4 items-start">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                <User size={20} className="text-slate-400" />
                             </div>
                             <div className="max-w-[85%] md:max-w-[70%]">
                                <div className="bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-sm shadow-sm">
                                   <p className="text-[14px] text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">{msg.reply}</p>
                                   <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(msg.replied_at || msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                      <div className="flex gap-2">
                                         <button className="p-1.5 hover:bg-slate-50 text-slate-300 hover:text-emerald-500 rounded transition-all"><ThumbsUp size={14} /></button>
                                         <button className="p-1.5 hover:bg-slate-50 text-slate-300 hover:text-red-500 rounded transition-all"><ThumbsDown size={14} /></button>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                 )
              })
           )}
           <div ref={chatEndRef} />
        </div>

        {/* Action Area */}
        <div className="p-6 bg-white border-t border-slate-100">
           <form onSubmit={handleSendMessage} className="relative">
              <div className="absolute left-4 top-4 text-slate-400">
                 <Smile size={20} className="cursor-pointer hover:text-slate-900 transition-colors" />
              </div>
              <textarea 
                 value={newMessage}
                 onChange={e => setNewMessage(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                 placeholder="Type your message..."
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-24 py-4 text-[15px] focus:outline-none focus:border-[#1dbf73] focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none min-h-[100px]"
              />
              <div className="absolute right-4 bottom-4 flex items-center gap-3">
                 <Paperclip size={20} className="text-slate-400 cursor-pointer hover:text-slate-900 transition-colors" />
                 <button 
                  disabled={isSending || !newMessage.trim()}
                  className="px-6 py-2.5 bg-[#1dbf73] text-white rounded-xl text-[14px] font-black hover:bg-[#19a463] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
                 >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : "Send"}
                 </button>
              </div>
           </form>
           <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              <div className="flex items-center gap-1.5">
                 <Zap size={12} className="text-amber-500" />
                 Official Communication Node
              </div>
              <p>Press Enter to send</p>
           </div>
        </div>
      </div>

      {/* ── Right Sidebar: Context (Fiverr Style) ── */}
      <div className="hidden xl:flex w-[300px] flex-col bg-white border-l border-slate-100 overflow-y-auto">
         <div className="p-8 border-b border-slate-100">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Order Context</h4>
            {lastOrder ? (
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                       <img src={lastOrder.products?.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                       <div className="text-[14px] font-black text-slate-900 truncate">{lastOrder.products?.title}</div>
                       <div className="text-[11px] font-bold text-primary-600">${lastOrder.total_price}</div>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                       <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase tracking-widest border border-amber-100">{lastOrder.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node ID</span>
                       <span className="text-[10px] font-bold text-slate-900">#{lastOrder.id.split('-')[0].toUpperCase()}</span>
                    </div>
                 </div>
                 <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10">
                    <Package size={16} /> View Order Details
                 </button>
              </div>
            ) : (
              <div className="text-center py-10 opacity-30">
                 <ShieldAlert size={48} className="mx-auto mb-4" />
                 <p className="text-[11px] font-bold uppercase tracking-widest">No active orders</p>
              </div>
            )}
         </div>

         <div className="p-8">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Support Metrics</h4>
            <div className="space-y-4">
               <Metric icon={<CheckCircle2 size={16} className="text-emerald-500" />} label="Verification" value="Established" />
               <Metric icon={<Zap size={16} className="text-amber-500" />} label="Priority" value="Standard" />
               <Metric icon={<Clock size={16} className="text-blue-500" />} label="Uptime" value="99.9%" />
            </div>
         </div>
      </div>

    </div>
  );
}

function Metric({ icon, label, value }: any) {
   return (
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            {icon} {label}
         </div>
         <span className="text-[11px] font-black text-slate-900">{value}</span>
      </div>
   );
}
