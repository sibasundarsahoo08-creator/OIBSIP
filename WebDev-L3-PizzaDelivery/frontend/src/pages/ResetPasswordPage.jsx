import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";

import api from "../api/api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.password.length < 8 || !/\d/.test(form.password)) {
      toast.error(
        "Password needs 8 characters and at least one number"
      );
      return;
    }

    setLoading(true);

    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
      });

      toast.success("Password reset successfully");
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Reset link is invalid or expired"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-badge">🔐</div>
        <p className="eyebrow">Create a new password</p>
        <h1>Reset password</h1>
        <p className="muted">
          Choose a strong password containing at least eight
          characters and one number.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            New password
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value,
                })
              }
              placeholder="Enter new password"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({
                  ...form,
                  confirmPassword: event.target.value,
                })
              }
              placeholder="Enter password again"
            />
          </label>

          <button
            className="primary-button"
            disabled={loading}
          >
            <KeyRound size={19} />
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">Return to login</Link>
        </p>
      </section>
    </main>
  );
}