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
  AlertCircle,
  Globe,
  MonitorSmartphone,
  ShieldCheck,
  AlignLeft
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

  // Expanded Z2U-Style Form State
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    image: "",
    stock: "10",
    category: "Game Accounts",
    description: "",
    deliveryMethod: "Instant Delivery",
    platform: "Global PC",
    region: "Worldwide",
    fullAccess: true
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
            category: product.category || "Game Accounts",
            description: product.description || "",
            deliveryMethod: "Instant Delivery", // Default fallbacks for older products
            platform: "Global PC",
            region: "Worldwide",
            fullAccess: true
        });
    } else {
        setEditingId(null);
        setFormData({ 
            title: "", price: "", image: "", stock: "10", category: "Game Accounts", description: "",
            deliveryMethod: "Instant Delivery", platform: "Global PC", region: "Worldwide", fullAccess: true
        });
    }
    setShowDrawer(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        // Compile Z2U metadata into description if not already present
        let finalDescription = formData.description;
        if (!editingId && finalDescription.trim() !== "") {
             finalDescription = `${formData.description}\n\n--- Properties ---\nPlatform: ${formData.platform}\nRegion: ${formData.region}\nDelivery: ${formData.deliveryMethod}\nFull Access: ${formData.fullAccess ? 'Yes' : 'No'}`;
        }

        const payload = {
            title: formData.title,
            price: parseFloat(formData.price),
            image: formData.image || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop",
            stock: parseInt(formData.stock),
            category: formData.category,
            description: finalDescription
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
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                />
                <motion.div 
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-50 shadow-2xl z-[101] flex flex-col overflow-hidden"
                >
                    {/* Drawer Header */}
                    <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between z-10 shadow-sm relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-blue-600"></div>
                        <div>
                            <h3 className="text-2xl font-display font-bold text-slate-900 italic">{editingId ? "Modify Protocol" : "Deploy New Asset"}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Configure market specifications and distribution mechanics.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowDrawer(false)}
                            className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Drawer Content - Z2U Style Segments */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative">
                        
                        {/* Section 1: Visual Identity */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                                <ImageIcon size={18} className="text-primary-600" />
                                Visual Identity
                            </h4>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-1/3 aspect-square rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 relative group bg-slate-50 flex items-center justify-center">
                                    {formData.image ? (
                                        <>
                                            <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    onClick={() => setFormData({...formData, image: ""})}
                                                    className="p-3 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                <Upload size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Awaiting Media</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <FormField label="Direct Image URL" icon={<Globe size={16} />}>
                                        <input 
                                            type="text" 
                                            value={formData.image}
                                            onChange={(e) => setFormData({...formData, image: e.target.value})}
                                            placeholder="https://example.com/asset-cover.jpg"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                        />
                                    </FormField>
                                    <p className="text-xs text-slate-400 mt-3 font-medium leading-relaxed">
                                        For premium marketplace display, use a 16:9 ratio image. High contrast artwork performs 43% better in conversions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Core Specifications */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                                <AlignLeft size={18} className="text-primary-600" />
                                Core Specifications
                            </h4>
                            <div className="grid grid-cols-1 gap-5">
                                <FormField label="Market Designation (Title)" icon={<Package size={16} />}>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="e.g. Valorant Immortal Smurf | 50+ Skins"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                    />
                                </FormField>

                                <div className="grid grid-cols-2 gap-5">
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
                                    <FormField label="Category Type" icon={<Filter size={16} />}>
                                        <select 
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none"
                                        >
                                            <option>Game Accounts</option>
                                            <option>Software Keys</option>
                                            <option>In-Game Currency</option>
                                            <option>Boosting Service</option>
                                        </select>
                                    </FormField>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Premium Asset Properties (Z2U Style) */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-primary-500/5 rounded-bl-full pointer-events-none"></div>
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6 relative z-10">
                                <ShieldCheck size={18} className="text-primary-600" />
                                Asset Properties & Delivery
                            </h4>
                            <div className="grid grid-cols-2 gap-5 relative z-10">
                                <FormField label="Delivery Protocol" icon={<Zap size={16} />}>
                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
                                        {["Instant Delivery", "Manual Escrow"].map(method => (
                                            <button 
                                                key={method}
                                                type="button"
                                                onClick={() => setFormData({...formData, deliveryMethod: method})}
                                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                                                    formData.deliveryMethod === method ? "bg-white shadow-sm text-primary-600 border border-slate-100" : "text-slate-500 hover:text-slate-900"
                                                }`}
                                            >
                                                {method.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>
                                <FormField label="Initial Inventory" icon={<Layers size={16} />}>
                                    <input 
                                        type="number" 
                                        value={formData.stock}
                                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                    />
                                </FormField>

                                <FormField label="Platform" icon={<MonitorSmartphone size={16} />}>
                                    <select 
                                        value={formData.platform}
                                        onChange={(e) => setFormData({...formData, platform: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none"
                                    >
                                        <option>Global PC</option>
                                        <option>PlayStation Network</option>
                                        <option>Xbox Live</option>
                                        <option>Mobile (iOS/Android)</option>
                                    </select>
                                </FormField>

                                <FormField label="Server Region" icon={<Globe size={16} />}>
                                    <select 
                                        value={formData.region}
                                        onChange={(e) => setFormData({...formData, region: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none"
                                    >
                                        <option>Worldwide</option>
                                        <option>North America (NA)</option>
                                        <option>Europe (EU)</option>
                                        <option>Asia (AS)</option>
                                    </select>
                                </FormField>
                                
                                <div className="col-span-2 pt-2">
                                    <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-primary-200 transition-all group">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.fullAccess}
                                            onChange={(e) => setFormData({...formData, fullAccess: e.target.checked})}
                                            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">Provide Full Original Email Access</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Increases market trust and average sale price.</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Details */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                                <AlignLeft size={18} className="text-primary-600" />
                                Comprehensive Description
                            </h4>
                            <FormField label="Asset Specifics" icon={<MoreVertical size={16} />}>
                                <textarea 
                                    rows={5}
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Provide detailed logs of skins, currency, account age, or software limitations..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none"
                                ></textarea>
                            </FormField>
                        </div>
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-6 border-t border-slate-200 bg-white flex gap-4 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                        <button 
                            onClick={() => setShowDrawer(false)}
                            className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all text-sm uppercase tracking-widest"
                        >
                            Abort
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-[2] py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {editingId ? "Update Registry" : "Authorize Deployment"}
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
