import { Routes, Route } from "react-router";
import { ProtectedRoute, PublicRoute } from "@/components/RouteGuard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import Trades from "@/pages/Trades";
import AddTrade from "@/pages/AddTrade";
import TradeDetail from "@/pages/TradeDetail";
import Journal from "@/pages/Journal";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/trades" element={<ProtectedRoute><Trades /></ProtectedRoute>} />
      <Route path="/trades/new" element={<ProtectedRoute><AddTrade /></ProtectedRoute>} />
      <Route path="/trades/:id" element={<ProtectedRoute><TradeDetail /></ProtectedRoute>} />
      <Route path="/trades/:id/edit" element={<ProtectedRoute><AddTrade /></ProtectedRoute>} />
      <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}
