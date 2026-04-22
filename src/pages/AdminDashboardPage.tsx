import React, { useState } from "react";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminProducts } from "../components/admin/AdminProducts";
import { AdminOrders } from "../components/admin/AdminOrders";
import { AdminCustomers } from "../components/admin/AdminCustomers";
import { AdminTransactions } from "../components/admin/AdminTransactions";
import { AdminSettings } from "../components/admin/AdminSettings";

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === "dashboard" && <AdminOverview />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "customers" && <AdminCustomers />}
        {activeTab === "transactions" && <AdminTransactions />}
        {activeTab === "settings" && <AdminSettings />}
    </AdminLayout>
  );
}
