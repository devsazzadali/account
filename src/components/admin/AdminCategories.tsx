import React, { useEffect, useState } from "react";
import { 
  Tag, Plus, Trash2, Edit, Search, Loader2, 
  ArrowRight, Check, AlertCircle, ChevronRight,
  FolderPlus, Layers, ListFilter
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

import { toast } from "react-hot-toast";

export function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);


  async function fetchCategories() {
    setLoading(true);
    try {
      // In a real scenario, you'd have a categories table. 
      // If not, we derive them from products or create the table.
      // For this implementation, we assume a 'categories' table exists or we'll provide the SQL to create it.
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        if (error.code === "PGRST116" || error.message.includes("does not exist")) {
          // Table doesn't exist, use fallback/empty
          setCategories([]);
        } else {
          throw error;
        }
      } else {
        setCategories(data || []);
      }
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDrawer = (category?: any) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        slug: category.slug || "",
        description: category.description || "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", slug: "", description: "" });
    }
    setShowDrawer(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/ /g, "-"),
        description: formData.description,
      };

      if (editingId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        toast.success("Category created successfully");
      }

      setShowDrawer(false);
      fetchCategories();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      toast.success("Category removed");
      setShowConfirmDelete(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen font-sans">
      

      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900">Category Management</h2>
          <p className="text-[13px] text-slate-400 mt-0.5">Organize your products into logical collections</p>
        </div>
        <button
          onClick={() => handleOpenDrawer()}
          className="px-6 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center gap-2 uppercase tracking-widest"
        >
          <FolderPlus size={16} /> Create Category
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-slate-200">
        <div className="px-6 py-4 flex items-center gap-4 border-r border-slate-100">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
            <Tag size={20} />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-slate-900">{categories.length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Categories</div>
          </div>
        </div>
        <div className="px-6 py-4 flex items-center gap-4 border-r border-slate-100">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-slate-900">12</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Listings</div>
          </div>
        </div>
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ListFilter size={20} />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-slate-900">8</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Filters</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
        <div className="max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-primary-600 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* List Area */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-[13px] font-medium tracking-wide">Syncing data modules...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <div className="p-4 bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Tag size={24} className="text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold">No categories found</h3>
            <p className="text-slate-400 text-[13px] mt-1">Start by creating your first product collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map(cat => (
              <div key={cat.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-primary-100 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                    <Tag size={16} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenDrawer(cat)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setShowConfirmDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h4 className="text-slate-900 font-bold font-display">{cat.name}</h4>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">/{cat.slug}</div>
                {cat.description && (
                  <p className="text-[12px] text-slate-500 mt-3 line-clamp-2 leading-relaxed">{cat.description}</p>
                )}
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-primary-600 px-2 py-0.5 bg-primary-50 rounded-full uppercase tracking-widest">
                    Active
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[400]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[500] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-display font-bold text-slate-900">
                  {editingId ? "Edit Category" : "New Category"}
                </h3>
                <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-slate-600">
                  <ArrowRight size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Category Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium focus:outline-none focus:border-primary-600 focus:bg-white transition-all"
                    placeholder="Ex: Game Accounts"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">URL Slug (Optional)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium focus:outline-none focus:border-primary-600 focus:bg-white transition-all"
                    placeholder="ex-game-accounts"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-medium focus:outline-none focus:border-primary-600 focus:bg-white transition-all"
                    placeholder="Short description for this collection..."
                  />
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl text-[13px] uppercase tracking-widest shadow-xl shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : editingId ? "Update Category" : "Create Category"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowConfirmDelete(null)} 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Category?</h3>
              <p className="text-slate-500 text-[14px] mb-8">This action cannot be undone. All product associations with this category may be affected.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmDelete(null)} 
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(showConfirmDelete)} 
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
