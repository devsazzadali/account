import { Sparkles, Crown } from "lucide-react";

export function Banner() {
  return (
    <div className="relative overflow-hidden h-[240px] md:h-[320px] w-full bg-slate-50 border-b border-slate-200">
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[150%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>

      <div className="container mx-auto px-4 h-full max-w-7xl relative z-10 flex items-center justify-center">
        
        {/* Main Content Area */}
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary-200 text-primary-700 text-sm font-medium tracking-wide animate-float shadow-sm">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span>Discover Premium Excellence</span>
          </div>

          {/* Heading */}
          <div className="relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-primary-400 opacity-30 z-0">
               <Crown className="w-12 h-12" strokeWidth={1} />
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight text-slate-900 mb-2 relative z-10 italic">
              Account<span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">Store</span>
            </h1>
          </div>

          {/* Subheading */}
          <p className="text-slate-500 text-lg md:text-xl font-sans font-light max-w-2xl mx-auto leading-relaxed">
            Elevate your digital presence with our curated selection of verified, high-tier accounts. Experience pure exclusivity.
          </p>

        </div>

      </div>
    </div>
  );
}
