import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Filter, 
  Zap, 
  Loader2, 
  Search, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  MoreVertical,
  ChevronRight,
  Package,
  DollarSign,
  Layers,
  ArrowRight,
  Info,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    image: "",
    stock: "10",
    category: "Accounts",
    description: ""
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function fetchProducts() {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
    } catch (err: any) {
        console.error("Error fetching products:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const handleOpenDrawer = (product?: any) => {
    if (product) {
        setEditingId(product.id);
        setFormData({
            title: product.title,
            price: product.price.toString(),
            image: product.image,
            stock: product.stock.toString(),
            category: product.category,
            description: product.description || ""
        });
    } else {
        setEditingId(null);
        setFormData({ title: "", price: "", image: "", stock: "10", category: "Accounts", description: "" });
    }
    setShowDrawer(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const payload = {
            title: formData.title,
            price: parseFloat(formData.price),
            image: formData.image || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop",
            stock: parseInt(formData.stock),
            category: formData.category,
            description: formData.description
        };

        if (editingId) {
            const { error } = await supabase.from('products').update(payload).eq('id', editingId);
            if (error) throw error;
            showToast("Asset updated successfully");
        } else {
            const { error } = await supabase.from('products').insert(payload);
            if (error) throw error;
            showToast("Asset deployed successfully");
        }
        
        setShowDrawer(false);
        fetchProducts();
    } catch (err: any) {
        showToast(err.message, 'error');
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to decommission this asset?")) return;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        setProducts(products.filter(p => p.id !== id));
        showToast("Asset removed from inventory");
    } catch (err: any) {
        showToast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Toast Notification */}
      <AnimatePresence>
          {toast && (
              <motion.div 
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className={`fixed top-6 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
                    toast.type === 'success' ? 'bg-green-500/90 text-white border-green-400' : 'bg-red-500/90 text-white border-red-400'
                }`}
              >
                  {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                  <span className="text-sm font-bold">{toast.message}</span>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
              <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                  <Package size={12} />
                  Inventory Management
              </div>
              <h2 className="text-3xl font-display font-bold text-slate-900 italic">Digital Assets</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Configure and deploy high-tier accounts to the global marketplace.</p>
          </div>
          <div className="flex items-center gap-3">
              <button 
                onClick={fetchProducts}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Zap size={14} className={loading ? 'animate-pulse text-primary-500' : ''} />
                Refresh Sync
              </button>
              <button 
                onClick={() => handleOpenDrawer()}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2 group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                Add New Asset
              </button>
          </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Total Assets" value={products.length} icon={<Package size={20} />} color="text-slate-600" />
          <StatCard label="Active Items" value={products.filter(p => p.stock > 0).length} icon={<Zap size={20} />} color="text-green-600" />
          <StatCard label="Low Stock" value={products.filter(p => p.stock <= 5 && p.stock > 0).length} icon={<Filter size={20} />} color="text-orange-600" />
          <StatCard label="Out of Stock" value={products.filter(p => p.stock === 0).length} icon={<X size={20} />} color="text-red-600" />
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
              <div className="flex-1 relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by title, category, or ID..." 
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                  />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-4 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-white transition-all flex items-center justify-center gap-2">
                      <Filter size={16} />
                      Category
                  </button>
                  <button className="flex-1 md:flex-none px-4 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-white transition-all flex items-center justify-center gap-2">
                      Sort by: Newest
                  </button>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Product Detail</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Status</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Inventory</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Valuation</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Operations</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {loading && products.length === 0 ? (
                          <tr><td colSpan={5} className="p-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing with Mainframe...</span>
                            </div>
                          </td></tr>
                      ) : products.length === 0 ? (
                          <tr><td colSpan={5} className="p-24 text-center">
                              <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                  <Package size={48} className="text-slate-200" />
                                  <span className="text-sm font-bold text-slate-400">No Assets Discovered</span>
                              </div>
                          </td></tr>
                      ) : products.map((product) => (
                          <ProductRow key={product.id} product={product} onEdit={() => handleOpenDrawer(product)} onDelete={() => handleDelete(product.id)} />
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Premium Side Drawer for Adding/Editing Products */}
      <AnimatePresence>
        {showDrawer && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowDrawer(false)}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                />
                <motion.div 
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[101] flex flex-col"
                >
                    {/* Drawer Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{editingId ? "Update Asset" : "New Asset Deployment"}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {editingId ? "Modify parameters for this digital offering." : "Configure parameters for a new digital offering."}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowDrawer(false)}
                            className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
                        {/* Image Preview / Upload Area */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Visualization</label>
                            <div className="relative group">
                                {formData.image ? (
                                    <div className="w-full h-56 rounded-3xl overflow-hidden border border-slate-200 relative shadow-sm">
                                        <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                        <button 
                                            onClick={() => setFormData({...formData, image: ""})}
                                            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-500 hover:text-red-600 shadow-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full h-56 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 bg-slate-50 group-hover:bg-slate-100/50 group-hover:border-primary-500/50 transition-all">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300 group-hover:text-primary-500 transition-colors">
                                            <ImageIcon size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-900">Provide Image Reference</p>
                                            <p className="text-xs text-slate-400 mt-1">Paste a valid URL below to visualize the asset.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <FormField label="Asset Title" icon={<Package size={16} />}>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="e.g. Netflix Premium - UHD 4K"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                    />
                                </FormField>

                                <div className="grid grid-cols-2 gap-6">
                                    <FormField label="Valuation (USD)" icon={<DollarSign size={16} />}>
                                        <input 
                                            required
                                            type="number" 
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                                            placeholder="29.99"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                        />
                                    </FormField>
                                    <FormField label="Inventory Level" icon={<Layers size={16} />}>
                                        <input 
                                            type="number" 
                                            value={formData.stock}
                                            onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="Asset Category" icon={<Filter size={16} />}>
                                    <div className="flex flex-wrap gap-2">
                                        {["Accounts", "Software", "Game", "Premium"].map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFormData({...formData, category: cat})}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                    formData.category === cat 
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10" 
                                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                {cat === "Accounts" ? "Streaming" : cat === "Game" ? "Gaming" : cat === "Premium" ? "Exclusive" : cat}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>

                                <FormField label="Image URL Source" icon={<ImageIcon size={16} />}>
                                    <input 
                                        type="text" 
                                        value={formData.image}
                                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                    />
                                </FormField>

                                <FormField label="Detailed Description" icon={<MoreVertical size={16} />}>
                                    <textarea 
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Describe the technical details, duration, and warranty of this asset..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none"
                                    ></textarea>
                                </FormField>
                            </div>
                        </form>
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                        <button 
                            onClick={() => setShowDrawer(false)}
                            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-white hover:border-slate-300 transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-sm shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {editingId ? "Update Asset" : "Confirm Deployment"}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components for better organization

function ProductRow({ product, onEdit, onDelete }: { product: any, onEdit: () => void, onDelete: () => void }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <tr className="hover:bg-slate-50/80 transition-all group cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <td className="px-8 py-6 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1 shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                            <img src={product.image} className="w-full h-full object-cover rounded-xl" alt="" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-900 block group-hover:text-primary-600 transition-colors">{product.title}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">{product.category} • ID: {product.id.split('-')[0].toUpperCase()}</span>
                        </div>
                    </div>
                </td>
                <td className="px-8 py-6 border-b border-slate-50">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        product.stock > 0 
                        ? "bg-green-50 text-green-700 border border-green-100" 
                        : "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                        {product.stock > 0 ? "Active" : "Archived"}
                    </div>
                </td>
                <td className="px-8 py-6 border-b border-slate-50">
                    <div className="space-y-1.5 w-32">
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className={product.stock <= 5 ? "text-red-500" : "text-slate-500"}>{product.stock} units</span>
                            <span className="text-slate-400">{Math.min(100, (product.stock / 20) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${product.stock <= 5 ? "bg-red-500" : "bg-primary-500"}`}
                                style={{ width: `${Math.min(100, (product.stock / 20) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </td>
                <td className="px-8 py-6 border-b border-slate-50">
                    <span className="text-base font-display font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
                </td>
                <td className="px-8 py-6 border-b border-slate-50 text-right">
                    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={onEdit}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 shadow-sm rounded-xl transition-all"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            onClick={onDelete}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 shadow-sm rounded-xl transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
            </tr>
            <AnimatePresence>
                {isExpanded && (
                    <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50/30"
                    >
                        <td colSpan={5} className="px-8 py-4 border-b border-slate-100">
                            <div className="flex gap-6 items-start">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-primary-600 shadow-sm">
                                    <Info size={18} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Asset Description</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">
                                        {product.description || "No detailed technical specifications provided for this asset."}
                                    </p>
                                </div>
                            </div>
                        </td>
                    </motion.tr>
                )}
            </AnimatePresence>
        </>
    );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-slate-50 rounded-2xl border border-slate-100 ${color}`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-display font-bold text-slate-900 mt-1">{value}</p>
            </div>
        </div>
    );
}

function FormField({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 ml-1">
                <span className="text-slate-400">{icon}</span>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
            </div>
            {children}
        </div>
    );
}
