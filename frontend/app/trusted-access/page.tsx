"use client";

import { useIsMobile } from "../hooks/useIsMobile";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/api";

type WesiyaUser = {
  id: number;
  username: string;
  email: string;
};

type TrustedContact = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  relationship: string;
  access_code: string;
  can_view_notes: boolean;
  can_view_profile: boolean;
  created_at: string;
};

export default function TrustedAccessPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<WesiyaUser | null>(null);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("wesiya_user");

    if (!savedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchTrustedContacts(parsedUser.id);
  }, [router]);

  async function fetchTrustedContacts(userId: number) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/trusted-access/user/${userId}/`
      );
      const data = await response.json();

      if (response.ok) {
        setContacts(data.trusted_contacts);
      }
    } catch {
      setMessage("Could not load trusted contacts");
    }
  }

  async function handleCreateContact(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setMessage("You must login first");
      return;
    }

    if (!fullName.trim() || !accessCode.trim()) {
      setMessage("Full name and access code are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/trusted-access/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            full_name: fullName,
            phone,
            email,
            relationship,
            access_code: accessCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not create trusted contact");
        return;
      }

      setMessage("Trusted contact added successfully!");

      setFullName("");
      setPhone("");
      setEmail("");
      setRelationship("");
      setAccessCode("");

      fetchTrustedContacts(user.id);
    } catch {
      setMessage("Could not connect to Wesiya backend");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", background: "#f3f4f6", padding: "40px" }}>
        <p>Loading trusted access...</p>
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
          onClick={() => router.push("/dashboard")}
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
          ← Back to Dashboard
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
            TRUSTED ACCESS
          </p>

          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "34px" }}>
            Trusted Contacts
          </h1>

          <p style={{ color: "#6b7280", marginTop: "10px" }}>
            Add people you trust. They can use their access code later through the
            trusted login portal.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(280px, 420px) 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <form
            onSubmit={handleCreateContact}
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
            <h2 style={{ marginTop: 0 }}>Add Trusted Contact</h2>

            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
              Give this person an access code. They will need their email or phone,
              your username, and this code to access allowed information.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Example: Mohammed Ali"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Relationship</label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Brother, friend, spouse..."
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Access Code</label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Example: family123"
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
              {loading ? "Saving..." : "Add Contact"}
            </button>

            {message && (
              <p
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  color: "#14532d",
                }}
              >
                {message}
              </p>
            )}
          </form>

          <section>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ margin: 0 }}>Your Contacts</h2>

              <button
                onClick={() => router.push("/trusted-login")}
                style={{
                  background: "#14532d",
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Test Trusted Login
              </button>
            </div>

            {contacts.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "30px",
                  border: "1px solid #e5e7eb",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No trusted contacts yet. Add your first trusted person.
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    padding: "24px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                    marginBottom: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "16px",
                        background: "#dcfce7",
                        color: "#14532d",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "22px",
                      }}
                    >
                      {contact.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h3 style={{ margin: 0 }}>{contact.full_name}</h3>
                      <p style={{ margin: "6px 0 0 0", color: "#6b7280" }}>
                        {contact.relationship || "Relationship not provided"}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <InfoBox label="Phone" value={contact.phone || "Not provided"} />
                    <InfoBox label="Email" value={contact.email || "Not provided"} />
                    <InfoBox label="Access Code" value={contact.access_code} />
                    <InfoBox
                      label="Permissions"
                      value={`${contact.can_view_notes ? "Notes" : ""}${
                        contact.can_view_notes && contact.can_view_profile ? " + " : ""
                      }${contact.can_view_profile ? "Profile" : ""}`}
                    />
                  </div>
                </div>
              ))
            )}
          </section>
        </section>
      </section>
    </main>
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
      }}
    >
      <p style={{ margin: "0 0 6px 0", color: "#6b7280", fontSize: "14px" }}>
        {label}
      </p>
      <strong style={{ wordBreak: "break-word" }}>{value}</strong>
    </div>
  );
}