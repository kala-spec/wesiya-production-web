"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "./lib/api";

export default function Home() {
  const router = useRouter();
  const [backendMessage, setBackendMessage] = useState("Checking backend...");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health/`)
      .then((res) => res.json())
      .then((data) => {
        setBackendMessage(data.message);
      })
      .catch(() => {
        setBackendMessage("Backend is not connected");
      });
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
        padding: "32px",
      }}
    >
      <section style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <nav
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "18px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <strong style={{ color: "#16a34a", fontSize: "22px" }}>Wesiya</strong>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/trusted-login")}
              style={secondaryButton}
            >
              Trusted Login
            </button>

            <button onClick={() => router.push("/login")} style={secondaryButton}>
              Login
            </button>

            <button onClick={() => router.push("/signup")} style={primaryButton}>
              Create Account
            </button>
          </div>
        </nav>

        <section
          style={{
            marginTop: "28px",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #dcfce7, #ffffff)",
              border: "1px solid #bbf7d0",
              borderRadius: "28px",
              padding: "48px",
              boxShadow: "0 18px 45px rgba(0,0,0,0.08)",
            }}
          >
            <p
              style={{
                color: "#16a34a",
                fontWeight: "bold",
                letterSpacing: "0.8px",
                margin: "0 0 14px 0",
              }}
            >
              SECURE DIGITAL NOTES
            </p>

            <h1
              style={{
                fontSize: "52px",
                lineHeight: "1.05",
                margin: 0,
                color: "#111827",
              }}
            >
              Keep your notes, voice records, and trusted access in one safe place.
            </h1>

            <p
              style={{
                color: "#4b5563",
                lineHeight: "1.8",
                fontSize: "17px",
                marginTop: "22px",
                maxWidth: "700px",
              }}
            >
              Wesiya helps you save daily written notes, record voice notes, update
              important profile information, and give trusted people controlled access
              when needed.
            </p>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                marginTop: "30px",
              }}
            >
              <button onClick={() => router.push("/signup")} style={primaryButtonLarge}>
                Get Started
              </button>

              <button onClick={() => router.push("/login")} style={secondaryButtonLarge}>
                I already have an account
              </button>
            </div>
          </div>

          <aside
            style={{
              background: "#ffffff",
              borderRadius: "28px",
              padding: "30px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 18px 45px rgba(0,0,0,0.06)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>What Wesiya includes</h2>

            <div style={{ display: "grid", gap: "14px", marginTop: "20px" }}>
              <Feature icon="📝" title="Daily Notes" text="Write and save important updates." />
              <Feature icon="🎙️" title="Voice Notes" text="Record and upload audio memories." />
              <Feature icon="🤝" title="Trusted Access" text="Add people you trust with access codes." />
              <Feature icon="👤" title="Profile Info" text="Store personal and emergency details." />
            </div>

            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: backendMessage.includes("not connected") ? "#fee2e2" : "#ecfdf5",
                border: backendMessage.includes("not connected")
                  ? "1px solid #fecaca"
                  : "1px solid #bbf7d0",
                borderRadius: "16px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px 0",
                  color: backendMessage.includes("not connected") ? "#991b1b" : "#14532d",
                  fontWeight: "bold",
                }}
              >
                Backend Status
              </p>
              <p style={{ margin: 0, color: "#374151" }}>{backendMessage}</p>
            </div>
          </aside>
        </section>

        <section
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
          }}
        >
          <MiniCard title="For personal records" text="Keep track of thoughts, updates, and memories." />
          <MiniCard title="For voice messages" text="Record directly from the browser with microphone support." />
          <MiniCard title="For trusted people" text="Let selected contacts access allowed information only." />
        </section>
      </section>
    </main>
  );
}

const primaryButton: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "11px 16px",
  borderRadius: "12px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "#f0fdf4",
  color: "#14532d",
  border: "1px solid #bbf7d0",
  padding: "11px 16px",
  borderRadius: "12px",
  fontWeight: "bold",
  cursor: "pointer",
};

const primaryButtonLarge: React.CSSProperties = {
  ...primaryButton,
  padding: "14px 20px",
  borderRadius: "14px",
  fontSize: "15px",
};

const secondaryButtonLarge: React.CSSProperties = {
  ...secondaryButton,
  padding: "14px 20px",
  borderRadius: "14px",
  fontSize: "15px",
};

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        alignItems: "center",
        padding: "14px",
        borderRadius: "16px",
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "14px",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <p style={{ margin: "4px 0 0 0", color: "#6b7280" }}>{text}</p>
      </div>
    </div>
  );
}

function MiniCard({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "22px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: 0 }}>{text}</p>
    </div>
  );
}