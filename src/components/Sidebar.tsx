import { MessageCircle, ThumbsUp, Crown, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { STORE_PROFILE } from "../data/mockData";

interface Language {
  name: string;
  level: string;
}

interface StoreProfile {
  name: string;
  level: string;
  memberSince: string;
  orderCompletion: string;
  disputeRate: string;
  totalReviews: number;
  last90Days: string;
  allReviews: string;
  description: string;
  languages: Language[];
}

export function Sidebar() {
  const [profile] = useState<StoreProfile | null>(STORE_PROFILE);
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="w-full md:w-[280px] shrink-0 space-y-6 animate-pulse">
        <div className="glass-card rounded-2xl p-6 h-[400px]"></div>
        <div className="glass-card rounded-2xl p-6 h-[100px]"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 w-full md:w-[280px] shrink-0">
      {/* Store Profile Card */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-500/30 mb-3 relative group-hover:border-primary-400 transition-colors duration-300 shadow-lg shadow-primary-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-primary-900 flex items-center justify-center text-white font-bold">
                <div className="flex flex-col items-center">
                    <Crown className="w-10 h-10 text-primary-400 mb-1 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-[10px] tracking-wider uppercase text-primary-200">StoreOne</span>
                </div>
            </div>
          </div>
          <h2 className="font-display font-bold text-xl text-white tracking-tight">{profile.name}</h2>
          <div className="flex gap-1.5 mt-2 text-primary-400">
            <Crown className="w-4 h-4 fill-current drop-shadow-md" />
            <Crown className="w-4 h-4 fill-current drop-shadow-md" />
            <Crown className="w-4 h-4 fill-current drop-shadow-md" />
          </div>
        </div>

        <button className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 mb-6 transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transform hover:-translate-y-0.5">
          <MessageCircle className="w-4 h-4" />
          Contact Seller
        </button>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-dark-50/60">Member since</span>
            <span className="text-white font-medium">{profile.memberSince}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-50/60">Order completion</span>
            <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-primary-400 fill-current" />
                <span className="text-white font-medium">{profile.orderCompletion}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-50/60">Disputes</span>
            <span className="text-red-400 font-medium">{profile.disputeRate}</span>
          </div>
          <div className="text-[10px] text-dark-50/40 uppercase tracking-wider -mt-2 mb-2">(last 90 days)</div>
          
          <div className="h-px bg-white/10 my-3"></div>

          <div className="flex justify-between items-center">
            <span className="text-dark-50/60">Total reviews</span>
            <span className="text-primary-400 font-medium bg-primary-500/10 px-2 py-0.5 rounded-md">{profile.totalReviews}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-50/60">Last 90 days</span>
            <div className="flex items-center gap-1.5 text-primary-400">
                <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium">{profile.last90Days}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-50/60">All reviews</span>
            <div className="flex items-center gap-1.5 text-primary-400">
                <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium">{profile.allReviews}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-white mb-4 border-b border-white/10 pb-3 flex items-center gap-2">
            Description
        </h3>
        <p className="text-sm text-dark-50/70 leading-relaxed break-words font-light">
          {profile.description}
        </p>
      </div>

      {/* Language Card */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-white mb-4 border-b border-white/10 pb-3">Language</h3>
        <div className="flex gap-3">
            {profile.languages.map((lang, idx) => (
                <div key={idx} className="bg-dark-900/50 border border-white/5 rounded-xl px-4 py-3 text-center flex-1 hover:border-primary-500/30 transition-colors">
                    <div className="text-sm font-medium text-white mb-0.5">{lang.name}</div>
                    <div className="text-[10px] text-primary-400 uppercase tracking-wider">{lang.level}</div>
                </div>
            ))}
        </div>
      </div>

      {/* Store Level Card */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-white mb-4 border-b border-white/10 pb-3 flex items-center gap-2">
            Verification
        </h3>
        <div className="flex items-center gap-3 bg-dark-900/50 rounded-xl p-3 border border-white/5">
            <div className="bg-primary-500/20 p-2 rounded-lg border border-primary-500/30">
                <ShieldCheck className="w-6 h-6 text-primary-400" />
            </div>
            <div>
                <div className="text-sm font-medium text-white">{profile.level}</div>
                <div className="text-xs text-primary-400">Verified Seller</div>
            </div>
        </div>
      </div>
    </div>
  );
}
