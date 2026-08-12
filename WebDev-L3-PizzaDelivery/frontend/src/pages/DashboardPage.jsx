import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <main className="dashboard">
      <nav className="dashboard-nav">
        <h2>🍕 Pizza Delivery</h2>

        <button className="outline-button" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </nav>

      <section className="welcome-panel">
        <p className="eyebrow">Customer Dashboard</p>
        <h1>Welcome, {user?.name}!</h1>
        <p>
          Your pizza catalogue and custom builder are coming
          in the next step.
        </p>
      </section>
    </main>
  );
}