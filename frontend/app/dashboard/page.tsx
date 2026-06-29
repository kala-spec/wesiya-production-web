"use client";

import { useIsMobile } from "../hooks/useIsMobile";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WesiyaUser = {
  id: number;
  username: string;
  email: string;
  is_superuser?: boolean;
};

type FeatureCard = {
  title: string;
  description: string;
  button: string;
  path: string;
  emoji: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<WesiyaUser | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("wesiya_user");

    if (!savedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(savedUser));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("wesiya_user");
    router.push("/login");
  }

  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          color: "#111827",
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Loading dashboard...</p>
      </main>
    );
  }

  const features: FeatureCard[] = [
    {
      title: "Write Note",
      description: "Save a private written note for yourself.",
      button: "Write a Note",
      path: "/notes",
      emoji: "✍️",
    },
    {
      title: "Record Voice",
      description: "Record your voice and save a memory or update.",
      button: "Record Voice",
      path: "/voice-notes",
      emoji: "🎙️",
    },
    {
      title: "Trusted Contacts",
      description: "Choose who can access your information when needed.",
      button: "Manage Contacts",
      path: "/trusted-access",
      emoji: "🤝",
    },
  ];

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "20px",
    padding: isMobile ? "20px" : "24px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #e5e7eb",
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    width: isMobile ? "100%" : "auto",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
        padding: isMobile ? "18px" : "32px",
      }}
    >
      <section style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <header
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: isMobile ? "22px" : "24px",
            display: "flex",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 8px 0",
                color: "#16a34a",
                fontWeight: "bold",
                letterSpacing: "0.5px",
              }}
            >
              WESIYA
            </p>

            <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "36px" }}>
              Welcome back, {user.username}
            </h1>

            <p style={{ color: "#6b7280", marginTop: "10px", fontSize: "16px" }}>
              What do you want to save today?
            </p>

            <p
              style={{
                margin: "10px 0 0 0",
                color: "#6b7280",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
            >
              Save private notes, voice memories, and trusted access information in
              one simple place.
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              padding: "12px 18px",
              borderRadius: "12px",
              width: isMobile ? "100%" : "auto",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </header>

        <section
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {features.map((feature) => {
            const isHovered = hoveredCard === feature.title;

            return (
              <div
                key={feature.title}
                onMouseEnter={() => setHoveredCard(feature.title)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => router.push(feature.path)}
                style={{
                  background: isHovered ? "#ecfdf5" : "#ffffff",
                  border: isHovered ? "1px solid #22c55e" : "1px solid #e5e7eb",
                  borderRadius: "20px",
                  padding: "24px",
                  cursor: "pointer",
                  boxShadow: isHovered
                    ? "0 18px 35px rgba(34,197,94,0.18)"
                    : "0 8px 24px rgba(0,0,0,0.05)",
                  transform: isHovered ? "translateY(-5px)" : "translateY(0)",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "16px",
                    background: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    marginBottom: "18px",
                  }}
                >
                  {feature.emoji}
                </div>

                <h3 style={{ margin: "0 0 10px 0", fontSize: "21px" }}>
                  {feature.title}
                </h3>

                <p
                  style={{
                    color: "#6b7280",
                    lineHeight: "1.5",
                    minHeight: isMobile ? "auto" : "48px",
                  }}
                >
                  {feature.description}
                </p>

                <button
                  style={{
                    marginTop: "14px",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "11px 16px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  {feature.button}
                </button>
              </div>
            );
          })}
        </section>

        <section
          style={{
            marginTop: "24px",
            background: "linear-gradient(135deg, #dcfce7, #ffffff)",
            border: "1px solid #bbf7d0",
            borderRadius: "20px",
            padding: isMobile ? "20px" : "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#14532d" }}>Your Account</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid #d1fae5",
              }}
            >
              <p style={{ margin: 0, color: "#6b7280" }}>Username</p>
              <strong>{user.username}</strong>
            </div>

            <div
              style={{
                background: "white",
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid #d1fae5",
              }}
            >
              <p style={{ margin: 0, color: "#6b7280" }}>Email</p>
              <strong>{user.email || "No email added"}</strong>
            </div>

            {user.is_superuser && (
              <div
                style={{
                  background: "white",
                  padding: "16px",
                  borderRadius: "14px",
                  border: "1px solid #d1fae5",
                }}
              >
                <p style={{ margin: 0, color: "#6b7280" }}>Role</p>
                <strong style={{ color: "#14532d" }}>Super Admin</strong>
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            marginTop: "24px",
            ...cardStyle,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "20px" }}>Account Actions</h2>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => router.push("/profile")}
              style={secondaryButtonStyle}
            >
              Profile
            </button>

            {user.is_superuser && (
              <button
                onClick={() => router.push("/super-admin")}
                style={{
                  background: "#dcfce7",
                  color: "#14532d",
                  border: "1px solid #bbf7d0",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Super Admin
              </button>
            )}

            <button
              onClick={() => router.push("/trusted-login")}
              style={secondaryButtonStyle}
            >
              Test Trusted Login
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                border: "1px solid #fecaca",
                padding: "12px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Logout
            </button>
          </div>
        </section>

        <section
          style={{
            marginTop: "24px",
            background: "#f0fdf4",
            borderRadius: "20px",
            padding: isMobile ? "20px" : "24px",
            border: "1px solid #bbf7d0",
            color: "#14532d",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "20px" }}>Your privacy matters</h2>

          <p style={{ margin: 0, lineHeight: "1.6" }}>
            Wesiya is built to help you save private notes, voice memories, and
            trusted contact information in a simple and secure way.
          </p>
        </section>

        <section
          style={{
            marginTop: "24px",
            ...cardStyle,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "20px" }}>Recent Activity</h2>

          <div
            style={{
              display: "grid",
              gap: "12px",
              color: "#6b7280",
              lineHeight: "1.6",
            }}
          >
            <p style={{ margin: 0 }}>✍️ Your written notes will appear here.</p>
            <p style={{ margin: 0 }}>🎙️ Your recent voice notes will appear here.</p>
            <p style={{ margin: 0 }}>🤝 Trusted contact updates will appear here.</p>
          </div>
        </section>

        <section
          style={{
            marginTop: "28px",
            background: "#ffffff",
            borderRadius: "20px",
            padding: isMobile ? "20px" : "24px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: "20px",
          }}
        >
          <div>
            <h3 style={{ marginTop: 0 }}>Trusted Contact Portal</h3>
            <p style={{ color: "#6b7280", marginBottom: 0, lineHeight: "1.6" }}>
              For trusted people who were given access to your information.
            </p>
          </div>

          <button
            onClick={() => router.push("/trusted-login")}
            style={{
              background: "#14532d",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
            }}
          >
            Open Trusted Login
          </button>
        </section>
      </section>
    </main>
  );
}