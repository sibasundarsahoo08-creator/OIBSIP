import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

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

    setSubmitting(true);

    try {
      await register(form.name, form.email, form.password);
      toast.success("Verification email sent");
      navigate(
        `/check-email?email=${encodeURIComponent(form.email)}`
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Unable to create account";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-badge">🍕</div>
        <p className="eyebrow">Join Pizza Delivery</p>
        <h1>Create your account</h1>
        <p className="muted">
          Build your pizza and follow every order.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              name="name"
              required
              minLength="2"
              value={form.name}
              onChange={updateField}
              placeholder="Your full name"
            />
          </label>

          <label>
            Email address 
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={updateField}
              placeholder="Minimum 8 characters"
            />
          </label>

          <label>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={updateField}
              placeholder="Enter password again"
            />
          </label>

          <button
            className="primary-button"
            disabled={submitting}
          >
            <UserPlus size={19} />
            {submitting
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}