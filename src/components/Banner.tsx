import { Sparkles, Crown } from "lucide-react";

export function Banner() {
  return (
    <div className="relative overflow-hidden h-[240px] md:h-[320px] w-full bg-dark-900 border-b border-white/10">
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-primary-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[150%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

      <div className="container mx-auto px-4 h-full max-w-7xl relative z-10 flex items-center justify-center">
        
        {/* Main Content Area */}
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary-500/30 text-primary-100 text-sm font-medium tracking-wide animate-float">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span>Discover Premium Excellence</span>
          </div>

          {/* Heading */}
          <div className="relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-primary-500 opacity-80 z-0">
               <Crown className="w-12 h-12" strokeWidth={1} />
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight text-white mb-2 relative z-10">
              Account<span className="text-gradient">Store</span>
            </h1>
          </div>

          {/* Subheading */}
          <p className="text-dark-50 text-lg md:text-xl font-sans font-light max-w-2xl mx-auto opacity-80 leading-relaxed">
            Elevate your digital presence with our curated selection of verified, high-tier accounts. Experience pure exclusivity.
          </p>

        </div>

      </div>
    </div>
  );
}
