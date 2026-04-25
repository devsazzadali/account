import React, { useEffect, useState } from "react";
import {
  Plus, Edit, Trash2, Filter, Loader2, Search, X, Upload,
  Image as ImageIcon, Check, Package, DollarSign, Layers,
  ArrowRight, AlertCircle, Globe, MonitorSmartphone, ShieldCheck,
  AlignLeft, Zap, MoreVertical, Info, ChevronDown, Eye, Copy, Trash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [formData, setFormData] = useState({
    title: "", price: "", image: "", stock: "10",
    category: "Game Accounts", description: "",
    deliveryMethod: "Instant Delivery", platform: "Global PC",
    region: "Worldwide", fullAccess: true,
  });

  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => { 
    fetchProducts(); 
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (!error && data) setCategoriesList(data);
    } catch (e) {}
  }

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (e: any) { console.error(e.message); }
    finally { setLoading(false); }
  }

  const handleOpenDrawer = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        title: product.title, price: product.price.toString(), image: product.image,
        stock: product.stock.toString(), category: product.category || "Game Accounts",
        description: product.description || "", deliveryMethod: "Instant Delivery",
        platform: "Global PC", region: "Worldwide", fullAccess: true,
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", price: "", image: "", stock: "10", category: "Game Accounts", description: "", deliveryMethod: "Instant Delivery", platform: "Global PC", region: "Worldwide", fullAccess: true });
    }
    setShowDrawer(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let desc = formData.description;
      if (!editingId && desc.trim()) {
        desc = `${desc}\n\n--- Properties ---\nPlatform: ${formData.platform}\nRegion: ${formData.region}\nDelivery: ${formData.deliveryMethod}\nFull Access: ${formData.fullAccess ? "Yes" : "No"}`;
      }
      const payload = {
        title: formData.title, price: parseFloat(formData.price),
        image: formData.image || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop",
        stock: parseInt(formData.stock), category: formData.category, description: desc,
      };
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;
        showToast("Product updated successfully");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        showToast("Product created successfully");
      }
      setShowDrawer(false);
      fetchProducts();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setIsSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this asset from the registry?")) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      
      if (error) {
          // Check for foreign key constraint (orders)
          if (error.code === '23503') {
              throw new Error("Cannot delete product: It is linked to existing orders. Try setting stock to 0 instead.");
          }
          throw error;
      }
      
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast("Asset purged from registry");
    } catch (e: any) { 
      showToast(e.message, "error"); 
    } finally { 
      setDeletingId(null); 
    }
  }

  const categories = ["All", ...categoriesList.map(c => c.name)];

  const filtered = products.filter(p => {
    const matchSearch = searchQuery === "" ||
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    const matchStatus = filterStatus === "All" ||
      (filterStatus === "Active" && p.stock > 0) ||
      (filterStatus === "Out of Stock" && p.stock === 0);
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-[3000] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-[13px] font-black uppercase tracking-widest ${
              toast.type === "success" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-600 shadow-red-500/20"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Asset Inventory</h2>
             <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Admin Node</span>
          </div>
          <p className="text-[14px] text-slate-500 font-medium">Manage marketplace listings, price matrices, and stock levels.</p>
        </div>
        <button
          onClick={() => handleOpenDrawer()}
          className="px-8 py-4 bg-[#1dbf73] text-white text-[13px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#19a463] transition-all flex items-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95"
        >
          <Plus size={18} /> Initialize New Asset
        </button>
      </div>

      <div className="p-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Registry" value={products.length} icon={<Package size={20} />} color="text-slate-900" />
            <StatCard label="Active Nodes" value={products.filter(p => p.stock > 0).length} icon={<Zap size={20} />} color="text-emerald-500" />
            <StatCard label="Depleted Units" value={products.filter(p => p.stock === 0).length} icon={<XCircle size={20} />} color="text-red-500" />
            <StatCard label="Valuation" value={`$${products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}`} icon={<DollarSign size={20} />} color="text-blue-500" />
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by asset title or hash..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#1dbf73] transition-all"
                />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="flex-1 md:w-48 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[13px] font-bold focus:outline-none"
                >
                    {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="flex-1 md:w-48 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[13px] font-bold focus:outline-none"
                >
                    <option>All</option>
                    <option>Active</option>
                    <option>Out of Stock</option>
                </select>
            </div>
        </div>

        {/* Product Table */}
        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Asset Identity</th>
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Node Category</th>
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Price Unit</th>
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Available Units</th>
                    <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                    <th className="px-8 py-5 font-black text-[#1dbf73] uppercase tracking-widest text-[10px] text-right">Control</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {loading ? (
                    <tr><td colSpan={6} className="py-32 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#1dbf73] mb-4" />
                        <p className="text-[12px] text-slate-400 font-black uppercase tracking-widest">Decrypting Inventory...</p>
                    </td></tr>
                    ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-32 text-center">
                        <Package size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-[14px] font-black text-slate-900">Registry Entry Empty</p>
                    </td></tr>
                    ) : filtered.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <img src={product.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="min-w-0">
                            <div className="font-black text-slate-900 truncate max-w-[280px] group-hover:text-[#1dbf73] transition-colors">
                                {product.title}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                Hash: {product.id.split("-")[0].toUpperCase()}
                            </div>
                            </div>
                        </div>
                        </td>
                        <td className="px-8 py-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-widest border border-slate-100">
                            {product.category || "—"}
                        </span>
                        </td>
                        <td className="px-8 py-6 font-black text-slate-900 text-[16px]">
                        ${Number(product.price).toFixed(2)}
                        </td>
                        <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${product.stock > 5 ? "bg-emerald-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, (product.stock / 20) * 100)}%` }}
                            />
                            </div>
                            <span className="text-[13px] font-black text-slate-900">{product.stock}</span>
                        </div>
                        </td>
                        <td className="px-8 py-6">
                        {product.stock > 0 ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                            Depleted
                            </span>
                        )}
                        </td>
                        <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button
                            onClick={() => handleOpenDrawer(product)}
                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                            title="Modify Node"
                            >
                            <Edit size={18} />
                            </button>
                            <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50"
                            title="Purge Node"
                            >
                            {deletingId === product.id ? <Loader2 size={18} className="animate-spin" /> : <Trash size={18} />}
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* ── Drawer ── */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2500]"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[2501] flex flex-col overflow-hidden"
            >
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div>
                   <h3 className="text-2xl font-black tracking-tight">{editingId ? "Modify Asset Registry" : "Initialize New Node"}</h3>
                   <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] mt-1">Registry Authority Layer</p>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <Section title="Asset Visualization" icon={<ImageIcon size={18} />}>
                  <div className="flex gap-8">
                    <div className="w-32 h-32 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                      {formData.image ? (
                        <img src={formData.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Upload size={32} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <Field label="Identity URL">
                        <input
                          type="text"
                          value={formData.image}
                          onChange={e => setFormData({ ...formData, image: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all"
                        />
                      </Field>
                    </div>
                  </div>
                </Section>

                <Section title="Value & Classification" icon={<Package size={18} />}>
                  <Field label="Marketplace Title">
                    <input
                      required type="text" value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <Field label="Currency Unit (USD)">
                      <input
                        required type="number" step="0.01" value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all"
                      />
                    </Field>
                    <Field label="Registry Node">
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all cursor-pointer"
                      >
                        {categoriesList.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </Section>

                <Section title="Inventory Dynamics" icon={<Zap size={18} />}>
                    <div className="grid grid-cols-2 gap-6">
                        <Field label="Units in Stock">
                            <input
                                type="number" value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all"
                            />
                        </Field>
                        <Field label="Asset Region">
                            <select
                                value={formData.region}
                                onChange={e => setFormData({ ...formData, region: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all"
                            >
                                <option>Worldwide</option>
                                <option>North America (NA)</option>
                                <option>Europe (EU)</option>
                                <option>Asia (AS)</option>
                            </select>
                        </Field>
                    </div>
                </Section>

                <Section title="Detailed Spec" icon={<AlignLeft size={18} />}>
                  <textarea
                    rows={6} value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all resize-none"
                    placeholder="Enter encrypted asset details..."
                  />
                </Section>
              </div>

              <div className="px-10 py-8 border-t border-slate-100 flex gap-4 bg-slate-50">
                <button
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 py-4 border-2 border-slate-200 text-slate-900 text-[13px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-slate-900 text-white text-[13px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (
                    <>{editingId ? "Update Node" : "Authorize Node"} <ArrowRight size={18} /></>
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

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className={`${color} mb-4`}>{icon}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-3xl font-black text-slate-900`}>{value}</div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
        <span className="text-[#1dbf73]">{icon}</span> {title}
      </div>
      <div className="bg-white p-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}

function XCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
  )
}
