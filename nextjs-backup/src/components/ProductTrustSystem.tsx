import React from "react";
import { ShieldCheck, Star, Zap, TrendingUp, Award, BadgeCheck, AlertTriangle, Clock } from "lucide-react";
import { motion } from "framer-motion";

// ── Seller Trust Card ──────────────────────────────────────────
interface SellerTrustProps {
  successRate?: number; // 0-100
  refundRate?: number;
  totalSales?: number;
  responseTime?: string;
  level?: string;
  name?: string;
  avatar?: string;
  verified?: boolean;
}

export function SellerTrustCard({
  successRate = 98.4,
  refundRate = 0.8,
  totalSales = 11240,
  responseTime = "< 2 min",
  level = "Legendary",
  name = "TitanGames_Global",
  avatar,
  verified = true,
}: SellerTrustProps) {
  const levelColors: Record<string, string> = {
    Legendary: "from-amber-500 to-orange-500",
    Elite: "from-purple-500 to-blue-600",
    Pro: "from-primary-500 to-teal-500",
    Standard: "from-slate-400 to-slate-600",
  };
  const gradient = levelColors[level] || levelColors.Standard;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} p-[2px] shadow-lg`}>
            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
              <img
                src={avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 rounded-lg border-2 border-white flex items-center justify-center">
                <BadgeCheck size={11} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-black text-slate-900">{name}</h4>
              {verified && <BadgeCheck size={15} className="text-primary-600" />}
            </div>
            <span className={`inline-block bg-gradient-to-r ${gradient} text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full`}>
              {level} Seller
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-slate-900">{successRate}%</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Success Rate</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill icon={<TrendingUp size={13} />} label="Total Sales" value={totalSales.toLocaleString()} color="blue" />
        <StatPill icon={<Clock size={13} />} label="Response" value={responseTime} color="emerald" />
        <StatPill icon={<AlertTriangle size={13} />} label="Refund Rate" value={`${refundRate}%`} color={refundRate > 2 ? "red" : "slate"} />
      </div>

      {/* Trust Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Award size={11} /> Trust Score
          </span>
          <span className="text-[9px] font-black text-primary-600">{successRate}/100</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };
  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl border ${colors[color]} text-center`}>
      <div className="mb-1">{icon}</div>
      <div className="text-sm font-black">{value}</div>
      <div className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-0.5">{label}</div>
    </div>
  );
}

// ── Stock Intelligence UI ──────────────────────────────────────
interface StockProps {
  stock: number;
  totalCapacity?: number;
}

export function StockIntelligence({ stock, totalCapacity = 100 }: StockProps) {
  const pct = Math.min((stock / totalCapacity) * 100, 100);
  const isLow = stock <= 5;
  const isCritical = stock <= 2;

  const color = isCritical
    ? { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
    : isLow
    ? { bar: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" }
    : { bar: "bg-primary-500", text: "text-primary-600", bg: "bg-primary-50", border: "border-primary-200" };

  return (
    <div className={`rounded-2xl border ${color.border} ${color.bg} p-4 space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <AlertTriangle size={15} className={color.text} />
          ) : (
            <Zap size={15} className={color.text} />
          )}
          <span className={`text-[10px] font-black uppercase tracking-widest ${color.text}`}>
            {isCritical ? "Almost Sold Out!" : isLow ? "Low Stock Warning" : "In Stock"}
          </span>
        </div>
        <span className={`text-sm font-black ${color.text}`}>{stock} left</span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color.bar} rounded-full`}
        />
      </div>
      {isLow && (
        <p className={`text-[9px] font-bold ${color.text} opacity-70`}>
          {isCritical ? "Buy now before it's gone — last few units remaining!" : `Hurry! Only ${stock} units available at this price.`}
        </p>
      )}
    </div>
  );
}

// ── Delivery Timeline ──────────────────────────────────────────
export function DeliveryTimeline() {
  const steps = [
    { icon: <ShieldCheck size={16} />, label: "Payment Verified",  sub: "Instant" },
    { icon: <Zap size={16} />,         label: "Auto Assignment",   sub: "< 1 sec" },
    { icon: <BadgeCheck size={16} />,  label: "Credentials Ready", sub: "Instant" },
  ];

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Zap size={16} className="text-primary-600 fill-current" />
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Delivery Timeline</h4>
      </div>
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2 z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.15 }}
              className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20"
            >
              {step.icon}
            </motion.div>
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-900 uppercase tracking-wider">{step.label}</p>
              <p className="text-[8px] font-bold text-primary-600">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trust Badges Row ───────────────────────────────────────────
export function TrustBadges() {
  const badges = [
    { icon: <ShieldCheck size={16} />, label: "Escrow Protected" },
    { icon: <Zap size={16} />,         label: "Instant Delivery" },
    { icon: <Award size={16} />,       label: "Verified Stock" },
    { icon: <Star size={16} />,        label: "5-Star Seller" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {badges.map((b, i) => (
        <div key={i} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-primary-600">{b.icon}</div>
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
