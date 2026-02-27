import { Facebook, Instagram, Mail, Globe, ArrowUp } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0b0c15] text-white pt-12 pb-6">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Payment Methods */}
        <div className="bg-white rounded-lg p-4 mb-8 flex flex-wrap justify-center gap-6 items-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 object-contain" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-8 object-contain" />
            <span className="text-gray-400 text-xs font-mono">GCash</span>
            <span className="text-gray-400 text-xs font-mono">G Pay</span>
            <span className="text-gray-400 text-xs font-mono">Apple Pay</span>
            <span className="text-gray-400 text-xs font-mono">Neteller</span>
            <span className="text-gray-400 text-xs font-mono">Neosurf</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-sm">
          <div>
            <h3 className="font-bold mb-4 text-gray-300 uppercase text-xs tracking-wider">Z2U.COM</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Game Index</a></li>
              <li><a href="#" className="hover:text-white transition-colors">News</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Affiliate Program</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-gray-300 uppercase text-xs tracking-wider">SUPPORT</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How to buy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How to Sell</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-gray-300 uppercase text-xs tracking-wider">LEGAL</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Terms of use</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">DMCA</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
            </ul>
          </div>
          <div className="flex flex-col items-end">
             <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                    <Facebook className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-colors cursor-pointer">
                    <Instagram className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                    <Mail className="w-4 h-4" />
                </div>
             </div>
             <div className="border border-gray-700 rounded px-3 py-1 flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:border-gray-500">
                <div className="w-4 h-4 rounded-full bg-green-800 flex items-center justify-center text-[8px] text-white font-bold">BD</div>
                <span>Bangladesh, English, USD</span>
             </div>
             <div className="mt-4 flex items-center gap-2 text-gray-500 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                    <span>Google Safe Browsing</span>
                </div>
             </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-wrap justify-between items-center text-xs text-gray-500">
            <div className="flex gap-4 flex-wrap mb-4 md:mb-0">
                <a href="#" className="hover:text-white">Genshin Impact Account</a>
                <a href="#" className="hover:text-white">WoW MoP Classic Gold</a>
                <a href="#" className="hover:text-white">NBA 2K26 MT</a>
                <a href="#" className="hover:text-white">Madden 26 Coins</a>
                <a href="#" className="hover:text-white">Fortnite Top Up</a>
            </div>
            <p>Copyright © 2026 Z2U.com All rights reserved</p>
        </div>
      </div>
      
      <button className="fixed bottom-8 right-8 bg-[#FF3333] text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors z-50">
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
