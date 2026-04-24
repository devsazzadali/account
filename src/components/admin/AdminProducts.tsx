import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Filter, Zap, Loader2, Search } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
          <div>
              <h2 className="text-xl font-bold text-slate-900">Products</h2>
              <p className="text-[13px] text-slate-500 font-medium">Manage your store's digital assets and inventory.</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            {showAddForm ? "Cancel" : "Add product"}
          </button>
      </div>

      {/* Add Product Form - Integrated */}
      <AnimatePresence>
          {showAddForm && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-tight">New Product Deployment</h3>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Title</label>
                            <input 
                                required
                                type="text" 
                                value={newProduct.title}
                                onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                                placeholder="e.g. Netflix Premium"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Price (USD)</label>
                            <input 
                                required
                                type="number" 
                                step="0.01"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                                placeholder="0.00"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Initial Stock</label>
                            <input 
                                type="number" 
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Image URL</label>
                            <input 
                                type="text" 
                                value={newProduct.image}
                                onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                                placeholder="https://..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="w-full py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-500 transition-all text-sm">
                                Save Product
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Product List - Shopify Style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
              <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Filter products" 
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-400 transition-all"
                  />
                  <Search className="absolute left-3 top-2 text-slate-400" size={14} />
              </div>
              <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white transition-all flex items-center gap-2">
                  <Filter size={14} />
                  Filters
              </button>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 w-12 text-center">
                              <input type="checkbox" className="rounded border-slate-300" />
                          </th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Product</th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Status</th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Inventory</th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Price</th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {loading ? (
                          <tr><td colSpan={6} className="p-20 text-center text-slate-400 text-sm font-medium">Loading products...</td></tr>
                      ) : products.length === 0 ? (
                          <tr><td colSpan={6} className="p-20 text-center text-slate-400 text-sm font-medium">No products found</td></tr>
                      ) : products.map((product) => (
                          <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4 border-b border-slate-50 text-center">
                                  <input type="checkbox" className="rounded border-slate-300" />
                              </td>
                              <td className="px-6 py-4 border-b border-slate-50">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                          <img src={product.image} className="w-full h-full object-cover" alt="" />
                                      </div>
                                      <span className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{product.title}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 border-b border-slate-50">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                      product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}>
                                      {product.stock > 0 ? "Active" : "Archived"}
                                  </span>
                              </td>
                              <td className="px-6 py-4 border-b border-slate-50">
                                  <span className={`text-sm font-medium ${product.stock <= 5 ? "text-red-600 font-bold" : "text-slate-600"}`}>
                                      {product.stock} in stock
                                  </span>
                              </td>
                              <td className="px-6 py-4 border-b border-slate-50 text-sm font-bold text-slate-900">
                                  ${Number(product.price).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 border-b border-slate-50 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-md transition-all">
                                          <Edit size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(product.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                      >
                                          <Trash2 size={14} />
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
  );
}
