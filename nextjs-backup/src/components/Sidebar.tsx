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
        <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[400px] shadow-sm"></div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[100px] shadow-sm"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 w-full md:w-[280px] shrink-0">
      {/* Store Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-100 mb-3 relative group-hover:border-primary-300 transition-colors duration-300 shadow-xl shadow-primary-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center text-slate-800 font-bold">
                <div className="flex flex-col items-center">
                    <Crown className="w-10 h-10 text-primary-600 mb-1 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-[10px] tracking-wider uppercase text-primary-700">StoreOne</span>
                </div>
            </div>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">{profile.name}</h2>
          <div className="flex gap-1.5 mt-2 text-primary-600">
            <Crown className="w-4 h-4 fill-current drop-shadow-sm" />
            <Crown className="w-4 h-4 fill-current drop-shadow-sm" />
            <Crown className="w-4 h-4 fill-current drop-shadow-sm" />
          </div>
        </div>

        <button className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 mb-6 transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transform hover:-translate-y-0.5">
          <MessageCircle className="w-4 h-4" />
          Contact Seller
        </button>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Member since</span>
            <span className="text-slate-900 font-medium">{profile.memberSince}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Order completion</span>
            <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-primary-600 fill-current" />
                <span className="text-slate-900 font-medium">{profile.orderCompletion}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Disputes</span>
            <span className="text-red-500 font-medium">{profile.disputeRate}</span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider -mt-2 mb-2">(last 90 days)</div>
          
          <div className="h-px bg-slate-100 my-3"></div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Total reviews</span>
            <span className="text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">{profile.totalReviews}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Last 90 days</span>
            <div className="flex items-center gap-1.5 text-primary-600">
                <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium">{profile.last90Days}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">All reviews</span>
            <div className="flex items-center gap-1.5 text-primary-600">
                <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium">{profile.allReviews}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-display font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            Description
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed break-words font-light">
          {profile.description}
        </p>
      </div>

      {/* Language Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-display font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3">Language</h3>
        <div className="flex gap-3">
            {profile.languages.map((lang, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center flex-1 hover:border-primary-500 transition-colors shadow-sm">
                    <div className="text-sm font-medium text-slate-900 mb-0.5">{lang.name}</div>
                    <div className="text-[10px] text-primary-600 uppercase tracking-wider font-bold">{lang.level}</div>
                </div>
            ))}
        </div>
      </div>

      {/* Store Level Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-display font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            Verification
        </h3>
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-sm">
            <div className="bg-primary-50 p-2 rounded-lg border border-primary-100">
                <ShieldCheck className="w-6 h-6 text-primary-600" />
            </div>
            <div>
                <div className="text-sm font-medium text-slate-900">{profile.level}</div>
                <div className="text-xs text-primary-600 font-bold uppercase tracking-wider">Verified Seller</div>
            </div>
        </div>
      </div>
    </div>
  );
}
