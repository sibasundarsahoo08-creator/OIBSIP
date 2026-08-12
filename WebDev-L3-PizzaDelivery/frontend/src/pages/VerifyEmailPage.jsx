import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/api";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const requestStarted = useRef(false);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(
    "Verifying your email address..."
  );

  useEffect(() => {
    if (requestStarted.current) return;
    requestStarted.current = true;

    const verify = async () => {
      try {
        const response = await api.get(
          `/auth/verify-email/${token}`
        );

        setStatus("success");
        setMessage(response.data.message);
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Verification link is invalid or expired"
        );
      }
    };

    verify();
  }, [token]);

  return (
    <main className="auth-page">
      <section className="auth-card status-card">
        <div className="brand-badge">
          {status === "success"
            ? "✅"
            : status === "error"
              ? "❌"
              : "⏳"}
        </div>

        <p className="eyebrow">Email verification</p>

        <h1>
          {status === "loading"
            ? "Please wait"
            : status === "success"
              ? "Email verified"
              : "Verification failed"}
        </h1>

        <p className="muted">{message}</p>

        {status !== "loading" && (
          <Link className="primary-button button-link" to="/login">
            Continue to login
          </Link>
        )}
      </section>
    </main>
  );
}