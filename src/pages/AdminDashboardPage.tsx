import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminProducts } from "../components/admin/AdminProducts";
import { AdminOrders } from "../components/admin/AdminOrders";
import { AdminSettings } from "../components/admin/AdminSettings";
import { AdminCustomers } from "../components/admin/AdminCustomers";
import { AdminMessages } from "../components/admin/AdminMessages";
import { AdminCategories } from "../components/admin/AdminCategories";

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminProducts } from "../components/admin/AdminProducts";
import { AdminOrders } from "../components/admin/AdminOrders";
import { AdminSettings } from "../components/admin/AdminSettings";
import { AdminCustomers } from "../components/admin/AdminCustomers";
import { AdminMessages } from "../components/admin/AdminMessages";
import { AdminCategories } from "../components/admin/AdminCategories";

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const userRole = localStorage.getItem("userRole");

  console.log("AdminDashboard Check - Role:", userRole);

  if (userRole !== "admin" && userRole !== "moderator") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 bg-white m-10 rounded-3xl border border-slate-200 shadow-xl">
        <ShieldAlert size={64} className="text-red-500 mb-6" />
        <h2 className="text-3xl font-black mb-3 tracking-tight">Security Protocol Violation</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">Your current identity node does not have high-level administrative or moderator authorization.</p>
        <Link to="/" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">Return to Sector 7G (Home)</Link>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-4">
        {activeTab === "dashboard" && <AdminOverview setActiveTab={setActiveTab} />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "orders" && <AdminOrders setActiveTab={setActiveTab} />}
        {activeTab === "messages" && <AdminMessages />}
        {activeTab === "customers" && <AdminCustomers setActiveTab={setActiveTab} />}
        {activeTab === "settings" && userRole === "admin" && <AdminSettings />}
        {activeTab === "settings" && userRole !== "admin" && (
           <div className="flex flex-col items-center justify-center py-32 text-center">
              <ShieldAlert size={48} className="text-amber-500 mb-4" />
              <h3 className="text-xl font-black text-slate-900">Restricted Module</h3>
              <p className="text-slate-500 mt-1">Moderators cannot modify system-wide configurations.</p>
           </div>
        )}
      </div>
    </AdminLayout>
  );
}
