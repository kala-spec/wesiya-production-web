"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "../hooks/useIsMobile";
import { API_BASE_URL } from "../lib/api";

type WesiyaUser = {
  id: number;
  username: string;
  email: string;
  is_superuser?: boolean;
};

type AdminStats = {
  total_users: number;
  verified_users: number;
  unverified_users: number;
  total_notes: number;
  total_voice_notes: number;
  total_saved_items: number;
};

type AdminUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  location: string;
  country?: string;
  city?: string;
  is_superuser: boolean;
  is_verified: boolean;
  verification_status: string;
  notes_count: number;
  voice_notes_count: number;
  total_saved_items: number;
  date_joined: string;
};

type VerificationFilter = "all" | "completed" | "not_completed";

const emptyStats: AdminStats = {
  total_users: 0,
  verified_users: 0,
  unverified_users: 0,
  total_notes: 0,
  total_voice_notes: 0,
  total_saved_items: 0,
};

export default function SuperAdminPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [currentUser, setCurrentUser] = useState<WesiyaUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("wesiya_user");

    if (!savedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setCurrentUser(parsedUser);

    if (!parsedUser.is_superuser) {
      setMessage("Access denied. This page is only for super admin.");
      setLoading(false);
      return;
    }

    fetchUsers(parsedUser.id);
  }, [router]);

  async function fetchUsers(userId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin-panel/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not load users.");
        setLoading(false);
        return;
      }

      setUsers(data.users || []);
      setStats(data.stats || emptyStats);
      setLoading(false);
    } catch {
      setMessage("Could not connect to Wesiya backend.");
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesVerification =
      verificationFilter === "all" ||
      (verificationFilter === "completed" && user.is_verified) ||
      (verificationFilter === "not_completed" && !user.is_verified);

    if (!matchesVerification) return false;

    if (!search) return true;

    return (
      (user.name || "").toLowerCase().includes(search) ||
      (user.username || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.phone || "").toLowerCase().includes(search) ||
      (user.country || "").toLowerCase().includes(search) ||
      (user.city || "").toLowerCase().includes(search) ||
      (user.location || "").toLowerCase().includes(search) ||
      (user.verification_status || "").toLowerCase().includes(search)
    );
  });

  function getFilterButtonStyle(filter: VerificationFilter): React.CSSProperties {
    const active = verificationFilter === filter;

    return {
      background: active ? "#16a34a" : "#ffffff",
      color: active ? "#ffffff" : "#111827",
      border: active ? "1px solid #16a34a" : "1px solid #d1d5db",
      padding: "10px 13px",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: "bold",
    };
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: "32px",
          fontFamily: "Arial, sans-serif",
          color: "#111827",
        }}
      >
        <p>Loading super admin...</p>
      </main>
    );
  }

  if (message && !currentUser?.is_superuser) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: isMobile ? "18px" : "32px",
          fontFamily: "Arial, sans-serif",
          color: "#111827",
        }}
      >
        <section
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "20px",
            padding: "26px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h1>Access denied</h1>

          <p style={{ color: "#6b7280", lineHeight: "1.6" }}>{message}</p>

          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "12px 16px",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </section>
      </main>
    );
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
      <section style={{ maxWidth: "1350px", margin: "0 auto" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            width: isMobile ? "100%" : "auto",
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
            padding: isMobile ? "22px" : "26px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              color: "#16a34a",
              fontWeight: "bold",
              margin: "0 0 8px 0",
            }}
          >
            SUPER ADMIN
          </p>

          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "34px" }}>
            Wesiya Users
          </h1>

          <p style={{ color: "#6b7280", marginTop: "10px", lineHeight: "1.6" }}>
            View users, country, city, verification status, written notes, and voice records.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(6, 1fr)",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <StatCard title="Total Users" value={stats.total_users} />
          <StatCard title="Completed" value={stats.verified_users} />
          <StatCard title="Not Completed" value={stats.unverified_users} />
          <StatCard title="Written Notes" value={stats.total_notes} />
          <StatCard title="Voice Notes" value={stats.total_voice_notes} />
          <StatCard title="Saved Items" value={stats.total_saved_items} />
        </section>

        {message && (
          <p
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              padding: "12px",
              borderRadius: "12px",
              lineHeight: "1.6",
            }}
          >
            {message}
          </p>
        )}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: isMobile ? "18px" : "24px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "center",
              flexDirection: isMobile ? "column" : "row",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Users List</h2>
              <p style={{ color: "#6b7280", margin: "8px 0 0 0" }}>
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={() => setVerificationFilter("all")}
              style={getFilterButtonStyle("all")}
            >
              All ({stats.total_users})
            </button>

            <button
              onClick={() => setVerificationFilter("completed")}
              style={getFilterButtonStyle("completed")}
            >
              Completed ({stats.verified_users})
            </button>

            <button
              onClick={() => setVerificationFilter("not_completed")}
              style={getFilterButtonStyle("not_completed")}
            >
              Not Completed ({stats.unverified_users})
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              Search users
            </label>

            <input
              type="text"
              value={searchTerm}
              placeholder="Search by email, phone, username, name, country, city, or status..."
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px",
                borderRadius: "12px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "15px",
                background: "#ffffff",
                color: "#111827",
              }}
            />

            {(searchTerm || verificationFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setVerificationFilter("all");
                }}
                style={{
                  marginTop: "10px",
                  background: "#f3f4f6",
                  color: "#111827",
                  border: "1px solid #e5e7eb",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredUsers.length === 0 ? (
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              No users match your filters.
            </div>
          ) : isMobile ? (
            <div style={{ display: "grid", gap: "14px" }}>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "16px",
                    background: "#f9fafb",
                  }}
                >
                  <h3 style={{ margin: "0 0 8px 0" }}>
                    {user.name || "No name"}
                  </h3>

                  <StatusBadge isVerified={user.is_verified} />

                  <p style={mobileTextStyle}>Username: {user.username}</p>
                  <p style={mobileTextStyle}>Email: {user.email || "Not added"}</p>
                  <p style={mobileTextStyle}>Phone: {user.phone || "Not added"}</p>
                  <p style={mobileTextStyle}>
                    Country: {user.country || "Not added"}
                  </p>
                  <p style={mobileTextStyle}>City: {user.city || "Not added"}</p>
                  <p style={mobileTextStyle}>
                    Location: {user.location || "Not added"}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <MiniCount title="Notes" value={user.notes_count} />
                    <MiniCount title="Voice" value={user.voice_notes_count} />
                    <MiniCount title="Total" value={user.total_saved_items} />
                  </div>

                  {user.is_superuser && (
                    <p
                      style={{
                        display: "inline-block",
                        marginTop: "12px",
                        background: "#dcfce7",
                        color: "#14532d",
                        padding: "5px 10px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      Super Admin
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left", color: "#6b7280" }}>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Username</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Phone</th>
                    <th style={tableHeaderStyle}>Country</th>
                    <th style={tableHeaderStyle}>City</th>
                    <th style={tableHeaderStyle}>Location</th>
                    <th style={tableHeaderStyle}>Verification</th>
                    <th style={tableHeaderStyle}>Notes</th>
                    <th style={tableHeaderStyle}>Voice</th>
                    <th style={tableHeaderStyle}>Total</th>
                    <th style={tableHeaderStyle}>Role</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={tableCellStyle}>{user.name || "No name"}</td>
                      <td style={tableCellStyle}>{user.username}</td>
                      <td style={tableCellStyle}>{user.email || "Not added"}</td>
                      <td style={tableCellStyle}>{user.phone || "Not added"}</td>
                      <td style={tableCellStyle}>{user.country || "Not added"}</td>
                      <td style={tableCellStyle}>{user.city || "Not added"}</td>
                      <td style={tableCellStyle}>{user.location || "Not added"}</td>
                      <td style={tableCellStyle}>
                        <StatusBadge isVerified={user.is_verified} />
                      </td>
                      <td style={tableCellStyle}>{user.notes_count}</td>
                      <td style={tableCellStyle}>{user.voice_notes_count}</td>
                      <td style={tableCellStyle}>{user.total_saved_items}</td>
                      <td style={tableCellStyle}>
                        {user.is_superuser ? "Super Admin" : "User"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #f3f4f6",
  whiteSpace: "nowrap",
};

const mobileTextStyle: React.CSSProperties = {
  margin: "4px 0",
  color: "#6b7280",
};

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 8px 22px rgba(0,0,0,0.04)",
      }}
    >
      <p
        style={{
          margin: "0 0 8px 0",
          color: "#6b7280",
          fontSize: "13px",
          fontWeight: "bold",
        }}
      >
        {title}
      </p>

      <h2 style={{ margin: 0, fontSize: "26px" }}>{value}</h2>
    </div>
  );
}

function StatusBadge({ isVerified }: { isVerified: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: isVerified ? "#dcfce7" : "#fef3c7",
        color: isVerified ? "#14532d" : "#92400e",
        padding: "5px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "bold",
        whiteSpace: "nowrap",
      }}
    >
      {isVerified ? "Completed" : "Not completed"}
    </span>
  );
}

function MiniCount({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "10px",
        textAlign: "center",
      }}
    >
      <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
        {title}
      </p>

      <strong>{value}</strong>
    </div>
  );
}