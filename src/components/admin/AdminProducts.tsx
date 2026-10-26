"use client";

import React, { useEffect, useState } from "react";
import { 
  Plus, 
  PlusCircle,
  Edit, 
  Trash2, 
  Filter, 
  Zap, 
  Loader2, 
  Search, 
  AlertCircle, 
  ChevronRight, 
  Upload, 
  Download,
  Package,
  Layers,
  LayoutGrid,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  SearchCode,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { toast } from "react-hot-toast";


export function AdminProducts({ activeTab }: { activeTab?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    image: "",
    stock: "10",
    category: "Accounts",
    game_type: "All",
    description: "",
    min_quantity: "1",
    delivery_eta_hours: "",
    fulfilment_type: "manual",
    warranty_days: "",
    use_inventory_stock: false,
    specs: {} as Record<string, string>,
    variants: [] as { label: string; priceDelta: string; stock: string }[]
  });

  const [editing, setEditing] = useState<any>(null);

  function variantsPayload(rows: { label: string; priceDelta: string; stock: string }[]) {
    return rows
      .filter((v) => v.label.trim())
      .map((v) => ({
        label: v.label.trim(),
        priceDelta: Number(v.priceDelta) || 0,
        stock: v.stock === "" ? null : Math.max(0, parseInt(v.stock) || 0),
      }));
  }

  async function handleUpdateProduct() {
    if (!editing) return;
    setLoading(true);
    try {
      const { error } = await db.from("products").update({
        title: editing.title,
        price: parseFloat(editing.price),
        // Derived-stock products ignore the manual number (the server
        // recomputes it from inventory) — send it only for manual ones.
        ...(editing.use_inventory_stock ? {} : { stock: parseInt(editing.stock) || 0 }),
        category: editing.category,
        badge: editing.badge || null,
        image: editing.image || null,
        description: editing.description || null,
        min_quantity: Math.max(1, parseInt(editing.min_quantity) || 1),
        delivery_eta_hours: editing.delivery_eta_hours === "" || editing.delivery_eta_hours == null ? null : parseInt(editing.delivery_eta_hours) || null,
        fulfilment_type: ["instant", "manual", "service"].includes(editing.fulfilment_type) ? editing.fulfilment_type : "manual",
        warranty_days: editing.warranty_days === "" || editing.warranty_days == null ? null : Math.max(0, parseInt(editing.warranty_days) || 0) || null,
        use_inventory_stock: !!editing.use_inventory_stock,
        is_active: editing.is_active !== false,
        specs: editing.specs && Object.keys(editing.specs).length ? editing.specs : null,
        variants: (() => {
          const v = variantsPayload(Array.isArray(editing.variants) ? editing.variants : []);
          return v.length ? v : null;
        })(),
      }).eq("id", editing.id);
      if (error) throw error;
      toast.success("Product updated");
      setEditing(null);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(product: any) {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    try {
      const { error } = await db.from("products").delete().eq("id", product.id);
      if (error) throw error;
      toast.success("Product deleted");
      if (editing?.id === product.id) setEditing(null);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  // UI State for the new design
  const [sellingItemQuery, setSellingItemQuery] = useState("");
  const [sellingCategory, setSellingCategory] = useState("Accounts");
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [showGamePopover, setShowGamePopover] = useState(false);
  // Listings hub (P2): stock-health tabs, search, bulk selection, CSV.
  const [hubTab, setHubTab] = useState<"all" | "low" | "inactive">("all");
  const [hubQuery, setHubQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [csvBusy, setCsvBusy] = useState(false);

  const hubProducts = products.filter((p) => {
    if (hubTab === "low" && !(p.is_active !== false && (p.stock || 0) <= 3)) return false;
    if (hubTab === "inactive" && p.is_active !== false) return false;
    if (hubTab === "all" && p.is_active === false) return false;
    if (hubQuery && !String(p.title || "").toLowerCase().includes(hubQuery.toLowerCase())) return false;
    return true;
  });

  async function bulkSetActive(active: boolean) {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await db.from("products").update({ is_active: active }).eq("id", id);
    }
    toast.success(`${selectedIds.size} product(s) ${active ? "activated" : "deactivated"}`);
    setSelectedIds(new Set());
    fetchProducts();
  }

  async function downloadCsv(type: "products" | "inventory") {
    setCsvBusy(true);
    try {
      const res = await fetch(`/api/admin/products-csv?type=${type}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCsvBusy(false);
    }
  }

  async function importCsv(type: "products" | "inventory", file: File | undefined) {
    if (!file) return;
    setCsvBusy(true);
    try {
      const csv = await file.text();
      const call = async (dry_run: boolean) => {
        const res = await fetch("/api/admin/products-csv", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, csv, dry_run }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Import failed");
        return json;
      };
      const dry = await call(true);
      const errText = dry.errors?.length ? `\nFirst errors: ${dry.errors.slice(0, 3).join(" · ")}` : "";
      if (!confirm(`Dry run: ${dry.created} new, ${dry.updated} updated, ${dry.errors.length} error(s) of ${dry.total_rows} rows.${errText}\n\nApply this import?`)) {
        toast("Import cancelled after dry run");
        return;
      }
      const applied = await call(false);
      toast.success(`Import applied: ${applied.created} created, ${applied.updated} updated`);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCsvBusy(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
          db.from("products").select("*").order("created_at", { ascending: false }),
          db.from("categories").select("*").order("name", { ascending: true })
      ]);
      if (prodRes.error) throw prodRes.error;
      setProducts(prodRes.data || []);
      setDbCategories(catRes.data || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProduct() {
    if (!newProduct.title || !newProduct.price) return;
    setLoading(true);
    try {
      const variants = variantsPayload(newProduct.variants);
      const { error } = await db.from("products").insert([{
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        image: newProduct.image || null,
        stock: newProduct.use_inventory_stock ? 0 : (parseInt(newProduct.stock) || 0),
        category: newProduct.category,
        game_type: newProduct.game_type,
        description: newProduct.description || null,
        min_quantity: Math.max(1, parseInt(newProduct.min_quantity) || 1),
        delivery_eta_hours: newProduct.delivery_eta_hours === "" ? null : parseInt(newProduct.delivery_eta_hours) || null,
        fulfilment_type: newProduct.fulfilment_type,
        warranty_days: newProduct.warranty_days === "" ? null : Math.max(0, parseInt(newProduct.warranty_days) || 0) || null,
        use_inventory_stock: newProduct.use_inventory_stock,
        specs: Object.keys(newProduct.specs).length ? newProduct.specs : null,
        variants: variants.length ? variants : null,
      }]);
      if (error) throw error;
      setNewProduct({
        title: "", price: "", image: "", stock: "10", category: "Accounts", game_type: "All",
        description: "", min_quantity: "1", delivery_eta_hours: "", fulfilment_type: "manual", warranty_days: "", use_inventory_stock: false,
        specs: {}, variants: [],
      });
      setShowAddForm(false);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-[#F6F6F7]">
      {/* Header Breadcrumb */}
      <div className="px-8 py-4 flex items-center gap-2 text-slate-500 text-sm font-medium">
          <History size={16} /> Home / Create Listing
      </div>

      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Warning Banner */}
        <div className="bg-[#FFF9E6] border border-[#FDE6A6] rounded-lg p-4 flex items-start gap-4">
            <div className="bg-[#FF9800] rounded-full p-1 mt-0.5">
                <AlertCircle size={14} className="text-white" />
            </div>
            <p className="text-[14px] text-[#856404] font-medium leading-relaxed">
                Sellers are strictly prohibited from listing or offering any product or services which may violate local laws and/or regulations, more details please refer to: <span className="text-blue-500 underline cursor-pointer">Prohibition of illegal activities</span>.
            </p>
        </div>

        {/* Page Title */}
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {activeTab === 'active_offers' ? (
                <><Package className="text-[#E62E04]" size={24} /> Active Listings Hub</>
            ) : (
                <><PlusCircle className="text-[#E62E04]" size={24} /> Create New Offering</>
            )}
        </h2>

        {activeTab !== 'active_offers' && (
            <>
                {/* Section 1: Single Release/General Info */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-visible shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <SearchCode size={24} className="text-slate-400" />
                <h3 className="text-xl font-bold text-slate-900">Single Release/General Info</h3>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="space-y-4 relative">
                    <h4 className="text-[16px] font-bold text-slate-900">Selling Items</h4>
                    <p className="text-[14px] text-slate-400 font-medium">Enter product name here</p>
                    
                    <div className="flex flex-wrap items-start gap-4 max-w-4xl relative">
                        <div className="relative flex-1">
                            <div className="flex border border-slate-300 rounded overflow-hidden focus-within:border-slate-400 transition-colors">
                                <input 
                                    value={sellingItemQuery}
                                    onChange={(e) => {
                                        setSellingItemQuery(e.target.value);
                                        if (e.target.value.toLowerCase().includes("facebook")) setShowGamePopover(true);
                                        else setShowGamePopover(false);
                                    }}
                                    onFocus={() => { if(sellingItemQuery.toLowerCase().includes("facebook")) setShowGamePopover(true) }}
                                    onBlur={() => setTimeout(() => setShowGamePopover(false), 200)}
                                    placeholder="What do you want to sell?" 
                                    className="flex-1 px-4 py-3 text-[15px] text-slate-900 outline-none"
                                />
                                <div className="w-px bg-slate-300 my-2" />
                                <select 
                                    value={sellingCategory}
                                    onChange={(e) => setSellingCategory(e.target.value)}
                                    className="px-6 py-3 bg-white text-[15px] text-slate-800 outline-none cursor-pointer border-l border-slate-300 min-w-[160px]"
                                >
                                    <option>All</option>
                                    {dbCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Game Selection Popover */}
                            <AnimatePresence>
                                {showGamePopover && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute top-full left-0 mt-1 w-full max-w-[500px] bg-white rounded shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200 z-50 overflow-hidden"
                                    >
                                        <div className="p-5 border-b border-slate-100">
                                            <h5 className="font-bold text-slate-900 mb-4 text-[16px]">Facebook</h5>
                                            <div className="flex flex-wrap gap-2">
                                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-colors">
                                                    <span>🛍️</span> <span className="text-[14px] text-slate-800">Top up</span>
                                                </button>
                                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-colors">
                                                    <span>⚡</span> <span className="text-[14px] text-slate-800">Platform Engagement</span>
                                                </button>
                                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-colors shadow-sm ring-1 ring-slate-200">
                                                    <span>🔮</span> <span className="text-[14px] text-slate-800">Accounts</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-[#FFF5F5] text-center">
                                            <p className="text-[#E62E04] text-[14px]">
                                                Unable to find desired results? <span className="underline cursor-pointer">click feedback</span> to Z2U team.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="flex items-center gap-4 py-3">
                            <div className="flex flex-col">
                                <span className="text-[13px] text-slate-900">Can't find it?</span>
                                <span className="text-[14px] text-slate-900">name</span>
                            </div>
                            <button className="text-[14px] text-slate-900 hover:underline">Request for new</button>
                        </div>
                    </div>
                </div>

                {/* Integration of existing product form if shown */}
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-50 p-8 rounded-xl border border-slate-200 space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FormItem label="Product Title">
                                    <input value={newProduct.title} onChange={e=>setNewProduct({...newProduct, title:e.target.value})} className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold" />
                                </FormItem>
                                <FormItem label="Unit Price (USD)">
                                    <input value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price:e.target.value})} className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold" />
                                </FormItem>
                                <FormItem label="Category">
                                    <select value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category:e.target.value, specs: {}})} className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold">
                                        {dbCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </FormItem>
                                <FormItem label="Image URL">
                                    <input value={newProduct.image} onChange={e=>setNewProduct({...newProduct, image:e.target.value})} className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold" />
                                </FormItem>
                                <FormItem label="Min quantity per order">
                                    <input type="number" min={1} value={newProduct.min_quantity} onChange={e=>setNewProduct({...newProduct, min_quantity:e.target.value})} className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold" />
                                </FormItem>
                                <FormItem label="Delivery ETA (hours, optional)">
                                    <input type="number" min={1} value={newProduct.delivery_eta_hours} onChange={e=>setNewProduct({...newProduct, delivery_eta_hours:e.target.value})} placeholder="e.g. 24" className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold" />
                                </FormItem>
                                <FormItem label="Fulfilment Type">
                                    <select value={newProduct.fulfilment_type} onChange={e=>setNewProduct({...newProduct, fulfilment_type:e.target.value})} className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold">
                                        <option value="instant">Instant — auto-deliver from inventory</option>
                                        <option value="manual">Manual — type credentials per order</option>
                                        <option value="service">Service — buyer intake form + proof</option>
                                    </select>
                                </FormItem>
                                <FormItem label="Warranty (days, optional)">
                                    <input type="number" min={1} value={newProduct.warranty_days} onChange={e=>setNewProduct({...newProduct, warranty_days:e.target.value})} placeholder="e.g. 30" className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold" />
                                </FormItem>
                            </div>
                            <FormItem label="Description">
                                <textarea value={newProduct.description} onChange={e=>setNewProduct({...newProduct, description:e.target.value})} rows={3} className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-medium resize-none" />
                            </FormItem>
                            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded px-4 py-3">
                                <input type="checkbox" id="np-derived" checked={newProduct.use_inventory_stock} onChange={e=>setNewProduct({...newProduct, use_inventory_stock:e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-[#E62E04] focus:ring-[#E62E04]" />
                                <label htmlFor="np-derived" className="text-sm font-bold text-slate-800">Stock derived from delivery inventory</label>
                                <span className="text-[12px] text-slate-400 font-medium">— the sellable count always equals your unused inventory rows; no manual stock number.</span>
                            </div>
                            {!newProduct.use_inventory_stock && (
                                <FormItem label="Stock (manual count)">
                                    <input type="number" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct, stock:e.target.value})} className="w-full max-w-xs bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold" />
                                </FormItem>
                            )}
                            <SpecsEditor
                                schema={(dbCategories.find(c => c.name === newProduct.category)?.attribute_schema) || []}
                                value={newProduct.specs}
                                onChange={(specs) => setNewProduct({ ...newProduct, specs })}
                            />
                            <VariantsEditor
                                value={newProduct.variants}
                                onChange={(variants) => setNewProduct({ ...newProduct, variants })}
                            />
                            <div className="flex justify-end gap-4">
                                <button onClick={()=>setShowAddForm(false)} className="px-6 py-2 text-[14px] font-bold text-slate-500 hover:text-slate-900">Cancel</button>
                                <button onClick={handleAddProduct} className="bg-[#E62E04] text-white px-8 py-2 rounded font-bold text-[14px] shadow-lg shadow-red-500/20 hover:bg-[#c52804] transition-colors">Commit Asset</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold text-[14px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                    >
                        <Plus size={18} /> Initialize New Listing
                    </button>
                )}
            </div>
        </div>
            </>
        )}

        {/* Section 3: Active Listings Hub */}
        {(activeTab === 'active_offers' || activeTab === 'products') && (
            <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-xl font-bold text-slate-900">Active Listings Hub</h3>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <input value={hubQuery} onChange={(e) => setHubQuery(e.target.value)} placeholder="Search listings..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-red-400 outline-none" />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    </div>
                    <button onClick={() => downloadCsv("products")} disabled={csvBusy} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2">
                        <Download size={13} /> Offers CSV
                    </button>
                    <button onClick={() => downloadCsv("inventory")} disabled={csvBusy} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2">
                        <Download size={13} /> Inventory CSV
                    </button>
                    <label className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                        <Upload size={13} /> Import offers
                        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { importCsv("products", e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                    <label className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                        <Upload size={13} /> Import inventory
                        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { importCsv("inventory", e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                </div>
            </div>

            {/* Stock-health tabs + bulk actions */}
            <div className="flex items-center gap-2 flex-wrap">
                {([
                  ["all", `All active (${products.filter(p => p.is_active !== false).length})`],
                  ["low", `Low stock ≤3 (${products.filter(p => p.is_active !== false && (p.stock || 0) <= 3).length})`],
                  ["inactive", `Inactive (${products.filter(p => p.is_active === false).length})`],
                ] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setHubTab(id)} className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${hubTab === id ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                    {label}
                  </button>
                ))}
                {selectedIds.size > 0 && (
                  <span className="flex items-center gap-2 ml-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{selectedIds.size} selected</span>
                    <button onClick={() => bulkSetActive(true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Activate</button>
                    <button onClick={() => bulkSetActive(false)} className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Deactivate</button>
                  </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-24 text-center">
                        <Loader2 className="animate-spin mx-auto text-[#E62E04] mb-4" size={40} />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing with Registry...</p>
                    </div>
                ) : hubProducts.length === 0 ? (
                    <div className="col-span-full py-32 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <Package className="mx-auto text-slate-200 mb-4" size={64} />
                        <h4 className="text-xl font-black text-slate-900 uppercase italic">No Listings Here</h4>
                        <p className="text-slate-400 mt-2 mb-8 font-medium">Nothing matches this stock-health view.</p>
                    </div>
                ) : hubProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      selected={selectedIds.has(product.id)}
                      onToggleSelect={() => {
                        const s = new Set(selectedIds);
                        if (s.has(product.id)) s.delete(product.id); else s.add(product.id);
                        setSelectedIds(s);
                      }}
                      onEdit={() => setEditing({
                        ...product,
                        delivery_eta_hours: product.delivery_eta_hours ?? "",
                        min_quantity: product.min_quantity ?? 1,
                        specs: product.specs || {},
                        variants: Array.isArray(product.variants)
                          ? product.variants.map((v: any) => ({ label: v.label, priceDelta: String(v.priceDelta ?? 0), stock: v.stock == null ? "" : String(v.stock) }))
                          : [],
                      })}
                      onDelete={() => handleDeleteProduct(product)}
                      onSaved={fetchProducts}
                    />
                ))}
            </div>

            {editing && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-900">Edit product — {editing.title}</h4>
                        <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-900"><XCircle size={20} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormItem label="Title"><input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" /></FormItem>
                        <FormItem label="Category"><input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" /></FormItem>
                        <FormItem label="Price (USD)"><input type="number" step="0.01" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" /></FormItem>
                        <FormItem label={editing.use_inventory_stock ? "Stock (derived from inventory)" : "Stock (manual count)"}>
                            <input type="number" value={editing.stock ?? 0} disabled={!!editing.use_inventory_stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400 disabled:bg-slate-50 disabled:text-slate-400" />
                            {editing.use_inventory_stock && <p className="text-[11px] text-slate-400 font-medium mt-1">Single source of truth: unused inventory rows minus unpaid reservations. Manage stock in the inventory list below.</p>}
                        </FormItem>
                        <FormItem label="Badge"><input value={editing.badge || ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" /></FormItem>
                        <FormItem label="Image URL"><input value={editing.image || ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" /></FormItem>
                        <FormItem label="Min quantity per order"><input type="number" min={1} value={editing.min_quantity ?? 1} onChange={(e) => setEditing({ ...editing, min_quantity: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" /></FormItem>
                        <FormItem label="Delivery ETA (hours, blank = none)"><input type="number" min={1} value={editing.delivery_eta_hours ?? ""} onChange={(e) => setEditing({ ...editing, delivery_eta_hours: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" /></FormItem>
                        <FormItem label="Fulfilment Type">
                            <select value={editing.fulfilment_type || "manual"} onChange={(e) => setEditing({ ...editing, fulfilment_type: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400">
                                <option value="instant">Instant — auto-deliver from inventory</option>
                                <option value="manual">Manual — type credentials per order</option>
                                <option value="service">Service — buyer intake form + proof</option>
                            </select>
                        </FormItem>
                        <FormItem label="Warranty (days, blank = none)"><input type="number" min={1} value={editing.warranty_days ?? ""} onChange={(e) => setEditing({ ...editing, warranty_days: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" /></FormItem>
                    </div>
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-[#E62E04] focus:ring-[#E62E04]" />
                            <span className="text-sm font-bold text-slate-800">Active on the storefront</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!!editing.use_inventory_stock} onChange={(e) => setEditing({ ...editing, use_inventory_stock: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-[#E62E04] focus:ring-[#E62E04]" />
                            <span className="text-sm font-bold text-slate-800">Stock derived from inventory</span>
                        </label>
                    </div>
                    <FormItem label="Description"><textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-red-400 resize-none" /></FormItem>
                    <SpecsEditor
                        schema={(dbCategories.find(c => c.name === editing.category)?.attribute_schema) || []}
                        value={editing.specs || {}}
                        onChange={(specs) => setEditing({ ...editing, specs })}
                    />
                    <VariantsEditor
                        value={Array.isArray(editing.variants) ? editing.variants : []}
                        onChange={(variants) => setEditing({ ...editing, variants })}
                    />
                    <div className="flex gap-3">
                        <button onClick={handleUpdateProduct} disabled={loading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">Save Changes</button>
                        <button onClick={() => handleDeleteProduct(editing)} className="px-8 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-red-50 transition-all">Delete Product</button>
                    </div>
                    <InventoryManager productId={editing.id} />
                </div>
            )}
            </div>
        )}
      </div>
    </div>
  );
}

function FormItem({ label, children }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            {children}
        </div>
    );
}

function ProductCard({ product, onEdit, onDelete, selected, onToggleSelect, onSaved }: any) {
    const [priceDraft, setPriceDraft] = useState<string | null>(null);
    const [savingPrice, setSavingPrice] = useState(false);
    const inactive = product.is_active === false;

    async function savePrice() {
      if (priceDraft === null) return;
      const value = parseFloat(priceDraft);
      if (!Number.isFinite(value) || value < 0) { toast.error("Enter a valid price"); return; }
      setSavingPrice(true);
      try {
        const { error } = await db.from("products").update({ price: value }).eq("id", product.id);
        if (error) throw error;
        toast.success("Price updated");
        setPriceDraft(null);
        onSaved?.();
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setSavingPrice(false);
      }
    }

    return (
        <div className={`bg-white border rounded-xl overflow-hidden shadow-sm group transition-all duration-300 ${selected ? "border-[#E62E04] ring-2 ring-red-100" : "border-slate-200 hover:border-[#E62E04]"} ${inactive ? "opacity-70" : ""}`}>
            <div className="h-48 overflow-hidden relative">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <label className="absolute top-3 left-3 bg-white/95 rounded-lg p-1.5 shadow border border-slate-100 cursor-pointer" title="Select for bulk actions">
                    <input type="checkbox" checked={!!selected} onChange={onToggleSelect} className="w-4 h-4 block" />
                </label>
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="bg-white p-2 rounded-lg text-slate-600 hover:text-[#E62E04] shadow-xl border border-slate-100"><Edit size={16} /></button>
                    <button onClick={onDelete} className="bg-white p-2 rounded-lg text-slate-600 hover:text-red-600 shadow-xl border border-slate-100"><Trash2 size={16} /></button>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[12px] font-black uppercase tracking-widest text-slate-900 border border-white/20">
                        {product.category}
                    </span>
                    {inactive && (
                        <span className="px-3 py-1 bg-slate-900/90 rounded-lg text-[12px] font-black uppercase tracking-widest text-white">Inactive</span>
                    )}
                    {product.use_inventory_stock && (
                        <span className="px-3 py-1 bg-[#0C2254]/90 rounded-lg text-[12px] font-black uppercase tracking-widest text-white">Derived stock</span>
                    )}
                    <span className={`px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-widest text-white ${product.fulfilment_type === "service" ? "bg-[#F4751F]/90" : product.fulfilment_type === "instant" ? "bg-emerald-600/90" : "bg-slate-500/90"}`}>
                        {product.fulfilment_type === "service" ? "Service" : product.fulfilment_type === "instant" ? "Instant" : "Manual"}
                    </span>
                    {product.warranty_days ? (
                        <span className="px-3 py-1 bg-white/90 rounded-lg text-[12px] font-black uppercase tracking-widest text-emerald-700">{product.warranty_days}-day warranty</span>
                    ) : null}
                </div>
            </div>
            <div className="p-5 space-y-4">
                <div className="min-h-[48px]">
                    <h4 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">{product.title}</h4>
                </div>
                <div className="flex items-end justify-between gap-3">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing (USD)</p>
                        {priceDraft === null ? (
                            <button onClick={() => setPriceDraft(String(product.price ?? ""))} className="text-xl font-black text-[#E62E04] tracking-tight hover:underline" title="Click to edit price">
                                {Number(product.price).toFixed(2)}
                            </button>
                        ) : (
                            <span className="flex items-center gap-1.5 mt-0.5">
                                <input type="number" step="0.01" autoFocus value={priceDraft} onChange={(e) => setPriceDraft(e.target.value)} className="w-24 border border-slate-300 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-red-400" />
                                <button onClick={savePrice} disabled={savingPrice} className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">Save</button>
                                <button onClick={() => setPriceDraft(null)} className="px-2 py-1 text-slate-400 text-[10px] font-black uppercase">Cancel</button>
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory</p>
                        <p className={`text-sm font-black ${(product.stock || 0) <= 3 ? "text-red-500" : "text-slate-900"}`}>{product.stock || 0} PCS</p>
                    </div>
                </div>
                <button onClick={onEdit} className="w-full py-2.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[13px] font-black uppercase tracking-[0.1em] group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                    Edit · Stock · Credentials
                </button>
            </div>
        </div>
    );
}

// ── Specs editor (P2): values for the category's attribute schema ──
function SpecsEditor({ schema, value, onChange }: { schema: any[]; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  if (!Array.isArray(schema) || schema.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h5 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Specifications (from the category schema)</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schema.map((f: any) => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
            {f.type === "select" && Array.isArray(f.options) ? (
              <select value={value[f.key] || ""} onChange={(e) => onChange({ ...value, [f.key]: e.target.value })} className="w-full bg-white border border-slate-300 rounded px-3 py-2.5 text-sm font-bold">
                <option value="">—</option>
                {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "boolean" ? (
              <select value={value[f.key] || ""} onChange={(e) => onChange({ ...value, [f.key]: e.target.value })} className="w-full bg-white border border-slate-300 rounded px-3 py-2.5 text-sm font-bold">
                <option value="">—</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            ) : (
              <input type={f.type === "number" ? "number" : "text"} value={value[f.key] || ""} onChange={(e) => onChange({ ...value, [f.key]: e.target.value })} className="w-full bg-white border border-slate-300 rounded px-3 py-2.5 text-sm font-bold" />
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 font-medium">Filled values appear as the spec list on the product page. Define the fields in Categories → Specification Attributes.</p>
    </div>
  );
}

// ── Variants editor (P2): the working form of Z2U's "Custom Programs" ──
function VariantsEditor({ value, onChange }: { value: { label: string; priceDelta: string; stock: string }[]; onChange: (v: { label: string; priceDelta: string; stock: string }[]) => void }) {
  const set = (i: number, patch: Partial<{ label: string; priceDelta: string; stock: string }>) => {
    const arr = [...value];
    arr[i] = { ...arr[i], ...patch };
    onChange(arr);
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Variants (Custom Programs)</h5>
        <button type="button" onClick={() => onChange([...value, { label: "", priceDelta: "0", stock: "" }])} className="text-[11px] font-black text-[#E62E04] uppercase tracking-widest hover:underline flex items-center gap-1">
          <Plus size={12} /> Add variant
        </button>
      </div>
      {value.length === 0 ? (
        <p className="text-[12px] text-slate-400 font-medium">No variants — buyers purchase the base offer. Add one to offer e.g. “1 Month / 3 Months” options with their own price difference and stock.</p>
      ) : (
        <div className="space-y-2">
          {value.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={v.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="Label (e.g. 3 Months)" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm font-bold" />
              <input type="number" step="0.01" value={v.priceDelta} onChange={(e) => set(i, { priceDelta: e.target.value })} placeholder="+$ delta" title="Price difference vs base price (can be negative)" className="w-28 border border-slate-300 rounded px-3 py-2 text-sm font-bold" />
              <input type="number" value={v.stock} onChange={(e) => set(i, { stock: e.target.value })} placeholder="Stock (blank = shared)" title="Variant stock; leave blank to share the product stock" className="w-36 border border-slate-300 rounded px-3 py-2 text-sm font-bold" />
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Inventory (auto-delivery stock) ─────────────────────────────
// Each row is ONE deliverable account. When a payment is verified the
// order service assigns the oldest available row, writes its credentials
// into the order's vault fields and marks the row assigned.
function InventoryManager({ productId }: { productId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");
  const [twoFactor, setTwoFactor] = useState("");
  const [recovery, setRecovery] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await db.from("inventory").select("*").eq("product_id", productId).order("created_at", { ascending: false });
    setItems(data || []);
  }
  useEffect(() => { load(); }, [productId]);

  async function addItem() {
    if (!login.trim() || !password.trim()) { toast.error("Login and password are required"); return; }
    setBusy(true);
    try {
      const { error } = await db.from("inventory").insert({
        product_id: productId,
        account_login: login.trim(),
        account_password: password,
        additional_info: info.trim() || null,
        two_factor_secret: twoFactor.trim() || null,
        recovery_email: recovery.trim() || null,
        status: "available",
      });
      if (error) throw error;
      setLogin(""); setPassword(""); setInfo(""); setTwoFactor(""); setRecovery("");
      toast.success("Inventory item added — it will auto-deliver on the next verified payment.");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: any) {
    if (item.status !== "available") { toast.error("Only unused (available) items can be removed"); return; }
    if (!confirm("Remove this unused credential from inventory?")) return;
    const { error } = await db.from("inventory").delete().eq("id", item.id);
    if (error) toast.error(error.message); else load();
  }

  const counts = items.reduce((acc: any, i: any) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {});

  return (
    <div className="border-t border-slate-100 pt-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Delivery Inventory (auto-delivery stock)</h5>
        <span className="text-[11px] font-bold text-slate-400">
          {counts.available || 0} available · {counts.assigned || 0} assigned · {counts.used || 0} used · {counts.flagged || 0} flagged
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Account login / email" className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Account password" className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" />
        <input value={info} onChange={(e) => setInfo(e.target.value)} placeholder="Notes (optional)" className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" />
        <input value={twoFactor} onChange={(e) => setTwoFactor(e.target.value)} placeholder="2FA secret (optional, base32)" className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" />
        <input value={recovery} onChange={(e) => setRecovery(e.target.value)} placeholder="Recovery email (optional)" className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-400" />
      </div>
      <button onClick={addItem} disabled={busy} className="px-6 py-3 bg-[#0C2254] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
        <Plus size={14} /> Add Credential to Inventory
      </button>
      <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
        {items.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400 font-medium">No inventory yet — orders for this product will need manual delivery until stock is added.</p>
        ) : items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-5 py-3 bg-white">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${item.status === "available" ? "bg-emerald-50 text-emerald-600" : item.status === "assigned" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{item.status}</span>
            <span className="text-sm font-bold text-slate-800 truncate flex-1">{item.account_login}</span>
            {item.two_factor_secret && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-100 shrink-0">2FA</span>
            )}
            {item.recovery_email && (
              <span className="text-[11px] text-slate-400 font-medium hidden lg:block shrink-0">{item.recovery_email}</span>
            )}
            <span className="text-[11px] text-slate-400 font-medium hidden md:block">{item.order_id ? `Order #${String(item.order_id).slice(0, 8).toUpperCase()}` : "—"}</span>
            {item.status === "available" && (
              <button onClick={() => removeItem(item)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
