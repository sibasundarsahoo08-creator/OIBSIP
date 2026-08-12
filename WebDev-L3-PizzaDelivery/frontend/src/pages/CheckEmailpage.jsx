import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MailCheck } from "lucide-react";

import api from "../api/api";

export default function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [loading, setLoading] = useState(false);

  const resendEmail = async () => {
    if (!email) {
      toast.error("Email address is missing");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/resend-verification", { email });
      toast.success("Verification email sent again");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to resend verification email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-badge">📨</div>
        <p className="eyebrow">One more step</p>
        <h1>Check your email</h1>

        <p className="muted">
          We sent a verification link to{" "}
          <strong>{email || "your email address"}</strong>.
          Open it to activate your account.
        </p>

        <button
          className="primary-button full-width"
          onClick={resendEmail}
          disabled={loading}
        >
          <MailCheck size={19} />
          {loading ? "Sending..." : "Resend verification email"}
        </button>

        <p className="auth-switch">
          Already verified? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}