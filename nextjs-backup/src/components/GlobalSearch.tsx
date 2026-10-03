import React, { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp, ArrowRight, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
}

const HISTORY_KEY = "search_history";

export function GlobalSearch({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [trending, setTrending] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("categories").select("name").limit(6).then(({ data }) => {
      if (data && data.length > 0) setTrending(data.map((c: any) => c.name));
    });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, title, price, image, category")
        .ilike("title", `%${query}%`)
        .limit(6);
      setResults(data || []);
      setLoading(false);
    }, 300);
  }, [query]);

  const saveHistory = (term: string) => {
    const updated = [term, ...history.filter(h => h !== term)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="relative flex items-center gap-3 p-4 border-b border-slate-100">
        <Search className="text-primary-600 shrink-0" size={20} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search accounts, games, subscriptions..."
          className="flex-1 bg-transparent text-slate-900 font-medium text-sm placeholder:text-slate-300 focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-lg px-3 py-1.5">
            ESC
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {/* Live Results */}
          {query.trim() ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                        <div className="h-2 bg-slate-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Results</p>
                  <div className="space-y-1">
                    {results.map(r => (
                      <Link
                        key={r.id}
                        to={`/product/${r.id}`}
                        onClick={() => { saveHistory(r.title); onClose?.(); }}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                      >
                        <img src={r.image} className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{r.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.category}</p>
                        </div>
                        <span className="text-sm font-black text-primary-600 shrink-0">${r.price.toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No results for "{query}"</p>
                  <p className="text-[10px] text-slate-300 mt-1">Try a different keyword</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Trending */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-primary-600" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trending Now</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trending.map(t => (
                    <button key={t} onClick={() => setQuery(t)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-all">
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent Searches</p>
                    </div>
                    <button onClick={clearHistory} className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">Clear</button>
                  </div>
                  <div className="space-y-1">
                    {history.map(h => (
                      <button key={h} onClick={() => setQuery(h)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-all text-left group">
                        <Clock size={14} className="text-slate-300 shrink-0" />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 flex-1">{h}</span>
                        <ArrowRight size={14} className="text-slate-200 group-hover:text-primary-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
