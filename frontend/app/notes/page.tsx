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

type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
};

type NoteAnalysis = {
  summary: string;
  key_points: string[];
  action_items: string[];
  emotional_tone: string;
  risk_level: string;
};

export default function NotesPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<WesiyaUser | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [analyses, setAnalyses] = useState<Record<number, NoteAnalysis>>({});

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzingNoteId, setAnalyzingNoteId] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("wesiya_user");

    if (!savedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchNotes(parsedUser.id);
  }, [router]);

  async function fetchNotes(userId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/user/${userId}/`);
      const data = await response.json();

      if (response.ok) {
        setNotes(data.notes);
      }
    } catch {
      setMessage("Could not load notes");
    }
  }

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setMessage("You must login first");
      return;
    }

    if (!content.trim()) {
      setMessage("Please write a note before saving.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          title,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not create note");
        return;
      }

      setMessage("Note saved successfully!");
      setTitle("");
      setContent("");
      fetchNotes(user.id);
    } catch {
      setMessage("Could not connect to Wesiya backend");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyzeNote(noteId: number) {
    setAnalyzingNoteId(noteId);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/analyze/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note_id: noteId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not analyze note");
        return;
      }

      setAnalyses((prev) => ({
        ...prev,
        [noteId]: data.analysis,
      }));

      setMessage("Note analyzed successfully!");
    } catch {
      setMessage("Could not connect to Wesiya backend");
    } finally {
      setAnalyzingNoteId(null);
    }
  }

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", background: "#f3f4f6", padding: "40px" }}>
        <p>Loading notes...</p>
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
            DAILY NOTES
          </p>

          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "34px" }}>
            Write a Private Note
          </h1>

          <p style={{ color: "#6b7280", marginTop: "10px", lineHeight: "1.6" }}>
            Write freely. This note is saved only for you.
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
            onSubmit={handleCreateNote}
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
            <h2 style={{ marginTop: 0 }}>What do you want to save?</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: "bold" }}>Title</label>
              <input
                type="text"
                value={title}
                placeholder="Example: Important reminder"
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px",
                  marginTop: "8px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: "bold" }}>Note</label>
              <textarea
                value={content}
                placeholder="Write your note here..."
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px",
                  marginTop: "8px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                  resize: "vertical",
                }}
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
              {loading ? "Saving..." : "Save Private Note"}
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
            <h2 style={{ marginTop: 0 }}>Saved Notes</h2>

            {notes.length === 0 ? (
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
                No notes yet. Write your first private note when you are ready.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
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
                      justifyContent: "space-between",
                      gap: "16px",
                      flexWrap: "wrap",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "center",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>{note.title || "Untitled Note"}</h3>
                      <small style={{ color: "#6b7280" }}>
                        {new Date(note.created_at).toLocaleString()}
                      </small>
                    </div>

                    <button
                      onClick={() => handleAnalyzeNote(note.id)}
                      disabled={analyzingNoteId === note.id}
                      style={{
                        background: "#14532d",
                        color: "white",
                        border: "none",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        cursor:
                          analyzingNoteId === note.id ? "not-allowed" : "pointer",
                        opacity: analyzingNoteId === note.id ? 0.75 : 1,
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
                      {analyzingNoteId === note.id ? "Analyzing..." : "Analyze"}
                    </button>
                  </div>

                  <p style={{ lineHeight: "1.7", color: "#374151" }}>{note.content}</p>

                  {analyses[note.id] && (
                    <div
                      style={{
                        marginTop: "18px",
                        padding: "18px",
                        borderRadius: "16px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <h4 style={{ marginTop: 0 }}>Analysis Result</h4>

                      <p>
                        <strong>Summary:</strong> {analyses[note.id].summary}
                      </p>

                      <p>
                        <strong>Tone:</strong> {analyses[note.id].emotional_tone}
                      </p>

                      <p>
                        <strong>Risk:</strong> {analyses[note.id].risk_level}
                      </p>

                      <strong>Key Points:</strong>
                      <ul>
                        {analyses[note.id].key_points.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>

                      <strong>Action Items:</strong>
                      {analyses[note.id].action_items.length === 0 ? (
                        <p>No action items found.</p>
                      ) : (
                        <ul>
                          {analyses[note.id].action_items.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        </section>
      </section>
    </main>
  );
}