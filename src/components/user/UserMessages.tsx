import React, { useState, useEffect } from "react";
import { 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Loader2,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function UserMessages() {
  const username = localStorage.getItem("username") || "User";
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    subject: "",
    message: ""
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        setMessages(data || []);
    } catch (err: any) {
        console.error("Fetch Messages Error:", err.message);
    } finally {
        setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setIsSending(true);
    try {
        const { error } = await supabase.from('messages').insert({
            username: username,
            subject: formData.subject || "General Inquiry",
            message: formData.message,
            status: 'unread'
        });

        if (error) throw error;

        setShowSuccess(true);
        setFormData({ subject: "", message: "" });
        fetchMessages();
        setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
        alert("Transmission Error: " + err.message);
    } finally {
        setIsSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Message Composer */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
        
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl border border-primary-100 shadow-sm">
                <MessageSquare size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 italic font-display">Command Support</h3>
                <p className="text-xs text-slate-500 font-medium">Initialize an encrypted transmission to administration.</p>
            </div>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Transmission Subject</label>
                <input 
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="e.g. Account Verification Issue"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-300"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                <textarea 
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Provide detailed information regarding your request..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-300 resize-none"
                ></textarea>
            </div>

            <button 
                type="submit"
                disabled={isSending}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 group disabled:opacity-50"
            >
                {isSending ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <>
                        Execute Transmission
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                )}
            </button>
        </form>

        <AnimatePresence>
            {showSuccess && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700"
                >
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-bold uppercase tracking-tight">Transmission Secured. Awaiting Admin Review.</span>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      {/* Message History */}
      <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary-600" />
                  Signal History
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{messages.length} Records</span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-slate-100 border-dashed">
                      <Loader2 className="animate-spin text-slate-300 mb-4" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning Frequencies...</span>
                  </div>
              ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 border-dashed rounded-[2.5rem]">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                          <HelpCircle size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-400 italic">No transmissions found in your log.</p>
                  </div>
              ) : messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                      {msg.status === 'replied' && (
                          <div className="absolute top-0 right-0 px-3 py-1 bg-primary-500 text-white text-[8px] font-bold uppercase tracking-[0.2em] rounded-bl-xl">
                              Response Received
                          </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{msg.subject}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-2">
                                  <Clock size={10} />
                                  {new Date(msg.created_at).toLocaleString()}
                              </div>
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tight ${
                              msg.status === 'replied' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                              {msg.status}
                          </div>
                      </div>
                      
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                          {msg.message}
                      </p>

                      {msg.reply && (
                          <div className="flex gap-4 items-start bg-primary-50/50 p-4 rounded-2xl border border-primary-100/50">
                              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0 shadow-sm">
                                  <ShieldCheck size={14} className="text-white" />
                              </div>
                              <div>
                                  <div className="text-[9px] font-bold text-primary-600 uppercase tracking-widest mb-1">Admin Response</div>
                                  <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                                      {msg.reply}
                                  </p>
                                  <div className="text-[8px] text-primary-400 font-bold mt-2">
                                      {msg.replied_at ? new Date(msg.replied_at).toLocaleString() : 'Just now'}
                                  </div>
                              </div>
                          </div>
                      )}
                  </motion.div>
              ))}
          </div>
      </div>
    </div>
  );
}
