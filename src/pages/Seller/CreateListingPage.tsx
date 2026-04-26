import React, { useState } from "react";
import { ChevronDown, Info, Upload, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function CreateListingPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] p-20 text-center shadow-2xl border border-emerald-100 flex flex-col items-center"
            >
                <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-[#1dbf73] mb-8 border border-emerald-100 shadow-inner">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Listing Initialized</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">The digital asset node has been successfully injected into the marketplace ledger. Redirecting to console...</p>
            </motion.div>
        ) : (
            <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Protocol Node</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 text-[#1dbf73] text-[10px] font-black uppercase tracking-widest">
                        <div className="w-2 h-2 bg-[#1dbf73] rounded-full animate-pulse" /> Secure Uplink Active
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-12 space-y-12">
                    {/* Identification */}
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

                    {/* Parameters */}
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
                                    <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Registry Node</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Domain Type</label>
                                        <select 
                                            value={formData.game}
                                            onChange={e => setFormData({...formData, game: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer"
                                        >
                                            <option>Facebook</option>
                                            <option>Valorant</option>
                                            <option>Free Fire</option>
                                            <option>PUBG</option>
                                            <option>Others</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Classification</label>
                                        <select 
                                            value={formData.category}
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none appearance-none cursor-pointer"
                                        >
                                            <option>Accounts</option>
                                            <option>Items</option>
                                            <option>Boosting</option>
                                            <option>Currency</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="pt-12 border-t border-slate-100">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#1dbf73] rounded-full" />
                                <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Asset Visualization</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                                <label className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Source</label>
                                <div className="md:col-span-10 flex gap-4">
                                    <input 
                                        type="text" 
                                        value={formData.image}
                                        onChange={e => setFormData({...formData, image: e.target.value})}
                                        placeholder="Secure HTTPS Image URL (Optional)"
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1dbf73] transition-all shadow-sm"
                                    />
                                    <div className="hidden md:flex items-center px-4 bg-slate-100 rounded-2xl text-slate-400 italic text-[11px] font-medium border border-slate-200">
                                        Cloud storage recommended
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
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
