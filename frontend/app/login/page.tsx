"use client";

import { useIsMobile } from "../hooks/useIsMobile";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info">("error");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setMessageType("error");

    const cleanIdentifier = identifier.trim().toLowerCase();

    if (!cleanIdentifier || !password.trim()) {
      setMessage("Please enter your username/email and password.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanIdentifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          data.error &&
          data.error.toLowerCase().includes("verify your email")
        ) {
          setMessageType("info");
          setMessage(
            "Your account was created, but your email is not verified yet. Please open the verification link from your email."
          );
          return;
        }

        setMessage(data.error || "Login failed. Please try again.");
        return;
      }

      localStorage.setItem("wesiya_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setMessage(
        "Could not connect to Wesiya backend. Please check if the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "18px" : "32px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "980px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          background: "#ffffff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 18px 45px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #dcfce7, #ffffff)",
            padding: isMobile ? "28px" : "44px",
            borderRight: isMobile ? "none" : "1px solid #e5e7eb",
            borderBottom: isMobile ? "1px solid #e5e7eb" : "none",
          }}
        >
          <p
            style={{
              color: "#16a34a",
              fontWeight: "bold",
              letterSpacing: "0.6px",
              margin: "0 0 12px 0",
            }}
          >
            WESIYA
          </p>

          <h1
            style={{
              fontSize: isMobile ? "28px" : "38px",
              lineHeight: "1.15",
              margin: 0,
              color: "#111827",
            }}
          >
            Secure notes for your life, voice, and trusted people.
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: "18px",
              lineHeight: "1.7",
              fontSize: "16px",
            }}
          >
            Login with your username or email to manage notes, voice records,
            profile information, and trusted access settings.
          </p>

          <div
            style={{
              marginTop: "30px",
              display: "grid",
              gap: "12px",
            }}
          >
            <Feature text="Username or email login" />
            <Feature text="Email verification required" />
            <Feature text="Daily written notes" />
            <Feature text="Voice note recording" />
            <Feature text="Trusted access portal" />
          </div>
        </div>

        <div style={{ padding: isMobile ? "28px" : "44px" }}>
          <h2 style={{ fontSize: "30px", margin: "0 0 8px 0" }}>
            Welcome back
          </h2>

          <p style={{ color: "#6b7280", marginBottom: "28px" }}>
            Login to continue to your Wesiya dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: "bold" }}>Username or Email</label>
              <input
                type="text"
                value={identifier}
                placeholder="Enter username or email"
                onChange={(e) => setIdentifier(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontWeight: "bold" }}>Password</label>
              <input
                type="password"
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "14px 18px",
                borderRadius: "14px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px",
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {message && (
            <p
              style={{
                marginTop: "16px",
                padding: "12px",
                background: messageType === "info" ? "#fef3c7" : "#fee2e2",
                border:
                  messageType === "info"
                    ? "1px solid #fde68a"
                    : "1px solid #fecaca",
                borderRadius: "12px",
                color: messageType === "info" ? "#92400e" : "#991b1b",
                lineHeight: "1.6",
              }}
            >
              {message}
            </p>
          )}

          {messageType === "info" && message && (
            <div
              style={{
                marginTop: "12px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "14px",
                padding: "14px",
                color: "#92400e",
                lineHeight: "1.6",
              }}
            >
              <strong>Email verification required:</strong> open your Wesiya
              verification link before logging in.
            </div>
          )}

          <p style={{ marginTop: "24px", color: "#6b7280" }}>
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              style={{
                background: "transparent",
                border: "none",
                color: "#16a34a",
                fontWeight: "bold",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Create one
            </button>
          </p>

          <button
            onClick={() => router.push("/trusted-login")}
            style={{
              marginTop: "18px",
              width: "100%",
              background: "#f0fdf4",
              color: "#14532d",
              border: "1px solid #bbf7d0",
              padding: "13px 18px",
              borderRadius: "14px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Trusted Contact Login
          </button>
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  marginTop: "8px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  outline: "none",
  background: "#ffffff",
  color: "#111827",
};

function Feature({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #bbf7d0",
        borderRadius: "14px",
        padding: "13px",
        color: "#14532d",
        fontWeight: "bold",
      }}
    >
      ✓ {text}
    </div>
  );
}