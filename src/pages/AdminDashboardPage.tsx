import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminProducts } from "../components/admin/AdminProducts";
import { AdminOrders } from "../components/admin/AdminOrders";
import { AdminSettings } from "../components/admin/AdminSettings";
import { AdminCustomers } from "../components/admin/AdminCustomers";

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    if (userRole !== "admin") {
      navigate("/");
    }
  }, [userRole, navigate]);

  if (userRole !== "admin") return null;

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === "dashboard" && <AdminOverview setActiveTab={setActiveTab} />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "customers" && <AdminCustomers />}
        {activeTab === "settings" && <AdminSettings />}
    </AdminLayout>
  );
}
