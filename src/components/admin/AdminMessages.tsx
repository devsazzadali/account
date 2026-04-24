import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Clock, 
  User, 
  CheckCircle2, 
  Search, 
  Filter, 
  Loader2,
  Reply,
  X,
  Inbox,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [filter, setFilter] = useState("all"); // all, unread, replied

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
    } catch (err: any) {
        alert("Error sending response: " + err.message);
    } finally {
        setIsReplying(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently erase this signal?")) return;
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
      {/* Messages Sidebar */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Inbox size={16} className="text-primary-600" />
                Signal Receiver
            </h3>
            <div className="flex gap-2">
                <FilterButton active={filter === "all"} label="All" onClick={() => setFilter("all")} />
                <FilterButton active={filter === "unread"} label="Unread" onClick={() => setFilter("unread")} />
                <FilterButton active={filter === "replied"} label="Replied" onClick={() => setFilter("replied")} />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Loader2 className="animate-spin mb-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Scanning Waves...</span>
                </div>
            ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <MessageSquare size={48} className="mb-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Signals Captured</span>
                </div>
            ) : filteredMessages.map((msg) => (
                <button 
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-6 border-b border-slate-50 transition-all hover:bg-slate-50 group relative ${
                        selectedMessage?.id === msg.id ? "bg-slate-50 border-l-4 border-l-primary-500" : ""
                    }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <span className="text-xs font-bold text-slate-900">{msg.username}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700 truncate mb-1">{msg.subject}</div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{msg.message}</p>
                    
                    {msg.status === 'unread' && (
                        <div className="absolute top-6 right-6 w-2 h-2 bg-primary-500 rounded-full animate-pulse shadow-glow shadow-primary-500/50"></div>
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* Message Content & Reply */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500"></div>
        
        {selectedMessage ? (
            <>
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1 shadow-sm overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMessage.username}`} className="w-full h-full object-cover rounded-xl" alt="" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-900">{selectedMessage.username}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleDelete(selectedMessage.id)}
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button 
                            onClick={() => setSelectedMessage(null)}
                            className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="inline-flex px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-tight">Transmission Subject</div>
                        <h2 className="text-2xl font-display font-bold text-slate-900 italic">{selectedMessage.subject}</h2>
                        <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] text-sm text-slate-700 leading-relaxed shadow-inner">
                            {selectedMessage.message}
                        </div>
                    </div>

                    {selectedMessage.reply && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-slate-100"></div>
                                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.3em] px-4">Admin Response Sent</span>
                                <div className="h-px flex-1 bg-slate-100"></div>
                            </div>
                            <div className="bg-primary-50/30 border border-primary-100/50 p-8 rounded-[2rem] text-sm text-slate-700 leading-relaxed relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <CheckCircle2 size={64} className="text-primary-600" />
                                </div>
                                {selectedMessage.reply}
                                <div className="mt-4 text-[10px] font-bold text-primary-400 italic">
                                    Broadcasted at {new Date(selectedMessage.replied_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reply Form */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                    <form onSubmit={handleSendReply} className="space-y-4">
                        <textarea 
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Draft an encrypted response to this signal..."
                            className="w-full bg-white border border-slate-200 rounded-[2rem] px-6 py-5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-300 resize-none shadow-sm"
                        ></textarea>
                        <div className="flex justify-end">
                            <button 
                                type="submit"
                                disabled={isReplying || !replyText.trim()}
                                className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3 group disabled:opacity-50"
                            >
                                {isReplying ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        Broadcast Response
                                        <Reply size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100 border-dashed">
                    <Inbox size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 italic mb-2">No Signal Selected</h3>
                <p className="text-xs text-slate-500 font-medium max-w-xs">Select a transmission from the terminal on the left to review content and issue responses.</p>
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
