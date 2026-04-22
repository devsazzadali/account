import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Filter, Zap, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/2">
        <div>
            <h3 className="text-xl font-bold text-white mb-1">Asset Inventory</h3>
            <p className="text-[10px] text-dark-50/30 uppercase tracking-widest font-bold">Manage your premium digital listings</p>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={fetchProducts} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-dark-50/40 hover:text-white transition-all">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Filter size={18} />}
            </button>
            <button className="bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-[1.02] active:scale-[0.98] text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-primary-500/20">
                <Plus size={16} />
                Deploy Asset
            </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
            <div className="p-20 text-center">
                <Loader2 size={48} className="animate-spin text-primary-500 mx-auto mb-4 opacity-20" />
                <p className="text-dark-50/30 text-[10px] font-bold uppercase tracking-widest">Accessing Secure Vault...</p>
            </div>
        ) : (
            <table className="w-full text-left">
                <thead className="bg-dark-900/50 text-dark-50/20 text-[9px] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                    <th className="px-8 py-5">Digital Asset</th>
                    <th className="px-8 py-5">Market Valuation</th>
                    <th className="px-8 py-5">Inventory Status</th>
                    <th className="px-8 py-5">Deployment</th>
                    <th className="px-8 py-5 text-right">Operations</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                {products.map((product, i) => (
                    <tr key={product.id} className="hover:bg-white/2 transition-colors group">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform overflow-hidden">
                                    <img src={product.image} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-bold text-white text-xs">{product.title}</span>
                            </div>
                        </td>
                        <td className="px-8 py-5 font-bold text-white text-xs">${Number(product.price).toFixed(2)}</td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-dark-50/60">{product.stock}U</span>
                                <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${product.stock > 10 ? "bg-primary-500" : product.stock > 0 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(product.stock * 2, 100)}%` }}></div>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                            product.stock > 0 ? "bg-primary-500/10 text-primary-400 border-primary-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                            {product.stock > 0 ? "Active" : "Depleted"}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button className="p-2 text-dark-50/20 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all"><Edit size={14} /></button>
                                <button 
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 text-dark-50/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
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
  );
}
