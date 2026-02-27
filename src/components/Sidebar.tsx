import { MessageCircle, ThumbsUp, Crown, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/store/profile')
      .then(async res => {
        if (!res.ok) {
            const text = await res.text();
            console.error(`Profile fetch failed: ${res.status} ${res.statusText}`, text);
            throw new Error(`Profile fetch failed: ${res.status}`);
        }
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            setProfile(data);
            setLoading(false);
        } catch (e) {
            console.error("Failed to parse profile JSON:", text);
            throw e;
        }
      })
      .catch(err => {
        console.error("Failed to fetch profile:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full md:w-[280px] shrink-0 space-y-4 animate-pulse">
        <div className="bg-white rounded shadow-sm p-4 h-[400px]"></div>
        <div className="bg-white rounded shadow-sm p-4 h-[100px]"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-4 w-full md:w-[280px] shrink-0">
      {/* Store Profile Card */}
      <div className="bg-white rounded shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col items-center mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 mb-2 relative">
            <div className="absolute inset-0 bg-blue-900 flex items-center justify-center text-white font-bold text-xs">
                <div className="flex flex-col items-center">
                    <Crown className="w-8 h-8 text-yellow-400 mb-1" />
                    <span className="text-[10px]">StoreOne</span>
                </div>
            </div>
          </div>
          <h2 className="font-bold text-lg text-[#111111]">{profile.name}</h2>
          <div className="flex gap-1 mt-1 text-yellow-400">
            <Crown className="w-3 h-3 fill-current" />
            <Crown className="w-3 h-3 fill-current" />
            <Crown className="w-3 h-3 fill-current" />
            <span className="text-gray-400 text-xs ml-1">?</span>
          </div>
        </div>

        <button className="w-full bg-[#00C975] hover:bg-green-600 text-white font-medium py-2 rounded flex items-center justify-center gap-2 mb-6 transition-colors text-sm">
          <MessageCircle className="w-4 h-4" />
          Contact
        </button>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Member since</span>
            <span className="text-gray-900 font-medium">{profile.memberSince}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Order completion</span>
            <div className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-gray-900 font-medium">{profile.orderCompletion}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Order Dispute Rate</span>
            <span className="text-gray-900 font-medium">{profile.disputeRate}</span>
          </div>
          <div className="text-xs text-gray-400 mb-2">(last three months)</div>
          
          <div className="border-t border-gray-100 my-2"></div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Total reviews</span>
            <span className="text-[#00C975] font-medium">{profile.totalReviews}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Last 90 days</span>
            <div className="flex items-center gap-1 text-[#00C975]">
                <ThumbsUp className="w-3 h-3 fill-current" />
                <span className="font-medium">{profile.last90Days}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">All reviews</span>
            <div className="flex items-center gap-1 text-[#00C975]">
                <ThumbsUp className="w-3 h-3 fill-current" />
                <span className="font-medium">{profile.allReviews}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white rounded shadow-sm p-4 border border-gray-100">
        <h3 className="font-medium text-[#111111] mb-3 border-b border-gray-100 pb-2">Description</h3>
        <p className="text-xs text-gray-500 leading-relaxed break-words">
          {profile.description}
        </p>
      </div>

      {/* Language Card */}
      <div className="bg-white rounded shadow-sm p-4 border border-gray-100">
        <h3 className="font-medium text-[#111111] mb-3 border-b border-gray-100 pb-2">Language</h3>
        <div className="flex gap-2">
            {profile.languages.map((lang, idx) => (
                <div key={idx} className="border border-gray-200 rounded px-3 py-2 text-center flex-1">
                    <div className="text-xs font-medium text-gray-900">{lang.name}</div>
                    <div className="text-[10px] text-gray-400">{lang.level}</div>
                </div>
            ))}
        </div>
      </div>

      {/* Store Level Card */}
      <div className="bg-white rounded shadow-sm p-4 border border-gray-100">
        <h3 className="font-medium text-[#111111] mb-3 border-b border-gray-100 pb-2">Store Level</h3>
        <div className="flex items-center gap-2">
            <div className="bg-blue-900 p-1 rounded">
                <ShieldCheck className="w-5 h-5 text-blue-300" />
            </div>
            <span className="text-sm text-gray-700">{profile.level}</span>
        </div>
      </div>
    </div>
  );
}
