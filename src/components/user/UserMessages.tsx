import React, { useState, useEffect } from "react";
import { 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Loader2,
  User,
  Mail,
  ArrowRight,
  MessageCircle
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
        alert("Submission Error: " + err.message);
    } finally {
        setIsSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Support Composer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#e4e5e7] rounded-sm p-8 shadow-sm"
      >
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#1dbf73]/10 text-[#1dbf73] rounded-full">
                <MessageCircle size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-[#404145]">Support Center</h3>
                <p className="text-sm text-[#62646a] font-medium">Need help? Send us an inquiry and our team will get back to you.</p>
            </div>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#404145]">Inquiry Subject</label>
                <input 
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="What can we help you with?"
                    className="w-full bg-[#f7f7f7] border border-[#e4e5e7] rounded px-4 py-3 text-[14px] font-medium text-[#404145] focus:outline-none focus:border-[#1dbf73] transition-all"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#404145]">Your Message</label>
                <textarea 
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Describe your issue in detail..."
                    className="w-full bg-[#f7f7f7] border border-[#e4e5e7] rounded px-4 py-4 text-[14px] font-medium text-[#404145] focus:outline-none focus:border-[#1dbf73] transition-all resize-none"
                ></textarea>
            </div>

            <button 
                type="submit"
                disabled={isSending}
                className="w-full py-4 bg-[#404145] text-white font-bold rounded hover:bg-[#222325] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#404145]/10"
            >
                {isSending ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <>
                        Send Inquiry
                        <Send size={18} />
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
                    className="mt-6 p-4 bg-[#1dbf73]/10 border border-[#1dbf73]/20 rounded flex items-center gap-3 text-[#1dbf73]"
                >
                    <CheckCircle2 size={18} />
                    <span className="text-[13px] font-bold">Your inquiry has been sent to our administrators.</span>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      {/* Inquiry History */}
      <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
              <h3 className="text-[14px] font-bold text-[#404145] uppercase tracking-wider flex items-center gap-2">
                  <Mail size={16} className="text-[#1dbf73]" />
                  Inquiry History
              </h3>
              <span className="text-[11px] font-bold text-[#62646a] bg-[#efeff0] px-2 py-0.5 rounded">{messages.length} Tickets</span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[650px] pr-2 custom-scrollbar">
              {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e4e5e7] rounded-sm">
                      <Loader2 className="animate-spin text-[#1dbf73]" />
                  </div>
              ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e4e5e7] border-dashed rounded-sm">
                      <HelpCircle size={32} className="text-[#e4e5e7] mb-2" />
                      <p className="text-sm font-bold text-[#b5b6ba]">No inquiries found in your history.</p>
                  </div>
              ) : messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#e4e5e7] rounded-sm p-6 shadow-sm hover:shadow-md transition-all group"
                  >
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <div className="text-[14px] font-bold text-[#404145] group-hover:text-[#1dbf73] transition-colors">{msg.subject}</div>
                              <div className="text-[11px] text-[#b5b6ba] font-bold mt-1 flex items-center gap-2">
                                  <Clock size={12} />
                                  {new Date(msg.created_at).toLocaleString()}
                              </div>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                              msg.status === 'replied' ? 'bg-[#1dbf73]/10 text-[#1dbf73]' : 'bg-[#efeff0] text-[#62646a]'
                          }`}>
                              {msg.status}
                          </div>
                      </div>
                      
                      <div className="text-[13px] text-[#62646a] leading-relaxed mb-4 italic">
                          "{msg.message}"
                      </div>

                      {msg.reply && (
                          <div className="mt-4 pt-4 border-t border-[#e4e5e7] flex gap-4 items-start">
                              <div className="w-8 h-8 rounded-full bg-[#1dbf73] flex items-center justify-center shrink-0">
                                  <User size={14} className="text-white" />
                              </div>
                              <div className="flex-1">
                                  <div className="text-[11px] font-bold text-[#1dbf73] uppercase tracking-wider mb-1">Official Response</div>
                                  <p className="text-[13px] text-[#404145] font-medium leading-relaxed bg-[#f7f7f7] p-4 rounded">
                                      {msg.reply}
                                  </p>
                                  <div className="text-[10px] text-[#b5b6ba] font-bold mt-2">
                                      Responded on {new Date(msg.replied_at).toLocaleString()}
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
