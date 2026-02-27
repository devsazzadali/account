import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { MainContent } from "../components/MainContent";
import { Banner } from "../components/Banner";

export function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <div className="relative flex flex-col">
      {/* Banner - Full Width */}
      <Banner />
      
      {/* Main Content Container */}
      <div className="container mx-auto px-4 max-w-7xl relative">
           <div className="flex flex-col md:flex-row gap-6">
               {/* Sidebar - Overlaps Banner on Desktop - Only visible on Home (All Categories) */}
               {selectedCategory === 'All' && (
                   <div className="w-full md:w-[280px] shrink-0 relative z-30 md:-mt-20">
                       <Sidebar />
                   </div>
               )}
               
               {/* Main Content */}
               <div className={`flex-1 min-w-0 ${selectedCategory === 'All' ? 'pt-8' : 'pt-8'}`}>
                   <MainContent selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
               </div>
           </div>
      </div>
    </div>
  );
}
