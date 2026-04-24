import React, { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  MessageSquare, 
  User, 
  Send, 
  Clock, 
  CheckCircle2, 
  Trash2,
  MoreVertical,
  Loader2,
  Inbox,
  AlertCircle,
  X,
  MailOpen
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        setMessages(data || []);
        
        // Auto-select first message if none selected
        if (data && data.length > 0 && !selectedMessage) {
            setSelectedMessage(data[0]);
        }
    } catch (err: any) {
        console.error("Fetch Error:", err.message);
    } finally {
        setLoading(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsReplying(true);
    try {
        const { error } = await supabase
            .from('messages')
            .update({
                reply: replyText,
                status: 'replied',
                replied_at: new Date().toISOString()
            })
            .eq('id', selectedMessage.id);

        if (error) throw error;

        setReplyText("");
        setSelectedMessage({...selectedMessage, reply: replyText, status: 'replied'});
        fetchMessages();
        alert("Response sent successfully.");
    } catch (err: any) {
        alert("Error sending response: " + err.message);
    } finally {
        setIsReplying(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) throw error;
        setMessages(messages.filter(m => m.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (err: any) {
        alert("Delete Error: " + err.message);
    }
  }

  const filteredMessages = messages.filter(m => {
    if (filter === "unread") return m.status === "unread";
    if (filter === "replied") return m.status === "replied";
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-180px)] bg-white border border-[#e4e5e7] rounded-sm shadow-sm overflow-hidden">
      
      {/* Sidebar: Message List */}
      <div className="lg:col-span-4 border-r border-[#e4e5e7] flex flex-col overflow-hidden bg-white">
        <div className="p-6 border-b border-[#e4e5e7] bg-[#f7f7f7]/50">
            <h3 className="text-[14px] font-bold text-[#404145] uppercase tracking-wider flex items-center gap-2 mb-4">
                <Inbox size={18} className="text-[#1dbf73]" />
                Customer Inquiries
            </h3>
            <div className="flex gap-2">
                {["all", "unread", "replied"].map((f) => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${
                            filter === f 
                            ? "bg-[#404145] text-white" 
                            : "bg-white text-[#62646a] border border-[#e4e5e7] hover:bg-[#f7f7f7]"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#e4e5e7]">
            {loading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Loader2 className="animate-spin text-[#1dbf73]" />
                </div>
            ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#b5b6ba]">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <span className="text-xs font-bold uppercase">No inquiries found</span>
                </div>
            ) : filteredMessages.map((msg) => (
                <button 
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-6 transition-all hover:bg-[#f7f7f7] border-l-4 ${
                        selectedMessage?.id === msg.id ? "bg-[#f7f7f7] border-l-[#1dbf73]" : "border-l-transparent"
                    }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#efeff0] flex items-center justify-center text-[#1dbf73]">
                                <User size={14} />
                            </div>
                            <span className="text-[13px] font-bold text-[#404145]">{msg.username}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#b5b6ba] uppercase">{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[12px] font-bold text-[#404145] truncate mb-1">{msg.subject}</div>
                    <p className="text-[11px] text-[#62646a] line-clamp-1">{msg.message}</p>
                    
                    {msg.status === 'replied' && (
                        <div className="mt-2 flex items-center gap-1 text-[#1dbf73]">
                            <CheckCircle2 size={10} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Replied</span>
                        </div>
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* Main: Conversation View */}
      <div className="lg:col-span-8 flex flex-col overflow-hidden bg-[#f7f7f7]/30">
        {selectedMessage ? (
            <>
                {/* Inquiry Header */}
                <div className="p-8 bg-white border-b border-[#e4e5e7] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#efeff0] flex items-center justify-center text-[#1dbf73]">
                            <User size={24} />
                        </div>
                        <div>
                            <h4 className="text-[16px] font-bold text-[#404145]">{selectedMessage.username}</h4>
                            <p className="text-[12px] text-[#b5b6ba] font-medium">Inquiry ID: {selectedMessage.id.split('-')[0].toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleDelete(selectedMessage.id)}
                            className="p-2 text-[#b5b6ba] hover:text-red-500 transition-all"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Discussion Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* User Inquiry */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-[#e4e5e7]"></div>
                            <span className="text-[10px] font-bold text-[#b5b6ba] uppercase tracking-widest px-4">Customer Inquiry</span>
                            <div className="h-px flex-1 bg-[#e4e5e7]"></div>
                        </div>
                        <div className="bg-white border border-[#e4e5e7] p-8 rounded shadow-sm">
                            <h2 className="text-xl font-bold text-[#404145] mb-4">{selectedMessage.subject}</h2>
                            <p className="text-[#62646a] text-[14px] leading-relaxed">
                                {selectedMessage.message}
                            </p>
                            <div className="mt-6 text-[11px] text-[#b5b6ba] font-bold flex items-center gap-2">
                                <Clock size={14} /> Received on {new Date(selectedMessage.created_at).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Admin Response */}
                    {selectedMessage.reply && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-[#e4e5e7]"></div>
                                <span className="text-[10px] font-bold text-[#1dbf73] uppercase tracking-widest px-4">Your Official Response</span>
                                <div className="h-px flex-1 bg-[#e4e5e7]"></div>
                            </div>
                            <div className="bg-[#1dbf73] text-white p-8 rounded shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <MailOpen size={64} />
                                </div>
                                <p className="text-[14px] leading-relaxed relative z-10 font-medium">
                                    {selectedMessage.reply}
                                </p>
                                <div className="mt-6 text-[11px] font-bold text-white/70 flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Dispatched on {new Date(selectedMessage.replied_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reply Composer */}
                <div className="p-8 bg-white border-t border-[#e4e5e7]">
                    <form onSubmit={handleSendReply} className="space-y-4">
                        <div className="text-[13px] font-bold text-[#404145] mb-1">Draft Response</div>
                        <textarea 
                            rows={4}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your professional response here..."
                            className="w-full bg-[#f7f7f7] border border-[#e4e5e7] rounded p-4 text-[14px] focus:outline-none focus:border-[#1dbf73] transition-all resize-none"
                        ></textarea>
                        <div className="flex justify-end">
                            <button 
                                type="submit"
                                disabled={isReplying || !replyText.trim()}
                                className="px-8 py-3 bg-[#1dbf73] text-white font-bold rounded hover:bg-[#19a463] transition-all flex items-center gap-2 shadow-lg shadow-[#1dbf73]/10 disabled:opacity-50"
                            >
                                {isReplying ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Send Official Response
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                <Inbox size={64} className="text-[#b5b6ba] mb-4" />
                <h3 className="text-xl font-bold text-[#404145]">No Inquiry Selected</h3>
                <p className="text-sm text-[#62646a] mt-2">Select a customer inquiry from the list to manage the communication.</p>
            </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all ${
                active 
                ? "bg-slate-900 text-white shadow-lg" 
                : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
            }`}
        >
            {label}
        </button>
    );
}
