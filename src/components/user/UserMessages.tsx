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
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function UserMessages() {
  const username = localStorage.getItem("username") || "User";
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
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
        console.error("Fetch Error:", err.message);
    }
  }

  async function handleSendMessage(e?: React.FormEvent, text?: string) {
    if (e) e.preventDefault();
    const messageToSubmit = text || newMessage;
    if (!messageToSubmit.trim()) return;

    setIsSending(true);
    try {
        const { error } = await supabase.from('messages').insert({
            username: username,
            subject: "Support Thread",
            message: messageToSubmit,
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

  const suggestedQuestions = [
    "How to check my account details?",
    "Is my account warranty covered?",
    "How to upgrade to Premium Tier?"
  ];

  return (
    <div className="h-[calc(100vh-140px)] bg-slate-50 border border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col font-sans relative z-10 border-b-8 border-b-primary-600">
      
      {/* Premium Support Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-5">
              <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
                      <LifeBuoy size={28} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>
              <div>
                  <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Technical Support Matrix</h3>
                  <p className="text-[12px] text-emerald-600 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Engineers Online
                  </p>
              </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
              <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                  <Search size={20} />
              </button>
              <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                  <MoreVertical size={20} />
              </button>
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white/50 relative">
          
          <div className="flex justify-center mb-12">
              <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-xl shadow-slate-900/10 border border-white/10">
                  Secure Communication Protocol Initialized
              </div>
          </div>

          {loading && messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-center">
                  <Loader2 className="animate-spin text-primary-600 w-10 h-10 mb-4" />
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Synchronizing Identity Node...</p>
              </div>
          ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                 <div className="w-20 h-20 bg-primary-50 rounded-[2rem] flex items-center justify-center text-primary-600 mb-6 border border-primary-100">
                    <MessageSquare size={36} />
                 </div>
                 <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Ready to Assist</h4>
                 <p className="text-slate-500 max-w-xs mb-8 text-[14px] font-medium leading-relaxed">Send a message to our support engineers. We typically respond within minutes.</p>
                 
                 <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                    {suggestedQuestions.map(q => (
                       <button 
                        key={q}
                        onClick={() => handleSendMessage(undefined, q)}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-700 hover:border-primary-600 hover:text-primary-600 transition-all text-left flex items-center justify-between group"
                       >
                          {q}
                          <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                       </button>
                    ))}
                 </div>
              </div>
          ) : (
              messages.map((msg, idx) => {
                  const showUserMsg = msg.message !== '[ADMIN_INITIATED]';
                  const showAdminMsg = !!msg.reply;
                  
                  return (
                      <div key={msg.id} className="space-y-8">
                          {/* User Message Block */}
                          {showUserMsg && (
                              <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col items-end"
                              >
                                  <div className="max-w-[85%] md:max-w-[70%]">
                                      <div className="bg-slate-900 text-white p-5 rounded-[1.8rem] rounded-tr-sm shadow-xl shadow-slate-900/10">
                                          <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                      </div>
                                      <div className="mt-2 flex items-center justify-end gap-2 text-slate-400">
                                          <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          <CheckCheck size={14} className={msg.status === 'replied' ? "text-primary-600" : ""} />
                                      </div>
                                  </div>
                              </motion.div>
                          )}

                          {/* Agent Reply Block */}
                          {showAdminMsg && (
                              <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-4 items-start"
                              >
                                  <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shrink-0 mt-1">
                                      <LifeBuoy size={20} />
                                  </div>
                                  <div className="max-w-[85%] md:max-w-[70%]">
                                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Support Engineer</div>
                                      <div className="bg-white border border-slate-200 text-slate-700 p-5 rounded-[1.8rem] rounded-tl-sm shadow-sm">
                                          <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{msg.reply}</p>
                                          
                                          {/* Feedback interaction */}
                                          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                             <span className="text-[11px] font-bold text-slate-400 italic">Was this helpful?</span>
                                             <div className="flex gap-2">
                                                <button className="p-2 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 rounded-lg transition-all"><ThumbsUp size={14} /></button>
                                                <button className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-600 rounded-lg transition-all"><ThumbsDown size={14} /></button>
                                             </div>
                                          </div>
                                      </div>
                                      <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                          {new Date(msg.replied_at || msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </div>
                                  </div>
                              </motion.div>
                          )}
                      </div>
                  );
              })
          )}
          <div ref={chatEndRef} />
      </div>

      {/* Premium Input Area */}
      <div className="bg-white p-6 border-t border-slate-100 z-20">
          <form onSubmit={handleSendMessage} className="relative group">
              <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                      }
                  }}
                  placeholder="Describe your inquiry..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-6 pr-24 py-5 text-[15px] text-slate-900 focus:outline-none focus:border-primary-600 focus:bg-white focus:ring-4 focus:ring-primary-600/5 transition-all resize-none min-h-[80px]"
                  rows={2}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button type="button" className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors">
                     <Paperclip size={20} />
                  </button>
                  <button 
                      type="submit"
                      disabled={isSending || !newMessage.trim()}
                      className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20 active:scale-95"
                  >
                      {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                  </button>
              </div>
          </form>
          
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest px-2">
             <div className="flex items-center gap-2">
                <Zap size={12} className="text-amber-500" />
                Priority Support Node
             </div>
             <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Clock size={12} /> Live</span>
                <span className="flex items-center gap-1 italic opacity-60">Shift + Enter for new line</span>
             </div>
          </div>
      </div>

      {/* Floating Action Hint */}
      <AnimatePresence>
        {messages.length > 0 && !isSending && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 z-30"
          >
             <Info size={12} className="text-primary-500" />
             Average response time: 2 mins
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
