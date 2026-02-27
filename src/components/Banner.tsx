export function Banner() {
  return (
    <div className="bg-[#1a1b2e] relative overflow-hidden h-[180px] md:h-[220px] w-full border-b-4 border-yellow-400">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff00cc] via-[#333399] to-[#333399]"></div>
        
        <div className="container mx-auto px-4 h-full max-w-7xl relative z-10">
             <div className="h-full flex items-center justify-center relative">
                
                {/* Center Content: StoreOne Logo/Text */}
                <div className="text-center relative z-20 mt-[-20px]">
                    <div className="relative inline-block">
                         {/* Crown Icon above text */}
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400">
                             <svg width="40" height="30" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" />
                             </svg>
                         </div>
                         
                         {/* Main Text */}
                         <h1 className="text-5xl md:text-7xl text-yellow-300 font-serif italic tracking-wide drop-shadow-lg" style={{ fontFamily: 'Georgia, serif', textShadow: '2px 2px 0px #000' }}>
                            StoreOne
                         </h1>
                         
                         {/* Decorative Ribbons/Shields */}
                         <div className="absolute top-1/2 -left-24 -translate-y-1/2 hidden md:block">
                            <div className="w-16 h-20 bg-red-600 border-2 border-yellow-400 clip-banner shadow-lg flex items-center justify-center">
                                <div className="text-yellow-400 text-2xl">⚜️</div>
                            </div>
                         </div>
                         <div className="absolute top-1/2 -right-24 -translate-y-1/2 hidden md:block">
                            <div className="w-16 h-20 bg-red-600 border-2 border-yellow-400 clip-banner shadow-lg flex items-center justify-center">
                                <div className="text-yellow-400 text-2xl">⚜️</div>
                            </div>
                         </div>
                    </div>
                </div>
                
                {/* Castle Graphic (Right Side) */}
                <div className="absolute right-0 bottom-0 h-full flex items-end">
                    <div className="w-32 md:w-48 h-32 md:h-40 bg-yellow-400 border-4 border-black relative clip-castle flex items-center justify-center">
                        <div className="w-4 h-12 bg-black absolute top-10 left-4 rounded-t-full"></div>
                        <div className="w-4 h-12 bg-black absolute top-10 right-4 rounded-t-full"></div>
                        <div className="w-8 h-12 bg-black absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full"></div>
                    </div>
                </div>

                {/* Left Side Decoration (Optional to balance) */}
                <div className="absolute left-0 top-0 h-full w-full opacity-20 pointer-events-none">
                    <div className="absolute top-4 left-10 text-white text-4xl">✨</div>
                    <div className="absolute bottom-10 left-1/4 text-white text-2xl">✨</div>
                    <div className="absolute top-10 right-1/4 text-white text-3xl">✨</div>
                </div>
             </div>
        </div>
    </div>
  );
}
