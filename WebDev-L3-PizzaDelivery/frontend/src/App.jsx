import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import CheckEmailPage from "./pages/CheckEmailPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import "./App.css";

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
    </Routes>
  );
}