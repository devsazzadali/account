import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut, Lock } from "lucide-react";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminProducts } from "../components/admin/AdminProducts";
import { AdminOrders } from "../components/admin/AdminOrders";
import { AdminSettings } from "../components/admin/AdminSettings";
import { AdminCustomers } from "../components/admin/AdminCustomers";
import { AdminMessages } from "../components/admin/AdminMessages";

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  // Redirect if not admin
  useEffect(() => {
    if (userRole !== "admin") {
      // We don't navigate immediately so we can show the Access Denied UI
    }
  }, [userRole]);

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl shadow-slate-200/50 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-100">
                <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-500 text-sm mb-8">
                Your account does not have the required clearance level to access the Admin Command Center.
            </p>
            <div className="space-y-3">
                <Link to="/" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <ArrowLeft size={18} />
                    Return to Mainframe
                </Link>
                <button 
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                    }}
                    className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                >
                    <LogOut size={18} />
                    Switch Identity
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === "dashboard" && <AdminOverview setActiveTab={setActiveTab} />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "messages" && <AdminMessages />}
        {activeTab === "customers" && <AdminCustomers />}
        {activeTab === "settings" && <AdminSettings />}
    </AdminLayout>
  );
}
