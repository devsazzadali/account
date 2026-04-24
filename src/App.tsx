import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { StorePage } from "./pages/StorePage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderPage } from "./pages/OrderPage";
import { UserDashboardPage } from "./pages/UserDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { CreateListingPage } from "./pages/Seller/CreateListingPage";
import { SoldOrdersPage } from "./pages/Seller/SoldOrdersPage";
import { Home, Search, ShoppingBag, User as UserIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 pb-20 md:pb-0">
        <Header onSearch={setSearchQuery} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<StorePage searchQuery={searchQuery} />} />
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/seller/create-listing" element={<CreateListingPage />} />
            <Route path="/seller/orders" element={<SoldOrdersPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/checkout/:productId" element={<CheckoutPage />} />
            <Route path="/order/:orderId" element={<OrderPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </main>

        <Footer />
        <MobileTabBar />
      </div>
    </Router>
  );
}

function MobileTabBar() {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 ios-glass border border-white/20 ios-rounded px-8 py-3 flex justify-between items-center z-[100] pb-safe-area shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <TabItem to="/" icon={<Home size={22} />} label="Store" />
        <TabItem to="/" icon={<Search size={22} />} label="Explore" />
        <TabItem to="/dashboard" icon={<ShoppingBag size={22} />} label="Orders" />
        <TabItem to="/dashboard" icon={<UserIcon size={22} />} label="Account" />
    </div>
  );
}

function TabItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    return (
        <Link to={to} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#1dbf73] scale-110' : 'text-slate-400'}`}>
            {icon}
            <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}
