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
  Headphones,
  Calendar,
  Check,
  MoreHorizontal
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
      .channel('user_messages_fiverr')
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
            subject: "Inbox Inquiry",
            message: newMessage,
            status: 'unread'
        });

        if (error) throw error;
        setNewMessage("");
        fetchMessages();
    } catch (err: any) {
        alert("Error: " + err.message);
    } finally {
        setIsSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-[#e4e5e7] rounded-lg overflow-hidden font-sans">
      
      {/* ── Sidebar: Inbox List (Fiverr Style) ── */}
      <div className="hidden lg:flex w-[300px] flex-col border-r border-[#e4e5e7]">
        <div className="p-4 border-b border-[#e4e5e7] flex items-center justify-between bg-white">
           <h3 className="text-[18px] font-bold text-[#404145]">Inbox</h3>
           <button className="p-2 text-[#74767e] hover:bg-[#f5f5f5] rounded-full transition-all">
              <MoreHorizontal size={18} />
           </button>
        </div>
        <div className="p-4 border-b border-[#e4e5e7] bg-white">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b5b6ba]" size={16} />
                <input 
                    type="text" 
                    placeholder="Search messages" 
                    className="w-full bg-[#f5f5f5] border-none rounded py-2.5 pl-10 pr-4 text-[13px] focus:ring-1 focus:ring-[#1dbf73] focus:bg-white transition-all outline-none"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            <button className="w-full p-4 flex items-center gap-3 bg-[#f1fdf7] border-l-4 border-[#1dbf73] transition-all">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#1dbf73] flex items-center justify-center text-white shrink-0 font-bold">
                        S
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#1dbf73] rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[14px] font-bold text-[#404145] truncate">Customer Support</span>
                        <span className="text-[11px] text-[#74767e]">Online</span>
                    </div>
                    <p className="text-[12px] text-[#74767e] truncate font-normal">How can we help you today?</p>
                </div>
            </button>
        </div>
      </div>

      {/* ── Main: Chat Area (Fiverr Style) ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e4e5e7] flex items-center justify-between bg-white">
           <div className="flex items-center gap-3">
              <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-[#1dbf73] flex items-center justify-center text-white font-bold text-sm">
                    S
                 </div>
                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#1dbf73] rounded-full border-2 border-white" />
              </div>
              <div>
                 <div className="text-[15px] font-bold text-[#404145] flex items-center gap-2">
                    Customer Support
                 </div>
                 <p className="text-[12px] text-[#1dbf73] font-medium">Online</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button className="text-[#74767e] hover:text-[#1dbf73] p-2 transition-all"><Star size={18} /></button>
              <button className="text-[#74767e] hover:text-[#1dbf73] p-2 transition-all"><Search size={18} /></button>
              <button className="text-[#74767e] hover:text-[#1dbf73] p-2 transition-all"><MoreVertical size={18} /></button>
           </div>
        </div>

        {/* Messages Flow */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
           {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                 <Loader2 className="animate-spin text-[#1dbf73] w-8 h-8 mb-4" />
                 <p className="text-[13px] text-[#74767e]">Loading conversation...</p>
              </div>
           ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-4">
                     <MessageSquare className="text-[#b5b6ba]" size={32} />
                  </div>
                  <p className="text-[15px] font-bold text-[#404145]">No messages yet</p>
                  <p className="text-[13px] text-[#74767e] mt-1">Start a conversation with our support team.</p>
              </div>
           ) : (
              messages.map((msg) => {
                 const isAdmin = msg.message === '[ADMIN_INITIATED]';
                 return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} group`}>
                       <div className={`flex gap-3 max-w-[85%] ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold ${isAdmin ? 'bg-[#1dbf73]' : 'bg-[#404145]'}`}>
                             {isAdmin ? 'S' : (username[0] || 'U').toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-[13px] font-bold text-[#404145]">{isAdmin ? 'Support' : 'Me'}</span>
                                <span className="text-[11px] text-[#b5b6ba]">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                             </div>
                             <div className={`p-4 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${
                                isAdmin 
                                ? 'bg-[#f5f5f5] text-[#404145] rounded-tl-none' 
                                : 'bg-[#1dbf73] text-white rounded-tr-none'
                             }`}>
                                {isAdmin ? msg.reply : msg.message}
                             </div>
                             {!isAdmin && (
                                <div className="mt-1 flex justify-end">
                                   <CheckCheck size={14} className={msg.status === 'replied' ? "text-[#1dbf73]" : "text-[#b5b6ba]"} />
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 )
              })
           )}
           <div ref={chatEndRef} />
        </div>

        {/* Input Area (Fiverr Style) */}
        <div className="p-4 border-t border-[#e4e5e7] bg-white">
           <form onSubmit={handleSendMessage} className="border border-[#e4e5e7] rounded-md overflow-hidden bg-white focus-within:border-[#1dbf73] transition-all">
              <textarea 
                 value={newMessage}
                 onChange={e => setNewMessage(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                 placeholder="Type your message here..."
                 className="w-full p-4 text-[14px] text-[#404145] outline-none resize-none h-[100px]"
              />
              <div className="px-4 py-3 bg-[#f5f5f5] flex items-center justify-between border-t border-[#e4e5e7]">
                 <div className="flex items-center gap-4 text-[#74767e]">
                    <button type="button" className="hover:text-[#1dbf73] transition-all"><Paperclip size={18} /></button>
                    <button type="button" className="hover:text-[#1dbf73] transition-all"><Smile size={18} /></button>
                    <button type="button" className="hover:text-[#1dbf73] transition-all"><Package size={18} /></button>
                 </div>
                 <button 
                  disabled={isSending || !newMessage.trim()}
                  className="px-6 py-2 bg-[#1dbf73] text-white rounded font-bold text-[14px] hover:bg-[#19a463] transition-all disabled:opacity-50"
                 >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : "Send"}
                 </button>
              </div>
           </form>
           <div className="mt-2 flex items-center justify-between text-[11px] text-[#74767e]">
              <div className="flex items-center gap-1">
                 <ShieldCheck size={12} className="text-[#1dbf73]" />
                 Secure Conversation
              </div>
              <p>Press Enter to send</p>
           </div>
        </div>
      </div>

      {/* ── Sidebar: Info Panel (Fiverr Style) ── */}
      <div className="hidden xl:flex w-[300px] flex-col border-l border-[#e4e5e7] bg-white">
         <div className="p-6 border-b border-[#e4e5e7]">
            <h4 className="text-[14px] font-bold text-[#404145] mb-6">About Support</h4>
            <div className="space-y-5">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#74767e]">
                     <LifeBuoy size={20} />
                  </div>
                  <div>
                     <div className="text-[13px] font-bold text-[#404145]">Help Center</div>
                     <div className="text-[11px] text-[#74767e]">24/7 Availability</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#74767e]">
                     <Clock size={20} />
                  </div>
                  <div>
                     <div className="text-[13px] font-bold text-[#404145]">Avg. Response</div>
                     <div className="text-[11px] text-[#74767e]">Within 1 hour</div>
                  </div>
               </div>
            </div>
         </div>

         {lastOrder && (
            <div className="p-6 border-b border-[#e4e5e7]">
               <h4 className="text-[14px] font-bold text-[#404145] mb-4">Latest Order</h4>
               <div className="p-4 border border-[#e4e5e7] rounded-lg space-y-3">
                  <div className="text-[13px] font-bold text-[#404145] truncate">{lastOrder.products?.title}</div>
                  <div className="flex justify-between items-center">
                     <span className="text-[12px] text-[#74767e]">Order ID</span>
                     <span className="text-[12px] font-bold text-[#404145]">#{lastOrder.id.split('-')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[12px] text-[#74767e]">Status</span>
                     <span className="px-2 py-0.5 bg-[#f1fdf7] text-[#1dbf73] rounded text-[10px] font-bold uppercase">{lastOrder.status}</span>
                  </div>
                  <button className="w-full mt-2 py-2.5 bg-white border border-[#e4e5e7] text-[#404145] rounded font-bold text-[12px] hover:bg-[#f5f5f5] transition-all flex items-center justify-center gap-2">
                     <Package size={14} /> View Details
                  </button>
               </div>
            </div>
         )}

         <div className="p-6">
            <h4 className="text-[14px] font-bold text-[#404145] mb-4">Safety Tips</h4>
            <ul className="space-y-3">
               {[
                  "Never share your login credentials.",
                  "Only pay through our secure checkout.",
                  "Check asset details before finalizing."
               ].map((tip, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-[#74767e] leading-relaxed">
                     <Check size={14} className="text-[#1dbf73] shrink-0 mt-0.5" /> {tip}
                  </li>
               ))}
            </ul>
         </div>
      </div>

    </div>
  );
}
