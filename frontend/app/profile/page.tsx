"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "../hooks/useIsMobile";
import { API_BASE_URL } from "../lib/api";

type WesiyaUser = {
  id: number;
  username: string;
  email: string;
};

type Profile = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  height: string;
  emergency_note: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<WesiyaUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [height, setHeight] = useState("");
  const [emergencyNote, setEmergencyNote] = useState("");

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
    fetchProfile(parsedUser.id);
  }, [router]);

  async function fetchProfile(userId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/user/${userId}/`);
      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setFullName(data.profile.full_name || "");
        setPhone(data.profile.phone || "");
        setDateOfBirth(data.profile.date_of_birth || "");
        setHeight(data.profile.height || "");
        setEmergencyNote(data.profile.emergency_note || "");
      }
    } catch {
      setMessage("Could not load profile");
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setMessage("You must login first");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          full_name: fullName,
          phone,
          date_of_birth: dateOfBirth,
          height,
          emergency_note: emergencyNote,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not update profile");
        return;
      }

      setProfile(data.profile);
      setMessage("Profile updated successfully!");
    } catch {
      setMessage("Could not connect to Wesiya backend");
    } finally {
      setLoading(false);
    }
  }

  if (!user || !profile) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          color: "#111827",
          padding: isMobile ? "18px" : "32px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Loading profile...</p>
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
        padding: "32px",
      }}
    >
      <section style={{ maxWidth: "1050px", margin: "0 auto" }}>
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
          <p
            style={{
              color: "#16a34a",
              fontWeight: "bold",
              margin: isMobile ? "0 auto 18px auto" : "0 0 18px 0",
            }}
          >
            PROFILE
          </p>

          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "34px" }}>
            Your Wesiya Profile
          </h1>

          <p style={{ color: "#6b7280", marginTop: "10px" }}>
            Keep your personal and emergency information updated.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(260px, 340px) 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <aside
            style={{
              background: "linear-gradient(135deg, #dcfce7, #ffffff)",
              border: "1px solid #bbf7d0",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "20px",
                background: "#16a34a",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: "bold",
                marginBottom: "18px",
              }}
            >
              {profile.username.charAt(0).toUpperCase()}
            </div>

            <h2 style={{ marginTop: 0 }}>{profile.username}</h2>

            <p style={{ color: "#6b7280", wordBreak: "break-word" }}>
              {profile.email}
            </p>

            <div
              style={{
                marginTop: "20px",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid #d1fae5",
              }}
            >
              <p style={{ margin: "0 0 6px 0", color: "#6b7280" }}>Full Name</p>
              <strong>{profile.full_name || "Not added yet"}</strong>
            </div>

            <div
              style={{
                marginTop: "12px",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid #d1fae5",
              }}
            >
              <p style={{ margin: "0 0 6px 0", color: "#6b7280" }}>Phone</p>
              <strong>{profile.phone || "Not added yet"}</strong>
            </div>
          </aside>

          <form
            onSubmit={handleUpdateProfile}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "24px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Edit Profile Details</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Height</label>
                <input
                  type="text"
                  value={height}
                  placeholder="Example: 175 cm"
                  onChange={(e) => setHeight(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Emergency / Tailoring Note</label>
              <textarea
                value={emergencyNote}
                onChange={(e) => setEmergencyNote(e.target.value)}
                rows={6}
                placeholder="Write any important information here..."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "20px",
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "13px 18px",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
                width: isMobile ? "100%" : "auto",
              }}
            >
              {loading ? "Saving..." : "Save Profile"}
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
        </section>
      </section>
    </main>
  );
}