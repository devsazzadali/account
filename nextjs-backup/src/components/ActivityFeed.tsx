import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Activity {
  id: string;
  username: string;
  product_title: string;
  created_at: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function fetchRecent() {
      const { data } = await supabase
        .from("orders")
        .select("id, username, products(title), created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (data && data.length > 0) {
        setActivities(
          data.map((o: any) => ({
            id: o.id,
            username: o.username || "Someone",
            product_title: o.products?.title || "a product",
            created_at: o.created_at,
          }))
        );
      }
    }
    fetchRecent();

    // Real-time: push new orders to the front
    const channel = supabase
      .channel("activity_feed_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new as any;
          setActivities((prev) =>
            [
              {
                id: o.id,
                username: o.username || "Someone",
                product_title: "a product",
                created_at: o.created_at,
              },
              ...prev,
            ].slice(0, 8)
          );
          setIndex(0);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activities.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activities]);

  // Don't show anything if no real data
  if (activities.length === 0) return null;

  const current = activities[index];

  function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  }

  // Mask username: show first 2 chars + ****
  const maskedUser =
    current.username.length > 2
      ? current.username.slice(0, 2) + "****"
      : current.username + "****";

  return (
    <div className="fixed bottom-6 left-6 z-50 hidden md:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + index}
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          className="bg-white/80 backdrop-blur-xl border border-slate-200 p-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px]"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">
              {maskedUser} purchased
            </p>
            <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest mt-0.5 truncate max-w-[160px]">
              {current.product_title}
            </p>
          </div>
          <div className="text-[9px] font-bold text-slate-400 uppercase shrink-0">
            {timeAgo(current.created_at)}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
