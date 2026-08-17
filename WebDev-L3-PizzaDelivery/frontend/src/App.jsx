import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import CheckEmailPage from "./pages/CheckEmailPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import PizzaBuilderPage from "./pages/PizzaBuilderPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx"
import MyOrdersPage from "./pages/MyOrdersPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import "./App.css";
import "./unique-interface-theme.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
      <Route path="/reset-password/:token" element={<ResetPasswordPage />}/>
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}/>
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/check-email" element={<CheckEmailPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />}/>
      <Route path="/pizza-builder" element={<ProtectedRoute><PizzaBuilderPage /></ProtectedRoute>}/>
      <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>}/>
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}/>
      <Route path="*" element={ <Navigate to="/login" replace /> }/>
      <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>}/>
      <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>}/>
      </Routes>
  );
}
   
  ;

