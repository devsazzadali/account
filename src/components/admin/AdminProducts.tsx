import React, { useEffect, useState } from "react";
import { 
  Plus, 
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
import { supabase } from "../../lib/supabase";

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    image: "",
    stock: "10",
    category: "Accounts",
    game_type: "All"
  });

  // UI State for the new design
  const [sellingItemQuery, setSellingItemQuery] = useState("");
  const [sellingCategory, setSellingCategory] = useState("Accounts");
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [showGamePopover, setShowGamePopover] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
          supabase.from("products").select("*").order("created_at", { ascending: false }),
          supabase.from("categories").select("*").order("name", { ascending: true })
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
      const { error } = await supabase.from("products").insert([newProduct]);
      if (error) throw error;
      setNewProduct({ title: "", price: "", image: "", stock: "10", category: "Accounts", game_type: "All" });
      setShowAddForm(false);
      fetchProducts();
    } catch (e: any) {
      alert(e.message);
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

      <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
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
        <h2 className="text-2xl font-bold text-slate-900">Create Listing</h2>

        {/* Section 1: Single Release/General Info */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-visible shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <SearchCode size={24} className="text-slate-400" />
                <h3 className="text-xl font-bold text-slate-900">Single Release/General Info</h3>
            </div>
            
            <div className="p-10 space-y-8">
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
                                    <select value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category:e.target.value})} className="w-full bg-white border border-slate-300 rounded px-4 py-2.5 text-sm font-bold">
                                        {dbCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </FormItem>
                            </div>
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

        {/* Section: Product Types (From Screenshot 1) */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <FileText size={24} className="text-slate-400" />
                <h3 className="text-xl font-bold text-slate-900">Product Types</h3>
            </div>
            
            <div className="p-10 space-y-8 max-w-3xl">
                {/* Attribute */}
                <div className="flex items-start gap-4">
                    <div className="w-40 pt-2 text-[15px] text-slate-800 flex items-center gap-1">
                        Attribute <span className="text-red-500">*</span> <HelpCircle size={14} className="text-slate-900 cursor-help" />
                    </div>
                    <div className="flex-1 flex gap-8 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name="attr" className="w-4 h-4 text-[#E62E04] border-slate-300 focus:ring-[#E62E04]" defaultChecked />
                            <span className="text-[15px] text-slate-800 group-hover:text-slate-900">Account Ownership Transfer</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name="attr" className="w-4 h-4 text-[#E62E04] border-slate-300 focus:ring-[#E62E04]" />
                            <span className="text-[15px] text-slate-800 group-hover:text-slate-900">Account Usage Rental</span>
                        </label>
                    </div>
                </div>

                {/* Platform */}
                <div className="flex items-center gap-4">
                    <div className="w-40 text-[15px] text-slate-800">
                        Platform<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                        <select className="w-full border border-slate-300 rounded px-4 py-3 text-[15px] text-slate-800 outline-none focus:border-red-400 transition-colors bg-white">
                            <option>Please Select</option>
                            <option>PC</option>
                            <option>Mobile</option>
                            <option>Console</option>
                        </select>
                    </div>
                </div>

                {/* Device */}
                <div className="flex items-center gap-4">
                    <div className="w-40 text-[15px] text-slate-800">
                        Device<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                        <select className="w-full border border-slate-300 rounded px-4 py-3 text-[15px] text-slate-800 outline-none focus:border-red-400 transition-colors bg-white">
                            <option>Please Select</option>
                            <option>Android</option>
                            <option>iOS</option>
                            <option>Global</option>
                        </select>
                    </div>
                </div>

                {/* Area */}
                <div className="flex items-center gap-4">
                    <div className="w-40 text-[15px] text-slate-800">
                        Area<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                        <select className="w-full border border-slate-300 rounded px-4 py-3 text-[15px] text-slate-800 outline-none focus:border-red-400 transition-colors bg-white">
                            <option>Please Select</option>
                            <option>North America</option>
                            <option>Europe</option>
                            <option>Asia</option>
                            <option>Global</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {/* Section: Game Details */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-8 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <CheckCircle2 size={24} className="text-slate-400" />
                <h3 className="text-xl font-bold text-slate-900">Game details</h3>
            </div>
            
            <div className="p-8 space-y-8 bg-slate-50/50">
                <div className="border border-slate-300 rounded overflow-hidden shadow-sm">
                    <div className="bg-[#333333] px-5 py-3 flex justify-between items-center text-white">
                        <span className="text-[14px] font-bold tracking-wide">Custom Program 1</span>
                        <div className="flex gap-4 items-center">
                            <ChevronRight className="-rotate-90 cursor-pointer text-slate-400 hover:text-white transition-colors" size={18} />
                            <Trash2 className="cursor-pointer text-slate-400 hover:text-red-400 transition-colors" size={16} />
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-8 bg-white">
                        {/* Title */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="w-40 text-[15px] font-medium text-slate-800">Title</div>
                            <input placeholder="Title" className="flex-1 border border-slate-300 rounded px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#E62E04] transition-colors" />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                            <div className="w-40 pt-2 text-[15px] font-medium text-slate-800">Discription</div>
                            <textarea placeholder="Discription" rows={5} className="flex-1 border border-slate-300 rounded px-4 py-3 text-[14px] text-slate-800 outline-none focus:border-[#E62E04] transition-colors resize-y" />
                        </div>

                        {/* Add Image */}
                        <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                            <div className="w-40 pt-2 text-[15px] font-medium text-slate-800">Add Image</div>
                            <div className="flex-1 space-y-3">
                                <div className="flex gap-4">
                                    <input placeholder="Enter image URL" className="flex-1 border border-slate-300 rounded px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#E62E04] transition-colors" />
                                    <button className="bg-[#E62E04] text-white px-6 py-2.5 rounded font-bold text-[14px] hover:bg-[#c52804] transition-colors shadow-sm whitespace-nowrap">Add Image</button>
                                </div>
                                <p className="text-[14px] text-slate-800">
                                    Third-party image hosting sites are supported. Please see <span className="text-[#E62E04] cursor-pointer hover:underline">list of supported domains and accepted URL format.</span>
                                </p>
                            </div>
                        </div>

                        <hr className="border-slate-100 my-8" />

                        {/* Pricing Grid */}
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-1.5 flex-1 min-w-[120px]">
                                <label className="text-[12px] font-bold text-slate-700">Currency</label>
                                <select className="w-full border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#E62E04] bg-white">
                                    <option>USD</option>
                                </select>
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-[120px]">
                                <label className="text-[12px] font-bold text-slate-700">Price Per Unit</label>
                                <input className="w-full border border-slate-300 rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#E62E04]" />
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-[120px]">
                                <label className="text-[12px] font-bold text-slate-700">Min Unit Per Order</label>
                                <input className="w-full border border-slate-300 rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#E62E04]" />
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-[120px]">
                                <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Stock <HelpCircle size={12} className="text-slate-400" /></label>
                                <input className="w-full border border-slate-300 rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#E62E04]" />
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-[120px]">
                                <label className="text-[12px] font-bold text-slate-700">Require Integer</label>
                                <select className="w-full border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#E62E04] bg-white">
                                    <option>No</option>
                                    <option>Yes</option>
                                </select>
                            </div>
                            <button className="bg-slate-200 text-slate-700 px-5 py-2.5 rounded text-[14px] font-medium hover:bg-slate-300 transition-colors h-[42px]">
                                More information ...
                            </button>
                        </div>

                        <hr className="border-slate-100 my-8" />

                        {/* Product Specification */}
                        <div className="space-y-6">
                            <h4 className="text-[16px] font-bold text-slate-900">Product Specification</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {/* Col 1 */}
                                <div className="flex flex-col md:flex-row md:items-start gap-2">
                                    <div className="w-32 pt-2 text-[14px] text-slate-700 leading-tight">Registration time</div>
                                    <div className="flex-1 space-y-2">
                                        <input defaultValue="2000-12-31" className="w-full border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#E62E04]" />
                                        <p className="text-[12px] text-[#E62E04] flex items-start gap-1 font-medium">
                                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                            If when you are not sure of the exact time, you can choose the last day of the year, such as 2000-12-31
                                        </p>
                                    </div>
                                </div>
                                {/* Col 2 */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <div className="w-32 text-[14px] text-slate-700 leading-tight">Registered Country</div>
                                    <select className="flex-1 border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-400 outline-none focus:border-[#E62E04] bg-white">
                                        <option>Please Select</option>
                                    </select>
                                </div>
                                {/* Col 1 */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <div className="w-32 text-[14px] text-slate-700 font-medium">FRIENDS</div>
                                    <input className="flex-1 border border-slate-300 rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#E62E04]" />
                                </div>
                                {/* Col 2 */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <div className="w-32 text-[14px] text-slate-700 font-medium">FOLLOWERS</div>
                                    <input className="flex-1 border border-slate-300 rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#E62E04]" />
                                </div>
                                {/* Col 1 */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <div className="w-32 text-[14px] text-slate-700 font-medium">Marketplace</div>
                                    <select className="flex-1 border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-400 outline-none focus:border-[#E62E04] bg-white">
                                        <option>Please Select</option>
                                    </select>
                                </div>
                                {/* Col 2 */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <div className="w-32 text-[14px] text-slate-700 font-medium leading-tight">Two-Factor Authentication</div>
                                    <select className="flex-1 border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-400 outline-none focus:border-[#E62E04] bg-white">
                                        <option>Please Select</option>
                                    </select>
                                </div>
                                {/* Col 1 */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <div className="w-32 text-[14px] text-slate-700 font-medium leading-tight">Business Manager</div>
                                    <select className="flex-1 border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-400 outline-none focus:border-[#E62E04] bg-white">
                                        <option>Please Select</option>
                                    </select>
                                </div>
                                {/* Col 2 */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <div className="w-32 text-[14px] text-slate-700 font-medium leading-tight">Full Access</div>
                                    <select className="flex-1 border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-400 outline-none focus:border-[#E62E04] bg-white">
                                        <option>Please Select</option>
                                    </select>
                                </div>
                                {/* Col 1 */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <div className="w-32 text-[14px] text-slate-700 font-medium leading-tight">Can modify account information</div>
                                    <select className="flex-1 border border-slate-300 rounded px-3 py-2.5 text-[14px] text-slate-400 outline-none focus:border-[#E62E04] bg-white">
                                        <option>Please Select</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                
                <button className="bg-[#E62E04] text-white px-5 py-2.5 rounded font-bold text-[14px] flex items-center gap-2 hover:bg-[#c52804] transition-colors shadow-sm">
                    <Plus size={16} /> Add Custom Program
                </button>
            </div>
        </div>

        {/* Section: Product Expiration & Delivery Option */}
        <div className="space-y-8 mt-8">
            {/* Expiration Date */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <History size={24} className="text-slate-400" />
                    <h3 className="text-xl font-bold text-slate-900">Product Expiration Date</h3>
                </div>
                <div className="p-8 flex gap-4 bg-slate-50/30">
                    <button className="border border-slate-300 rounded px-8 py-2.5 text-[14px] font-medium text-slate-700 hover:border-[#E62E04] hover:text-[#E62E04] transition-colors bg-white">7Days</button>
                    <button className="border border-slate-300 rounded px-8 py-2.5 text-[14px] font-medium text-slate-700 hover:border-[#E62E04] hover:text-[#E62E04] transition-colors bg-white">15Days</button>
                    <button className="border border-slate-300 rounded px-8 py-2.5 text-[14px] font-medium text-slate-700 hover:border-[#E62E04] hover:text-[#E62E04] transition-colors bg-white">30Days</button>
                </div>
            </div>

            {/* Delivery Option */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <Package size={24} className="text-slate-400" />
                    <h3 className="text-xl font-bold text-slate-900">Delivery Option</h3>
                </div>
                <div className="p-8 space-y-6 max-w-4xl bg-slate-50/30">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="w-40 pt-2 text-[14px] font-bold text-slate-800 uppercase tracking-wide">
                            DELIVERY ETA <span className="text-[#E62E04]">*</span>
                        </div>
                        <div className="flex-1 space-y-3">
                            <select className="w-full border border-[#E62E04] rounded px-4 py-3 text-[14px] text-slate-400 outline-none shadow-[0_0_0_1px_rgba(230,46,4,0.1)] bg-white">
                                <option>Nothing selected</option>
                            </select>
                            <p className="text-[13px] text-[#E62E04] flex items-start gap-1 font-medium leading-relaxed">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                Please select a reasonable delivery time according to the actual situation to ensure that the order is shipped on time. If the order is not shipped according to the selected delivery time, it may affect the delivery time of the order, causing customer dissatisfaction or order delays.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                        <div className="w-40 hidden md:block"></div>
                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#E62E04] focus:ring-[#E62E04]" />
                            <span className="text-[14px] text-slate-800 font-medium">Order Delivery</span>
                        </label>
                    </div>
                    
                    <div className="text-right pt-4">
                        <p className="text-[14px] text-[#E62E04] font-bold cursor-pointer hover:underline transition-all">
                            No available trading methods? Apply to add
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Section: Publish Time */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-8 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <SearchCode size={24} className="text-slate-400" />
                <h3 className="text-xl font-bold text-slate-900">Publish Time</h3>
            </div>
            <div className="p-8 flex gap-4 bg-slate-50/30">
                <button className="relative border-2 border-[#E62E04] rounded px-8 py-2.5 text-[14px] text-[#E62E04] font-medium bg-white">
                    Publish Immediately
                    <div className="absolute -top-2 -right-2 bg-[#E62E04] text-white rounded p-0.5">
                        <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                </button>
                <button className="border border-slate-300 rounded px-8 py-2.5 text-[14px] text-slate-700 font-medium bg-white hover:border-slate-400 flex items-center gap-1.5 transition-colors">
                    Pending Publish <HelpCircle size={14} className="text-slate-400" />
                </button>
            </div>
        </div>

        {/* Submit Block */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-8 p-12 flex flex-col items-center justify-center space-y-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#E62E04] focus:ring-[#E62E04] mt-0.5" />
                <span className="text-[14px] text-slate-800">
                    I have read and agreed to all sellers policy and the <span className="text-[#E62E04] hover:underline cursor-pointer">Terms of service</span>
                </span>
            </label>
            <button className="bg-[#E4E4E4] text-white px-16 py-3 rounded font-bold text-[15px] cursor-not-allowed transition-colors">
                Submit
            </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <LayoutGrid size={24} className="text-slate-400" />
                <h3 className="text-xl font-bold text-slate-900">Batch Release Products</h3>
            </div>
            <div className="p-10 flex gap-4">
                <button className="bg-[#E62E04] text-white px-10 py-3 rounded font-bold text-[14px] flex items-center gap-3 shadow-lg shadow-red-500/10 hover:bg-[#c52804] transition-all">
                    <Upload size={18} /> Upload List
                </button>
                <button className="bg-[#4CAF50] text-white px-10 py-3 rounded font-bold text-[14px] flex items-center gap-3 shadow-lg shadow-green-500/10 hover:bg-[#3d8b40] transition-all">
                    <Download size={18} /> Download List
                </button>
            </div>
        </div>

        {/* Section 3: Active Listings Hub */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Active Listings Hub</h3>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input placeholder="Search listings..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-red-400 outline-none" />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#E62E04]" /></div>
                ) : products.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-medium">No active listings found.</div>
                ) : products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
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

function ProductCard({ product }: { product: any }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group hover:border-[#E62E04] transition-all duration-300">
            <div className="h-48 overflow-hidden relative">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white p-2 rounded-lg text-slate-600 hover:text-[#E62E04] shadow-xl border border-slate-100"><Edit size={16} /></button>
                    <button className="bg-white p-2 rounded-lg text-slate-600 hover:text-red-600 shadow-xl border border-slate-100"><Trash2 size={16} /></button>
                </div>
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[12px] font-black uppercase tracking-widest text-slate-900 border border-white/20">
                    {product.category}
                </div>
            </div>
            <div className="p-5 space-y-4">
                <div className="min-h-[48px]">
                    <h4 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">{product.title}</h4>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing</p>
                        <p className="text-xl font-black text-[#E62E04] tracking-tight">USD {Number(product.price).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory</p>
                        <p className="text-sm font-black text-slate-900">{product.stock || 0} PCS</p>
                    </div>
                </div>
                <button className="w-full py-2.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[13px] font-black uppercase tracking-[0.1em] group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                    View Analytics
                </button>
            </div>
        </div>
    );
}
