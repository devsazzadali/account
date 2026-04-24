import React, { useEffect, useState, useRef } from "react";
import { 
  Search, 
  User, 
  Send, 
  CheckCheck, 
  Loader2,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  ShieldCheck,
  CheckCircle2
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

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  async function fetchMessages() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages(data || []);
        
        // Auto-select first user if none selected
        if (data && data.length > 0 && !selectedUser) {
            const uniqueUsers = Array.from(new Set(data.map(m => m.username)));
            if (uniqueUsers.length > 0) setSelectedUser(uniqueUsers[0]);
        }
        setLoading(false);
    } catch (err: any) {
        console.error("Fetch Error:", err.message);
        setLoading(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || !replyText.trim()) return;

    setIsReplying(true);
    try {
        // Insert a new threaded row as admin initiated
        const { error } = await supabase.from('messages').insert({
            username: selectedUser,
            subject: "Direct Chat",
            message: "[ADMIN_INITIATED]",
            reply: replyText,
            status: 'replied',
            replied_at: new Date().toISOString()
        });

        if (error) throw error;

        setReplyText("");
        fetchMessages();
    } catch (err: any) {
        alert("Error sending response: " + err.message);
    } finally {
        setIsReplying(false);
    }
  }

  // Group messages by user
  const groupedUsers = React.useMemo(() => {
      const map = new Map();
      messages.forEach(msg => {
          if (!map.has(msg.username)) {
              map.set(msg.username, []);
          }
          map.get(msg.username).push(msg);
      });
      return map;
  }, [messages]);

  const sortedUserList = Array.from(groupedUsers.keys())
      .filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
          const lastMsgA = groupedUsers.get(a).slice(-1)[0];
          const lastMsgB = groupedUsers.get(b).slice(-1)[0];
          return new Date(lastMsgB.created_at).getTime() - new Date(lastMsgA.created_at).getTime();
      });

  const activeThread = selectedUser ? groupedUsers.get(selectedUser) || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-140px)] bg-[#efeae2] border border-slate-200 shadow-2xl rounded-3xl overflow-hidden font-sans relative z-10">
      
      {/* Sidebar: Message List */}
      <div className="lg:col-span-4 border-r border-[#d1d7db] flex flex-col bg-white z-20">
        <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between border-b border-[#d1d7db]">
            <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-[#54656f]">
                <User size={20} />
            </div>
            <div className="flex items-center gap-4 text-[#54656f]">
                <CheckCircle2 size={20} />
                <MessageSquare size={20} />
                <MoreVertical size={20} />
            </div>
        </div>

        <div className="p-2 bg-white border-b border-[#d1d7db]">
            <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 py-1.5 gap-3">
                <Search size={18} className="text-[#54656f]" />
                <input 
                    type="text" 
                    placeholder="Search or start new chat"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none w-full text-[14px] text-[#111b21] focus:outline-none placeholder-[#54656f]"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {loading && sortedUserList.length === 0 ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#00a884]" /></div>
            ) : sortedUserList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-[#54656f] text-sm text-center">
                    No active chats found.
                </div>
            ) : sortedUserList.map((user) => {
                const msgs = groupedUsers.get(user);
                const lastMsg = msgs[msgs.length - 1];
                const previewText = lastMsg.message === '[ADMIN_INITIATED]' ? `You: ${lastMsg.reply}` : lastMsg.message;
                const unread = msgs.some((m: any) => m.status === 'unread' && m.message !== '[ADMIN_INITIATED]');

                return (
                    <button 
                        key={user}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full flex items-center gap-3 p-3 transition-colors ${
                            selectedUser === user ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                        }`}
                    >
                        <div className="w-12 h-12 rounded-full bg-[#dfe5e7] flex items-center justify-center text-[#54656f] shrink-0">
                            <User size={24} />
                        </div>
                        <div className="flex-1 min-w-0 border-b border-[#f0f2f5] pb-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-[16px] text-[#111b21] truncate">{user}</span>
                                <span className={`text-[12px] ${unread ? 'text-[#00a884] font-bold' : 'text-[#667781]'}`}>
                                    {new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[13px] text-[#667781] truncate pr-2">{previewText}</span>
                                {unread && <div className="w-5 h-5 bg-[#00a884] rounded-full text-white text-[10px] flex items-center justify-center font-bold">!</div>}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
      </div>

      {/* Main: Conversation View */}
      <div className="lg:col-span-8 flex flex-col bg-[#efeae2] relative z-10">
        {selectedUser ? (
            <>
                {/* Chat Header */}
                <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between border-b border-[#d1d7db] shrink-0 shadow-sm relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-[#54656f]">
                            <User size={20} />
                        </div>
                        <div>
                            <h4 className="text-[16px] text-[#111b21]">{selectedUser}</h4>
                            <p className="text-[12px] text-[#667781]">Customer Account</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-[#54656f]">
                        <Search size={20} className="cursor-pointer hover:text-[#111b21] transition-colors" />
                        <MoreVertical size={20} className="cursor-pointer hover:text-[#111b21] transition-colors" />
                    </div>
                </div>

                {/* Discussion Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px' }}></div>
                    
                    <div className="flex justify-center mb-8 relative z-10">
                        <div className="bg-[#ffeecd] text-[#544326] text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm border border-[#f5dfb5]">
                            Chat connected with {selectedUser}. Ensure professional conduct in support channels.
                        </div>
                    </div>

                    {activeThread.map((msg: any) => {
                        const isUserInitiated = msg.message !== '[ADMIN_INITIATED]';
                        const hasAdminReply = !!msg.reply;
                        
                        return (
                            <React.Fragment key={msg.id}>
                                {/* User Bubble (Customer) */}
                                {isUserInitiated && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start relative z-10">
                                        <div className="max-w-[75%] bg-white text-[#111b21] p-3 rounded-2xl rounded-tl-sm shadow-sm relative group">
                                            {msg.subject !== "Direct Chat" && msg.subject !== "General Inquiry" && (
                                                <div className="text-[11px] font-bold text-[#00a884] mb-1">{msg.subject}</div>
                                            )}
                                            <p className="text-[14px] leading-relaxed pr-12 whitespace-pre-wrap">{msg.message}</p>
                                            <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[#667781]">
                                                <span className="text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Admin Bubble (You) */}
                                {hasAdminReply && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end relative z-10">
                                        <div className="max-w-[75%] bg-[#d9fdd3] text-[#111b21] p-3 rounded-2xl rounded-tr-sm shadow-sm relative group">
                                            <p className="text-[14px] leading-relaxed pr-12 whitespace-pre-wrap">{msg.reply}</p>
                                            <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[#667781]">
                                                <span className="text-[10px]">{new Date(msg.replied_at || msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <CheckCheck size={14} className="text-[#53bdeb]" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </React.Fragment>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Reply Composer */}
                <div className="bg-[#f0f2f5] p-3 flex items-end gap-3 shrink-0 relative z-20">
                    <div className="flex gap-4 items-center px-2 pb-3 text-[#54656f]">
                        <Smile size={24} className="cursor-pointer hover:text-[#111b21] transition-colors" />
                        <Paperclip size={22} className="cursor-pointer hover:text-[#111b21] transition-colors" />
                    </div>
                    
                    <form onSubmit={handleSendReply} className="flex-1 flex gap-3 relative">
                        <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendReply(e);
                                }
                            }}
                            placeholder="Type a message"
                            className="w-full bg-white border-none rounded-xl px-4 py-3 text-[15px] text-[#111b21] focus:outline-none shadow-sm resize-none"
                            rows={1}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                        <button 
                            type="submit"
                            disabled={isReplying || !replyText.trim()}
                            className="w-11 h-11 shrink-0 bg-[#00a884] text-white rounded-full flex items-center justify-center hover:bg-[#008f6f] transition-all disabled:opacity-50 shadow-md"
                        >
                            {isReplying ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#f0f2f5] border-l border-[#d1d7db]">
                <ShieldCheck size={80} className="text-[#d1d7db] mb-6" />
                <h3 className="text-[28px] text-[#41525d] font-light mb-4">AccountStore Web</h3>
                <p className="text-[14px] text-[#667781] mt-2 max-w-md leading-relaxed">Select a user conversation from the left menu to view the full chat history and send direct messages securely.</p>
                <div className="mt-10 text-[12px] text-[#8696a0] flex items-center gap-1"><CheckCircle2 size={12}/> End-to-end encrypted</div>
            </div>
        )}
      </div>
    </div>
  );
}
