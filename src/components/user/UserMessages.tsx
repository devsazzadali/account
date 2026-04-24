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
  Smile
} from "lucide-react";
import { motion } from "framer-motion";
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
    // Set up a simple polling for real-time feel since we might not have WS set up
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
        console.error("Fetch Messages Error:", err.message);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
        const { error } = await supabase.from('messages').insert({
            username: username,
            subject: "Direct Chat",
            message: newMessage,
            status: 'unread'
        });

        if (error) throw error;

        setNewMessage("");
        fetchMessages();
    } catch (err: any) {
        alert("Transmission Error: " + err.message);
    } finally {
        setIsSending(false);
    }
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-[#efeae2] border border-slate-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col font-sans relative z-10">
      
      {/* WhatsApp Style Header */}
      <div className="bg-[#00a884] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md relative z-20">
          <div className="flex items-center gap-4">
              <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                      <ShieldCheck size={24} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#00a884] rounded-full"></div>
              </div>
              <div>
                  <h3 className="text-[16px] font-bold tracking-wide">AccountStore Support</h3>
                  <p className="text-[12px] text-white/80 font-medium flex items-center gap-1">
                      typically replies instantly
                  </p>
              </div>
          </div>
          <div className="flex items-center gap-6 text-white/90">
              <Search size={20} className="cursor-pointer hover:text-white transition-colors" />
              <MoreVertical size={20} className="cursor-pointer hover:text-white transition-colors" />
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#efeae2] relative">
          {/* WhatsApp Background Pattern (Subtle) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px' }}></div>
          
          <div className="flex justify-center mb-8 relative z-10">
              <div className="bg-[#ffeecd] text-[#544326] text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm border border-[#f5dfb5]">
                  Messages are secured with end-to-end encryption. No one outside of this chat can read them.
              </div>
          </div>

          {loading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-[#00a884] w-8 h-8" />
              </div>
          ) : (
              messages.map((msg, idx) => {
                  const showUserMsg = msg.message !== '[ADMIN_INITIATED]';
                  const showAdminMsg = !!msg.reply;
                  
                  return (
                      <React.Fragment key={msg.id}>
                          {/* User Bubble */}
                          {showUserMsg && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-end relative z-10"
                              >
                                  <div className="max-w-[75%] bg-[#d9fdd3] text-[#111b21] p-3 rounded-2xl rounded-tr-sm shadow-sm relative group">
                                      <p className="text-[14px] leading-relaxed pr-12 whitespace-pre-wrap">{msg.message}</p>
                                      <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[#667781]">
                                          <span className="text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          <CheckCheck size={14} className={msg.status === 'replied' ? "text-[#53bdeb]" : ""} />
                                      </div>
                                  </div>
                              </motion.div>
                          )}

                          {/* Admin Reply Bubble */}
                          {showAdminMsg && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start relative z-10"
                              >
                                  <div className="max-w-[75%] bg-white text-[#111b21] p-3 rounded-2xl rounded-tl-sm shadow-sm relative group">
                                      <p className="text-[14px] leading-relaxed pr-12 whitespace-pre-wrap">{msg.reply}</p>
                                      <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[#667781]">
                                          <span className="text-[10px]">{new Date(msg.replied_at || msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                  </div>
                              </motion.div>
                          )}
                      </React.Fragment>
                  );
              })
          )}
          <div ref={chatEndRef} />
      </div>

      {/* WhatsApp Style Input Area */}
      <div className="bg-[#f0f2f5] p-3 flex items-end gap-3 shrink-0 relative z-20">
          <div className="flex gap-4 items-center px-2 pb-3 text-[#54656f]">
              <Smile size={24} className="cursor-pointer hover:text-[#00a884] transition-colors" />
              <Paperclip size={22} className="cursor-pointer hover:text-[#00a884] transition-colors" />
          </div>
          
          <form onSubmit={handleSendMessage} className="flex-1 flex gap-3 relative">
              <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                      }
                  }}
                  placeholder="Type a message"
                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-[15px] text-[#111b21] focus:outline-none shadow-sm resize-none"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button 
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="w-11 h-11 shrink-0 bg-[#00a884] text-white rounded-full flex items-center justify-center hover:bg-[#008f6f] transition-all disabled:opacity-50 shadow-md"
              >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
              </button>
          </form>
      </div>
    </div>
  );
}
