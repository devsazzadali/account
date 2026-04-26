import React, { useState, useEffect } from "react";
import { ChevronDown, Info, Upload, AlertCircle, ArrowRight, Loader2, CheckCircle2, Search, Zap, Package } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function CreateListingPage() {
  const [step, setStep] = useState(0); // 0: Search/Select, 1: Details
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    price: "",
    stock: "1",
    category: "Accounts",
    game: "Facebook",
    badge: "Hot"
  });
  
  const navigate = useNavigate();

  const handleProductSelect = (game: string, category: string) => {
      setFormData(prev => ({ ...prev, game, category }));
      setStep(1);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('products').insert({
        title: formData.title,
        description: formData.description,
        image: formData.image || "https://picsum.photos/seed/default/400/225",
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        game: formData.game,
        badge: formData.badge,
        sold: 0
      });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans text-slate-900">
      <div className="container mx-auto px-4 max-w-5xl py-12">
        {/* Breadcrumb */}
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
            Home <ChevronDown size={10} className="-rotate-90" /> Store Management <ChevronDown size={10} className="-rotate-90" /> <span className="text-[#1dbf73]">Create Listing</span>
        </div>

        <AnimatePresence mode="wait">
        {success ? (
            <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] p-20 text-center shadow-2xl border border-emerald-100 flex flex-col items-center"
            >
                <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-[#1dbf73] mb-8 border border-emerald-100 shadow-inner">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase italic">Listing Initialized</h2>
                <p className="text-slate-500 font-bold max-w-sm mx-auto">The digital asset node has been successfully injected into the marketplace ledger.</p>
            </motion.div>
        ) : step === 0 ? (
            <motion.div 
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
            >
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50/50 border-b border-slate-100 p-8">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase italic">
                            <Package size={22} className="text-[#1dbf73]" /> Single Release / General Info
                        </h2>
                    </div>
                    <div className="p-10 space-y-8">
                        <div>
                            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Selling Items</label>
                            <p className="text-[10px] text-slate-400 font-bold mb-4">Enter product name here</p>
                            <div className="relative group">
                                <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#1dbf73] transition-all shadow-sm">
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="What do you want to sell?" 
                                        className="flex-1 px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none bg-white"
                                    />
                                    <div className="bg-slate-50 border-l border-slate-200 px-6 py-4 flex items-center gap-4 min-w-[150px]">
                                        <span className="text-sm font-bold text-slate-900">All</span>
                                        <ChevronDown size={18} className="text-slate-400" />
                                    </div>
                                </div>

                                {/* Search Suggestions (Dropdown like in Screenshot 1) */}
                                {searchTerm.toLowerCase().includes('face') && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                                        <div className="p-6 border-b border-slate-50">
                                            <h3 className="text-[13px] font-black text-slate-900 mb-6">Facebook</h3>
                                            <div className="flex flex-wrap gap-4">
                                                <button onClick={() => handleProductSelect("Facebook", "Top up")} className="px-5 py-2.5 bg-slate-50 hover:bg-emerald-50 rounded-full border border-slate-100 hover:border-emerald-200 flex items-center gap-2 transition-all group">
                                                    <img src="https://picsum.photos/seed/coins/40/40" className="w-5 h-5 rounded" alt="" />
                                                    <span className="text-[11px] font-black uppercase tracking-tight group-hover:text-[#1dbf73]">Top up</span>
                                                </button>
                                                <button onClick={() => handleProductSelect("Facebook", "Engagement")} className="px-5 py-2.5 bg-slate-50 hover:bg-emerald-50 rounded-full border border-slate-100 hover:border-emerald-200 flex items-center gap-2 transition-all group">
                                                    <Zap size={14} className="text-amber-500 fill-amber-500" />
                                                    <span className="text-[11px] font-black uppercase tracking-tight group-hover:text-[#1dbf73]">Platform Engagement</span>
                                                </button>
                                                <button onClick={() => handleProductSelect("Facebook", "Accounts")} className="px-5 py-2.5 bg-slate-50 hover:bg-emerald-50 rounded-full border border-slate-100 hover:border-emerald-200 flex items-center gap-2 transition-all group">
                                                    <img src="https://picsum.photos/seed/profile/40/40" className="w-5 h-5 rounded-full" alt="" />
                                                    <span className="text-[11px] font-black uppercase tracking-tight group-hover:text-[#1dbf73]">Accounts</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-orange-50/50 p-4 text-center">
                                            <p className="text-[11px] font-bold text-orange-600">
                                                Unable to find desired results? <button className="underline hover:text-orange-700">click feedback to Z2U team.</button>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-[#1dbf73]">
                                <Upload size={22} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase italic">Batch Release Products</h3>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-8 py-3 bg-[#E62E04] text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/10">
                                <Upload size={16} /> Upload List
                            </button>
                            <button className="px-8 py-3 bg-[#4CAF50] text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-500/10">
                                <Upload size={16} className="rotate-180" /> Download List
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        ) : (
            <motion.form 
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-slate-50/80 border-b border-slate-100 p-10 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-[#1dbf73] shadow-xl">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Asset Specification</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Node: {formData.game} / {formData.category}</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => setStep(0)} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest underline">Change Asset Type</button>
                </div>

                {/* Form Content (Same as previous but functionalized) */}
                <div className="p-12 space-y-12">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#1dbf73] rounded-full" />
                            <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Asset Identification</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                            <label className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</label>
                            <div className="md:col-span-10">
                                <input 
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    type="text" 
                                    placeholder="Ex: [ULTRA-PREMIUM] Facebook Verified Business Manager"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                            <label className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">Technical Logs</label>
                            <div className="md:col-span-10">
                                <textarea 
                                    required
                                    rows={5}
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Specify account features, verification status, and security protocols..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1dbf73] focus:bg-white transition-all shadow-sm"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-[#1dbf73] rounded-full" />
                                    <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Market Value</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Valuation (USD)</label>
                                        <input 
                                            required
                                            type="number" 
                                            step="0.01"
                                            value={formData.price}
                                            onChange={e => setFormData({...formData, price: e.target.value})}
                                            placeholder="0.00" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:outline-none focus:border-[#1dbf73] transition-all shadow-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Reserve Count</label>
                                        <input 
                                            required
                                            type="number" 
                                            value={formData.stock}
                                            onChange={e => setFormData({...formData, stock: e.target.value})}
                                            placeholder="QTY" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:outline-none focus:border-[#1dbf73] transition-all shadow-sm" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-[#1dbf73] rounded-full" />
                                    <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Node Metadata</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Badge Tag</label>
                                        <select 
                                            value={formData.badge}
                                            onChange={e => setFormData({...formData, badge: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer"
                                        >
                                            <option>Hot</option>
                                            <option>New</option>
                                            <option>Verified</option>
                                            <option>Premium</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <div className="px-6 py-4 bg-emerald-50 text-[#1dbf73] rounded-2xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest text-center">
                                            {formData.game} / {formData.category}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-slate-100 flex justify-end gap-6">
                        <button type="button" onClick={() => navigate("/admin")} className="px-10 py-5 bg-slate-50 hover:bg-slate-100 text-slate-400 font-black rounded-[1.5rem] text-[11px] uppercase tracking-widest transition-all">
                            Purge Form
                        </button>
                        <button 
                            disabled={loading}
                            type="submit" 
                            className="px-12 py-5 bg-slate-900 text-white font-black rounded-[1.5rem] text-[11px] uppercase tracking-[0.2em] hover:bg-[#1dbf73] transition-all shadow-2xl shadow-slate-900/10 flex items-center gap-4 group disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>Initialize Listing</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.form>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
