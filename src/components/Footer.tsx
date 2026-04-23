import { Facebook, Instagram, Mail, Globe, ArrowUp, Zap, ShieldCheck } from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white text-slate-900 pt-20 pb-10 relative overflow-hidden border-t border-slate-200">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-primary-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Top Section with Branding and Socials */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 pb-12 border-b border-slate-100">
            <div className="mb-8 md:mb-0">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Zap className="w-6 h-6 text-white fill-current" />
                    </div>
                    <span className="text-2xl font-display font-bold tracking-tight text-slate-900">Account<span className="text-primary-600">Store</span></span>
                </div>
                <p className="text-slate-500 text-sm max-w-md leading-relaxed">
                    The world's leading marketplace for premium digital assets and high-tier accounts. Experience pure excellence with 24/7 support and instant delivery.
                </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-6">
                <div className="flex gap-4">
                    {[Facebook, Instagram, Mail].map((Icon, i) => (
                        <div key={i} className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-primary-50 hover:border-primary-500 hover:text-primary-600 transition-all duration-500 cursor-pointer group shadow-sm">
                            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                    ))}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 text-xs text-slate-600 cursor-pointer hover:border-primary-500/30 transition-all duration-300 shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-[8px] text-primary-600 font-bold">WW</div>
                    <span className="font-medium">Global Marketplace / USD / English</span>
                </div>
            </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div>
            <h3 className="font-display font-bold mb-6 text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                Platform
            </h3>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-primary-600 transition-colors">About Universe</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Game Directory</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Premium Insights</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Creator Program</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-bold mb-6 text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Assistance
            </h3>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-primary-600 transition-colors">Concierge Desk</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Security Center</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Buyer Protection</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Seller Handbook</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-bold mb-6 text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                Governance
            </h3>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-primary-600 transition-colors">Service Terms</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Data Sovereignty</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Compliance</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Global Rights</a></li>
            </ul>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="p-3 bg-primary-50 rounded-full border border-primary-100 mb-4">
                    <ShieldCheck className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="font-display font-bold text-slate-900 mb-2 italic">Secured by Titan™</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Military-Grade Encryption</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8 flex-wrap justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <a href="#" className="hover:text-primary-600 transition-colors">Verified Listings</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Instant Release</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Titan Security</a>
                <a href="#" className="hover:text-primary-600 transition-colors">Global Node</a>
            </div>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                © 2026 AccountStore. Developed for Excellence.
            </div>
        </div>
      </div>
      
      <button 
        onClick={scrollToTop}
        className="fixed bottom-10 right-10 w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-2xl shadow-2xl shadow-primary-500/40 hover:scale-110 active:scale-95 transition-all duration-300 z-50 flex items-center justify-center group"
      >
        <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
      </button>
    </footer>
  );
}
