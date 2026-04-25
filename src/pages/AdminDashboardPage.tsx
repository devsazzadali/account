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

  if (userRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 bg-white m-10 rounded-3xl border border-slate-200">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-6">Admin privileges required.</p>
        <Link to="/" className="px-6 py-2 bg-slate-900 text-white rounded-lg">Go Home</Link>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-4">
        {activeTab === "dashboard" && <AdminOverview setActiveTab={setActiveTab} />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "messages" && <AdminMessages />}
        {activeTab === "customers" && <AdminCustomers />}
        {activeTab === "settings" && <AdminSettings />}
      </div>
    </AdminLayout>
  );
}
