import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, X, Send, User, LifeBuoy, 
  Loader2, Smile, Paperclip, ChevronDown, ExternalLink,
  ShieldCheck, Zap, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function LiveSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const username = localStorage.getItem("username") || "Guest";
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    } catch (e) { console.error(e); }
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await supabase.from('messages').insert({
        username: username,
        subject: "Live Chat Inquiry",
        message: newMessage,
        status: 'unread'
      });
      setNewMessage("");
      fetchMessages();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[2000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[380px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Widget Header */}
            <div className="bg-slate-900 px-6 py-6 text-white shrink-0">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1dbf73] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                       <LifeBuoy size={22} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                          Support Core
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                       </h3>
                       <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Active Response Node</p>
                    </div>
                 </div>
                 <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 flex items-center justify-between border border-white/5">
                 <div className="flex items-center gap-2">
                    <Star size={12} className="text-[#ffb33e] fill-[#ffb33e]" />
                    <span className="text-[11px] font-bold">Trusted by 50k+ users</span>
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-[#1dbf73]">v2.4 Live</div>
              </div>
            </div>

            {/* Chat Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
               <div className="text-center py-4 opacity-30">
                  <ShieldCheck size={32} className="mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Encrypted Direct Link</p>
               </div>

               {messages.map((msg) => {
                 const isAdmin = msg.message === '[ADMIN_INITIATED]';
                 return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                       <div className={`max-w-[85%] p-4 rounded-2xl text-[14px] ${
                         isAdmin 
                         ? 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm' 
                         : 'bg-[#1dbf73] text-white shadow-lg shadow-emerald-500/10 rounded-tr-sm'
                       }`}>
                          <p className="leading-relaxed font-medium">{isAdmin ? msg.reply : msg.message}</p>
                          <div className={`mt-2 text-[9px] font-bold uppercase tracking-widest ${isAdmin ? 'text-slate-400' : 'text-white/60'}`}>
                             {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </div>
                       </div>
                    </div>
                 )
               })}
               <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-slate-100 bg-white shrink-0">
               <form onSubmit={handleSendMessage} className="relative">
                  <input 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Ask us anything..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-[14px] focus:outline-none focus:border-[#1dbf73] transition-all"
                  />
                  <button 
                    disabled={isSending || !newMessage.trim()}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-[#1dbf73] text-white rounded-xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all disabled:opacity-50"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
               </form>
               <div className="mt-3 flex items-center justify-center gap-4 opacity-30">
                  <div className="flex items-center gap-1.5"><Zap size={12} /><span className="text-[9px] font-bold uppercase">Instant</span></div>
                  <div className="flex items-center gap-1.5"><ShieldCheck size={12} /><span className="text-[9px] font-bold uppercase">Secure</span></div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#1dbf73] text-white rounded-[2rem] flex items-center justify-center shadow-[0_10px_40px_rgba(29,191,115,0.4)] relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <AnimatePresence mode="wait">
           {isOpen ? <ChevronDown key="close" size={28} /> : <MessageSquare key="open" size={28} />}
        </AnimatePresence>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
      </motion.button>
    </div>
  );
}
