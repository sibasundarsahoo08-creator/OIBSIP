import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const loginData = await login(
        form.email.trim().toLowerCase(),
        form.password
      );

      const loggedInUser = loginData.user;

      if (loggedInUser?.role === "admin") {
        toast.success("Welcome, Administrator!");

        navigate("/admin", {
          replace: true,
        });
      } else {
        toast.success("Welcome back!");

        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to log in"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-badge">🍕</div>

        <p className="eyebrow">
          Pizza Delivery
        </p>

        <h1>Welcome back</h1>

        <p className="muted">
          Log in to order and track your favourite
          pizza.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Email address

            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value,
                })
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password

            <div className="password-field">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  setForm({
                    ...form,
                    password:
                      event.target.value,
                  })
                }
                placeholder="Enter your password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff />
                ) : (
                  <Eye />
                )}
              </button>
            </div>
          </label>

          <Link
            className="forgot-link"
            to="/forgot-password"
          >
            Forgot password?
          </Link>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            <LogIn size={19} />

            {submitting
              ? "Logging in..."
              : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New here?{" "}

          <Link to="/register">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}