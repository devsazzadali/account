/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#f8f8f8]">
        <Header />
        
        <Routes>
          <Route path="/" element={<StorePage />} />
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

        <Footer />
      </div>
    </Router>
  );
}
