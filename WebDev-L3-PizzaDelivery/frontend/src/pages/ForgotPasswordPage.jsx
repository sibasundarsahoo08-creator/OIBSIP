import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";

import api from "../api/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Password reset email sent");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to send reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-badge">📧</div>
        <p className="eyebrow">Account recovery</p>
        <h1>Forgot password?</h1>

        {submitted ? (
          <div className="success-message">
            <h3>Check your email</h3>
            <p>
              If an account exists for <strong>{email}</strong>,
              you will receive a password-reset link.
            </p>
          </div>
        ) : (
          <>
            <p className="muted">
              Enter your registered email address and we will
              send you a secure reset link.
            </p>

            <form onSubmit={handleSubmit}>
              <label>
                Email address
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                />
              </label>

              <button
                className="primary-button"
                disabled={loading}
              >
                <Mail size={19} />
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch">
          <Link to="/login">Return to login</Link>
        </p>
      </section>
    </main>
  );
}