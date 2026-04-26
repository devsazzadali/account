import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, X, Send, User, LifeBuoy, 
  Loader2, Smile, Paperclip, ChevronDown, ExternalLink,
  ShieldCheck, Zap, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

export function LiveSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const username = localStorage.getItem("username") || "Guest";
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      
      // Upgrade to REAL-TIME Subscriptions (No more polling!)
      const channel = supabase
        .channel('live-support')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `username=eq.${username}` }, 
          (payload) => {
            setMessages(prev => [...prev, payload.new]);
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `username=eq.${username}` },
          (payload) => {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, username]);

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
      const { error } = await supabase.from('messages').insert({
        username: username,
        subject: "Live Chat Inquiry",
        message: newMessage,
        status: 'unread'
      });
      if (error) throw error;
      setNewMessage("");
      // Local update is handled by the subscription above!
    } catch (err: any) {
      console.error("Transmission Error:", err.message);
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
            className="mb-4 w-[380px] h-[550px] bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Widget Header */}
            <div className="bg-slate-900 px-6 py-8 text-white shrink-0 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#1dbf73]/10 blur-[50px] rounded-full -mr-16 -mt-16" />
               <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-[1.5rem] bg-[#1dbf73] flex items-center justify-center shadow-xl shadow-emerald-500/20">
                        <LifeBuoy size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black tracking-tight italic flex items-center gap-2">
                           Support Hub
                           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        </h3>
                        <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">Quantum Link Established</p>
                     </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={20} /></button>
               </div>
               <div className="bg-white/5 rounded-2xl p-3 flex items-center justify-between border border-white/5 relative z-10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                     <ShieldCheck size={14} className="text-[#1dbf73]" />
                     <span>Tier-1 Encrypted Link</span>
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Status: Active</div>
               </div>
            </div>

            {/* Chat Flow */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#FDFDFD]">
               <div className="text-center py-6 opacity-10">
                  <Zap size={40} className="mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Direct Response Protocol</p>
               </div>

               {messages.length === 0 && (
                   <div className="text-center py-10">
                       <p className="text-[12px] font-bold text-slate-400">Initialize transmission to speak with an agent.</p>
                   </div>
               )}

               {messages.map((msg) => {
                 const isAdmin = msg.message === '[ADMIN_INITIATED]';
                 return (
                    <motion.div 
                        initial={{ opacity: 0, x: isAdmin ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={msg.id} 
                        className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                       <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-[14px] shadow-sm ${
                         isAdmin 
                         ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm' 
                         : 'bg-[#1dbf73] text-white shadow-lg shadow-emerald-500/10 rounded-tr-sm'
                       }`}>
                          <p className="leading-relaxed font-bold tracking-tight">{isAdmin ? msg.reply : msg.message}</p>
                          <div className={`mt-3 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isAdmin ? 'text-slate-300' : 'text-white/40'}`}>
                             {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                             <div className={`w-1 h-1 rounded-full ${isAdmin ? 'bg-slate-200' : 'bg-white/20'}`} />
                             {isAdmin ? 'System Agent' : 'You'}
                          </div>
                       </div>
                    </motion.div>
                 )
               })}
               <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-100 bg-white shrink-0">
               <form onSubmit={handleSendMessage} className="relative group">
                  <input 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Describe your inquiry..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-16 py-4.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all shadow-inner"
                  />
                  <button 
                    disabled={isSending || !newMessage.trim()}
                    className="absolute right-2 top-2 bottom-2 px-5 bg-slate-900 text-[#1dbf73] rounded-xl shadow-xl active:scale-90 transition-all disabled:opacity-50"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
               </form>
               <div className="mt-4 flex items-center justify-center gap-6 opacity-30">
                  <div className="flex items-center gap-2"><Zap size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Instant</span></div>
                  <div className="flex items-center gap-2"><Star size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Premium</span></div>
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
        className="w-18 h-18 bg-slate-900 text-[#1dbf73] rounded-[2.2rem] flex items-center justify-center shadow-2xl relative group overflow-hidden border border-white/5"
      >
        <div className="absolute inset-0 bg-[#1dbf73]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <AnimatePresence mode="wait">
           {isOpen ? <ChevronDown key="close" size={32} /> : <MessageSquare key="open" size={32} />}
        </AnimatePresence>
        {/* Active Notification Indicator */}
        <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-slate-900 rounded-full shadow-lg" />
      </motion.button>
    </div>
  );
}
