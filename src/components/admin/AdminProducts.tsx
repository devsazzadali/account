import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Filter, Zap, Loader2 } from "lucide-react";
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
    category: "Accounts"
  });

  useEffect(() => {
    fetchProducts();
  }, []);

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
        const { error } = await supabase.from('products').insert({
            title: newProduct.title,
            price: parseFloat(newProduct.price),
            image: newProduct.image || "https://picsum.photos/seed/new/200/200",
            stock: parseInt(newProduct.stock),
            category: newProduct.category
        });
        if (error) throw error;
        setShowAddForm(false);
        setNewProduct({ title: "", price: "", image: "", stock: "10", category: "Accounts" });
        fetchProducts();
    } catch (err: any) {
        alert("Deployment Failed: " + err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to decommission this asset?")) return;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
        alert("Error deleting asset: " + err.message);
    }
  }

  return (
    <div className="space-y-8">
      {/* Add Product Modal/Form */}
      {showAddForm && (
        <div className="bg-white rounded-[2rem] border border-primary-200 p-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">New Asset Deployment</h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-900">Cancel</button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Title</label>
                    <input 
                        required
                        type="text" 
                        value={newProduct.title}
                        onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                        placeholder="e.g. Netflix Premium Lifetime"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-primary-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Valuation ($)</label>
                    <input 
                        required
                        type="number" 
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-primary-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Image URL</label>
                    <input 
                        type="text" 
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-primary-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Units</label>
                    <input 
                        type="number" 
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-primary-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="md:col-span-2">
                    <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 transition-all uppercase tracking-[0.2em] text-xs">
                        Finalize Deployment
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Asset Inventory</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Manage your premium digital listings</p>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={fetchProducts} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Filter size={18} />}
                </button>
                <button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-[1.02] active:scale-[0.98] text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-primary-500/20"
                >
                    <Plus size={16} />
                    Deploy Asset
                </button>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            {loading ? (
                <div className="p-20 text-center">
                    <Loader2 size={48} className="animate-spin text-primary-500 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Accessing Secure Vault...</p>
                </div>
            ) : (
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100">
                    <tr>
                        <th className="px-8 py-5">Digital Asset</th>
                        <th className="px-8 py-5">Market Valuation</th>
                        <th className="px-8 py-5">Inventory Status</th>
                        <th className="px-8 py-5">Deployment</th>
                        <th className="px-8 py-5 text-right">Operations</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {products.map((product, i) => (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform overflow-hidden shadow-sm border border-slate-200">
                                        <img src={product.image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <span className="font-bold text-slate-900 text-xs">{product.title}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5 font-bold text-slate-900 text-xs">${Number(product.price).toFixed(2)}</td>
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500">{product.stock}U</span>
                                    <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${product.stock > 10 ? "bg-primary-500" : product.stock > 0 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(product.stock * 2, 100)}%` }}></div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                product.stock > 0 ? "bg-primary-50 text-primary-600 border-primary-100" : "bg-red-50 text-red-600 border-red-100"
                                }`}>
                                {product.stock > 0 ? "Active" : "Depleted"}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all shadow-sm"><Edit size={14} /></button>
                                    <button 
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
}
