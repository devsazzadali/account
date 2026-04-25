import React, { useEffect, useState } from "react";
import {
  Plus, Edit, Trash2, Filter, Loader2, Search, X, Upload,
  Image as ImageIcon, Check, Package, DollarSign, Layers,
  ArrowRight, AlertCircle, Globe, MonitorSmartphone, ShieldCheck,
  AlignLeft, Zap, MoreVertical, Info, ChevronDown, Eye, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      showToast("Product removed");
    } catch (e: any) { showToast(e.message, "error"); }
  }

  const categories = ["All", ...categoriesList.map(c => c.name)];

  const filtered = products.filter(p => {
    const matchSearch = searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    const matchStatus = filterStatus === "All" ||
      (filterStatus === "Active" && p.stock > 0) ||
      (filterStatus === "Out of Stock" && p.stock === 0);
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="bg-white min-h-screen font-sans">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-4 left-1/2 z-[300] px-5 py-3 rounded shadow-lg flex items-center gap-2 text-white text-[13px] font-bold ${
              toast.type === "success" ? "bg-emerald-500" : "bg-primary-600"
            }`}
          >
            {toast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
        <div>
          <h2 className="text-[20px] font-bold text-slate-900">Product Management</h2>
          <p className="text-[13px] text-slate-400 mt-0.5">Manage your marketplace listings and inventory</p>
        </div>
        <button
          onClick={() => handleOpenDrawer()}
          className="px-5 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Create New Offer
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-slate-200">
        <MiniStat label="Total Products" value={products.length} color="#2563eb" />
        <MiniStat label="Active" value={products.filter(p => p.stock > 0).length} color="#059669" />
        <MiniStat label="Low Stock" value={products.filter(p => p.stock <= 5 && p.stock > 0).length} color="#f59e0b" />
        <MiniStat label="Out of Stock" value={products.filter(p => p.stock === 0).length} color="#0d9488" />
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by product name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-[13px] focus:outline-none focus:border-primary-600 bg-white"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-slate-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-primary-600"
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-primary-600"
          >
            <option>All</option>
            <option>Active</option>
            <option>Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-bold text-slate-900">Product</th>
              <th className="px-6 py-3 font-bold text-slate-900">Category</th>
              <th className="px-6 py-3 font-bold text-slate-900">Price</th>
              <th className="px-6 py-3 font-bold text-slate-900">Stock</th>
              <th className="px-6 py-3 font-bold text-slate-900">Status</th>
              <th className="px-6 py-3 font-bold text-slate-900 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
                <p className="text-[12px] text-slate-400 mt-2">Loading products...</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-slate-400">
                <Package size={40} className="mx-auto text-[#ddd] mb-2" />
                <p className="text-[13px]">No products found</p>
              </td></tr>
            ) : filtered.map(product => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                      <img src={product.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate max-w-[280px] group-hover:text-primary-600 transition-colors">
                        {product.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        ID: #{product.id.split("-")[0].toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-[#f0f2f5] text-slate-700 text-[11px] font-bold border border-slate-200">
                    {product.category || "—"}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-primary-600 text-[14px]">
                  ${Number(product.price).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${product.stock > 5 ? "bg-emerald-500" : product.stock > 0 ? "bg-amber-500" : "bg-primary-600"}`}
                        style={{ width: `${Math.min(100, (product.stock / 20) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-bold text-slate-900">{product.stock}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-50 text-primary-600 border border-red-200">
                      Out of Stock
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenDrawer(product)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-[12px] text-slate-400">
        Showing {filtered.length} of {products.length} products
      </div>

      {/* ── Drawer ── */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[101] flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-[16px] font-bold text-slate-900">
                  {editingId ? "Edit Product" : "Create New Offer"}
                </h3>
                <button onClick={() => setShowDrawer(false)} className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Image */}
                <Section title="Product Image" icon={<ImageIcon size={15} />}>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                      {formData.image ? (
                        <img src={formData.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Upload size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="text-[12px] text-slate-700 block mb-1">Image URL</label>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600"
                      />
                    </div>
                  </div>
                </Section>

                {/* Core Info */}
                <Section title="Product Information" icon={<Package size={15} />}>
                  <Field label="Product Title *">
                    <input
                      required type="text" value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Valorant Immortal Smurf | 50+ Skins"
                      className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <Field label="Price (USD) *">
                      <input
                        required type="number" step="0.01" value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        placeholder="29.99"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600"
                      />
                    </Field>
                    <Field label="Category">
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-primary-600"
                      >
                        {categoriesList.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </Section>

                {/* Delivery & Stock */}
                <Section title="Delivery & Stock" icon={<Zap size={15} />}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Delivery Method">
                      <div className="flex gap-1 p-0.5 bg-slate-50 rounded border border-slate-200">
                        {["Instant Delivery", "Manual Escrow"].map(m => (
                          <button
                            key={m} type="button"
                            onClick={() => setFormData({ ...formData, deliveryMethod: m })}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-all ${
                              formData.deliveryMethod === m ? "bg-white shadow-sm text-primary-600 border border-slate-200" : "text-slate-400"
                            }`}
                          >
                            {m.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Stock Quantity">
                      <input
                        type="number" value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600"
                      />
                    </Field>
                    <Field label="Platform">
                      <select
                        value={formData.platform}
                        onChange={e => setFormData({ ...formData, platform: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-primary-600"
                      >
                        <option>Global PC</option>
                        <option>PlayStation Network</option>
                        <option>Xbox Live</option>
                        <option>Mobile (iOS/Android)</option>
                      </select>
                    </Field>
                    <Field label="Server Region">
                      <select
                        value={formData.region}
                        onChange={e => setFormData({ ...formData, region: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-primary-600"
                      >
                        <option>Worldwide</option>
                        <option>North America (NA)</option>
                        <option>Europe (EU)</option>
                        <option>Asia (AS)</option>
                      </select>
                    </Field>
                  </div>
                  <label className="flex items-center gap-3 mt-4 p-3 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:border-primary-600 transition-colors">
                    <input
                      type="checkbox" checked={formData.fullAccess}
                      onChange={e => setFormData({ ...formData, fullAccess: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-200 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="text-[13px] font-bold text-slate-900">Provide Full Original Email Access</div>
                      <div className="text-[11px] text-slate-400">Increases trust and sale price</div>
                    </div>
                  </label>
                </Section>

                {/* Description */}
                <Section title="Description" icon={<AlignLeft size={15} />}>
                  <textarea
                    rows={4} value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide detailed product description, features, limitations..."
                    className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600 resize-none"
                  />
                </Section>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex gap-3 bg-slate-50">
                <button
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-[13px] font-bold rounded hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-[2] py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (
                    <>{editingId ? "Update Product" : "Publish Offer"} <ArrowRight size={14} /></>
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

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-6 py-4 border-r border-slate-200 last:border-r-0">
      <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-[22px] font-black mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[13px] font-bold text-slate-900">
        <span className="text-slate-400">{icon}</span> {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] text-slate-700 block mb-1">{label}</label>
      {children}
    </div>
  );
}
