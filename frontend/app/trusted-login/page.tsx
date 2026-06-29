"use client";

import { useIsMobile } from "../hooks/useIsMobile";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/api";

type TrustedAccessResult = {
  message: string;
  owner: {
    username: string;
    email: string;
  };
  trusted_contact: {
    full_name: string;
    relationship: string;
  };
  profile: {
    full_name: string;
    phone: string;
    date_of_birth: string;
    height: string;
    emergency_note: string;
  } | null;
  notes: {
    id: number;
    title: string;
    content: string;
    created_at: string;
  }[];
};

export default function TrustedLoginPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [ownerUsername, setOwnerUsername] = useState("");
  const [contactIdentity, setContactIdentity] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [result, setResult] = useState<TrustedAccessResult | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);
    setResult(null);

    if (!ownerUsername.trim() || !contactIdentity.trim() || !accessCode.trim()) {
      setMessage("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/trusted-access/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner_username: ownerUsername,
          contact_identity: contactIdentity,
          access_code: accessCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Trusted access failed");
        return;
      }

      setResult(data);
      setSuccess(true);
      setMessage("Trusted access granted.");
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
        padding: isMobile ? "18px" : "32px",
      }}
    >
      <section style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <button
          onClick={() => router.push("/login")}
          style={{
            background: "#e5e7eb",
            color: "#111827",
            border: "none",
            padding: "10px 16px",
            borderRadius: "12px",
            cursor: "pointer",
            marginBottom: "20px",
            width: isMobile ? "100%" : "auto",
          }}
        >
          ← Back to Login
        </button>

        <header
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "26px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <p style={{ color: "#16a34a", fontWeight: "bold", margin: "0 0 8px 0" }}>
            TRUSTED CONTACT PORTAL
          </p>

          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "34px" }}>
            Access Shared Wesiya Information
          </h1>

          <p style={{ color: "#6b7280", marginTop: "10px", lineHeight: "1.6" }}>
            Use this page only if someone added you as a trusted contact and gave
            you an access code.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : result
              ? "minmax(300px, 420px) 1fr"
              : "minmax(300px, 460px) 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <form
            onSubmit={handleVerify}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "24px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              position: isMobile ? "static" : "sticky",
              top: isMobile ? "auto" : "24px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Verify Access</h2>

            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
              Enter the account owner username, your email or phone, and the
              access code you received.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Account Owner Username</label>
              <input
                type="text"
                value={ownerUsername}
                onChange={(e) => setOwnerUsername(e.target.value)}
                placeholder="Example: khalid"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Your Email or Phone</label>
              <input
                type="text"
                value={contactIdentity}
                onChange={(e) => setContactIdentity(e.target.value)}
                placeholder="Email or phone saved by owner"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Access Code</label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
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
                padding: "13px 18px",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? "Checking..." : "Access Information"}
            </button>

            {message && (
              <p
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: success ? "#ecfdf5" : "#fee2e2",
                  border: success ? "1px solid #bbf7d0" : "1px solid #fecaca",
                  borderRadius: "12px",
                  color: success ? "#14532d" : "#991b1b",
                }}
              >
                {message}
              </p>
            )}
          </form>

          <section>
            {!result ? (
              <div
                style={{
                  background: "linear-gradient(135deg, #dcfce7, #ffffff)",
                  border: "1px solid #bbf7d0",
                  borderRadius: "20px",
                  padding: "30px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                }}
              >
                <h2 style={{ marginTop: 0, color: "#14532d" }}>
                  How this works
                </h2>

                <div style={{ display: "grid", gap: "14px" }}>
                  <Step
                    number="1"
                    text="The account owner adds you as a trusted contact."
                  />
                  <Step number="2" text="They give you an access code." />
                  <Step
                    number="3"
                    text="You enter your email or phone and the code here."
                  />
                  <Step
                    number="4"
                    text="Wesiya shows only the information they allowed."
                  />
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    padding: "24px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                    marginBottom: "18px",
                  }}
                >
                  <p
                    style={{
                      color: "#16a34a",
                      fontWeight: "bold",
                      margin: "0 0 8px 0",
                    }}
                  >
                    ACCESS GRANTED
                  </p>

                  <h2 style={{ marginTop: 0 }}>Trusted Contact</h2>

                  <InfoBox
                    label="Your Name"
                    value={result.trusted_contact.full_name}
                  />
                  <InfoBox
                    label="Relationship"
                    value={result.trusted_contact.relationship || "Not provided"}
                  />
                  <InfoBox label="Account Owner" value={result.owner.username} />
                </div>

                {result.profile && (
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "20px",
                      padding: "24px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                      marginBottom: "18px",
                    }}
                  >
                    <h2 style={{ marginTop: 0 }}>Shared Profile</h2>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <InfoBox
                        label="Full Name"
                        value={result.profile.full_name || "Not provided"}
                      />
                      <InfoBox
                        label="Phone"
                        value={result.profile.phone || "Not provided"}
                      />
                      <InfoBox
                        label="Date of Birth"
                        value={result.profile.date_of_birth || "Not provided"}
                      />
                      <InfoBox
                        label="Height"
                        value={result.profile.height || "Not provided"}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "14px",
                        padding: "14px",
                      }}
                    >
                      <p style={{ margin: "0 0 6px 0", color: "#6b7280" }}>
                        Emergency Note
                      </p>
                      <strong>
                        {result.profile.emergency_note || "Not provided"}
                      </strong>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    padding: "24px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                  }}
                >
                  <h2 style={{ marginTop: 0 }}>Shared Notes</h2>

                  {result.notes.length === 0 ? (
                    <p style={{ color: "#6b7280" }}>No notes are available.</p>
                  ) : (
                    result.notes.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          marginTop: "14px",
                          padding: "16px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "14px",
                          background: "#f9fafb",
                        }}
                      >
                        <h3 style={{ marginTop: 0 }}>
                          {note.title || "Untitled Note"}
                        </h3>
                        <p style={{ lineHeight: "1.6", color: "#374151" }}>
                          {note.content}
                        </p>
                        <small style={{ color: "#6b7280" }}>
                          {new Date(note.created_at).toLocaleString()}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  outline: "none",
  background: "#ffffff",
  color: "#111827",
};

const labelStyle: React.CSSProperties = {
  fontWeight: "bold",
  color: "#111827",
};

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        alignItems: "center",
        background: "#ffffff",
        border: "1px solid #bbf7d0",
        borderRadius: "14px",
        padding: "14px",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "#16a34a",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <strong style={{ color: "#14532d" }}>{text}</strong>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      <p style={{ margin: "0 0 6px 0", color: "#6b7280", fontSize: "14px" }}>
        {label}
      </p>
      <strong style={{ wordBreak: "break-word" }}>{value}</strong>
    </div>
  );
}