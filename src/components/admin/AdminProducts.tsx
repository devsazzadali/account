import React from "react";
import { Plus, Edit, Trash2, Search, Filter, Download } from "lucide-react";

export function AdminProducts() {
  return (
    <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h3 className="text-xl font-bold text-white mb-1">Asset Inventory</h3>
            <p className="text-xs text-dark-50/30 uppercase tracking-widest font-bold">Manage your premium digital listings</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-dark-50/40 hover:text-white transition-all">
                <Filter size={18} />
            </button>
            <button className="bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-105 active:scale-95 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20">
                <Plus size={16} />
                Add Product
            </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-white/2 text-dark-50/30 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
            <tr>
                <th className="px-8 py-5">Product Name</th>
                <th className="px-8 py-5">Valuation</th>
                <th className="px-8 py-5">Stock Reserve</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Operations</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
            {[
                { name: "Netflix Premium UHD", price: "$14.99", stock: 1240, status: "Active" },
                { name: "Spotify Individual 12M", price: "$29.00", stock: 450, status: "Active" },
                { name: "NordVPN Private Key", price: "$12.00", stock: 0, status: "Out of Stock" },
                { name: "Disney+ Master Bundle", price: "$19.99", stock: 88, status: "Active" },
            ].map((product, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5 font-bold text-white text-sm">{product.name}</td>
                    <td className="px-8 py-5 font-bold text-white text-sm">{product.price}</td>
                    <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-dark-50/60">{product.stock}</span>
                            <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full ${product.stock > 100 ? "bg-primary-500" : product.stock > 0 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(product.stock / 15, 100)}%` }}></div>
                            </div>
                        </div>
                    </td>
                    <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        product.status === "Active" ? "bg-primary-500/10 text-primary-400 border-primary-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                        {product.status}
                        </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-dark-50/30 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all"><Edit size={16} /></button>
                            <button className="p-2 text-dark-50/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
