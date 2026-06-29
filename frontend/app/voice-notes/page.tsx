"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "../hooks/useIsMobile";
import { API_BASE_URL } from "../lib/api";

type WesiyaUser = {
  id: number;
  username: string;
  email: string;
};

type VoiceNote = {
  id: number;
  title: string;
  audio_url: string;
  created_at: string;
};

export default function VoiceNotesPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<WesiyaUser | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);

  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState("");

  const [volumeLevel, setVolumeLevel] = useState(0);
  const [soundDetected, setSoundDetected] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("wesiya_user");

    if (!savedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchVoiceNotes(parsedUser.id);
  }, [router]);

  useEffect(() => {
    return () => {
      stopVolumeDetection();
      stopMicrophoneStream();

      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  function showMessage(
    text: string,
    type: "success" | "error" | "info" = "info"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  async function fetchVoiceNotes(userId: number) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notes/voice/user/${userId}/`
      );

      const data = await response.json();

      if (response.ok) {
        setVoiceNotes(data.voice_notes);
      }
    } catch {
      showMessage(
        "We could not load your voice notes right now. Please try again.",
        "error"
      );
    }
  }

  function startVolumeDetection(stream: MediaStream) {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function detectVolume() {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

      const normalizedVolume = Math.min(100, Math.round((average / 120) * 100));

      setVolumeLevel(normalizedVolume);
      setSoundDetected(normalizedVolume > 8);

      animationFrameRef.current = requestAnimationFrame(detectVolume);
    }

    detectVolume();
  }

  function stopVolumeDetection() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setVolumeLevel(0);
    setSoundDetected(false);
  }

  function stopMicrophoneStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function startRecording() {
    setMessage("");
    setRecordedBlob(null);

    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl("");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      streamRef.current = stream;
      startVolumeDetection(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setRecordedBlob(blob);
        setRecordedUrl(url);
        stopMicrophoneStream();
      };

      mediaRecorder.start();
      setRecording(true);
      showMessage("Recording started. Speak when you are ready.", "info");
    } catch {
      showMessage(
        "Microphone access was blocked. Please allow microphone permission and try again.",
        "error"
      );
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      stopVolumeDetection();
      showMessage("Recording stopped. Preview it before saving.", "info");
    }
  }

  async function uploadVoiceNote(fileToUpload: File | Blob, fileName: string) {
    if (!user) {
      showMessage("Please login again before saving your voice note.", "error");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("user_id", String(user.id));
    formData.append("title", title.trim());
    formData.append("audio_file", fileToUpload, fileName);

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/voice/upload/`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.error || "We could not save this voice note.", "error");
        return;
      }

      showMessage("Saved. Your voice note is private.", "success");
      setTitle("");
      setAudioFile(null);
      setRecordedBlob(null);

      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl("");
      }

      const fileInput = document.getElementById("audioFile") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchVoiceNotes(user.id);
    } catch {
      showMessage(
        "We could not save this right now. Please check your connection and try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadFile(e: React.FormEvent) {
    e.preventDefault();

    if (!audioFile) {
      showMessage("Please choose an audio file first.", "error");
      return;
    }

    uploadVoiceNote(audioFile, audioFile.name);
  }

  async function handleUploadRecording() {
    if (!recordedBlob) {
      showMessage("Record something first, then tap Save Recording.", "error");
      return;
    }

    uploadVoiceNote(recordedBlob, "recorded-voice-note.webm");
  }

  function discardRecording() {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }

    setRecordedBlob(null);
    setRecordedUrl("");
    showMessage("Recording deleted. You can record again.", "info");
  }

  async function deleteSavedVoiceNote(voiceNoteId: number) {
    if (!user) {
      showMessage("Please login again before deleting this voice note.", "error");
      return;
    }

    const confirmDelete = window.confirm(
      "Delete this voice note? This cannot be undone."
    );

    if (!confirmDelete) return;

    setDeletingId(voiceNoteId);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notes/voice/delete/${voiceNoteId}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.error || "We could not delete this voice note.", "error");
        return;
      }

      setVoiceNotes((currentNotes) =>
        currentNotes.filter((note) => note.id !== voiceNoteId)
      );

      showMessage("Voice note deleted.", "success");
    } catch {
      showMessage(
        "We could not delete this right now. Please check your connection and try again.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: "40px",
          color: "#111827",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Loading your voice notes...</p>
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
    fontSize: "15px",
  };

  const greenButtonStyle: React.CSSProperties = {
    width: "100%",
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.75 : 1,
  };

  const trashIconButtonStyle: React.CSSProperties = {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    color: "#991b1b",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "20px",
    padding: isMobile ? "22px" : "26px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  };

  const messageStyle: React.CSSProperties = {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "12px",
    textAlign: "left",
    lineHeight: "1.5",
    background:
      messageType === "error"
        ? "#fef2f2"
        : messageType === "success"
        ? "#ecfdf5"
        : "#f0fdf4",
    border:
      messageType === "error"
        ? "1px solid #fecaca"
        : messageType === "success"
        ? "1px solid #bbf7d0"
        : "1px solid #bbf7d0",
    color:
      messageType === "error"
        ? "#991b1b"
        : messageType === "success"
        ? "#14532d"
        : "#14532d",
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
      <style>{`
        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }

        @keyframes dotPulse {
          0% {
            transform: scale(0.8);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.45;
          }
        }
      `}</style>

      <section style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
            ...cardStyle,
            marginBottom: "24px",
          }}
        >
          <p style={{ color: "#16a34a", fontWeight: "bold", margin: "0 0 8px 0" }}>
            VOICE NOTES
          </p>

          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "34px" }}>
            Save a Voice Note
          </h1>

          <p style={{ color: "#6b7280", marginTop: "10px", lineHeight: "1.6" }}>
            Record your voice or upload audio. Keep memories, reminders, or
            important updates in one private place.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(300px, 460px) 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section>
            <div
              style={{
                ...cardStyle,
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Record Now</h2>

              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Tap the microphone, speak naturally, then save your recording.
              </p>

              <div style={{ marginBottom: "18px", textAlign: "left" }}>
                <label style={{ fontWeight: "bold" }}>Title</label>
                <input
                  type="text"
                  value={title}
                  placeholder="Example: Message for my family"
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  position: "relative",
                  width: isMobile ? "160px" : "140px",
                  height: isMobile ? "160px" : "140px",
                  margin: "20px auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {recording && (
                  <div
                    style={{
                      position: "absolute",
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      background: "#86efac",
                      animation: "pulseRing 1s infinite",
                    }}
                  />
                )}

                <button
                  onClick={recording ? stopRecording : startRecording}
                  disabled={loading}
                  style={{
                    position: "relative",
                    width: isMobile ? "125px" : "110px",
                    height: isMobile ? "125px" : "110px",
                    borderRadius: "50%",
                    border: "none",
                    background: recording ? "#dc2626" : "#16a34a",
                    color: "white",
                    fontSize: "42px",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: recording
                      ? "0 15px 35px rgba(220,38,38,0.28)"
                      : "0 15px 35px rgba(22,163,74,0.28)",
                    opacity: loading ? 0.75 : 1,
                  }}
                  title={recording ? "Stop recording" : "Start recording"}
                >
                  🎙️
                </button>
              </div>

              <p
                style={{
                  color: recording ? "#dc2626" : "#6b7280",
                  fontWeight: "bold",
                  marginBottom: 0,
                }}
              >
                {recording
                  ? soundDetected
                    ? "Recording your voice..."
                    : "Listening... start speaking when ready"
                  : "Tap the microphone to start"}
              </p>

              {recording && (
                <div
                  style={{
                    height: "70px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "7px",
                    marginTop: "18px",
                  }}
                >
                  {!soundDetected ? (
                    [0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#86efac",
                          opacity: 0.75,
                          animation: "dotPulse 1s infinite ease-in-out",
                          animationDelay: `${dot * 0.18}s`,
                        }}
                      />
                    ))
                  ) : (
                    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((bar) => {
                      const waveHeight =
                        12 +
                        Math.max(6, volumeLevel * (bar % 2 === 0 ? 0.55 : 0.8));

                      return (
                        <span
                          key={bar}
                          style={{
                            width: "8px",
                            height: `${Math.min(64, waveHeight)}px`,
                            borderRadius: "999px",
                            background: "#16a34a",
                            transition: "height 0.08s ease",
                          }}
                        />
                      );
                    })
                  )}
                </div>
              )}

              {recordedUrl && (
                <div
                  style={{
                    marginTop: "22px",
                    padding: "18px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "16px",
                    textAlign: "left",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>Preview before saving</h3>

                  <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                    Listen once. Save it if it sounds good, or delete it and record again.
                  </p>

                  <audio controls src={recordedUrl} style={{ width: "100%" }} />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "15px",
                    }}
                  >
                    <button
                      onClick={handleUploadRecording}
                      disabled={loading}
                      style={{
                        ...greenButtonStyle,
                        flex: 1,
                      }}
                    >
                      {loading ? "Saving..." : "Save Recording"}
                    </button>

                    <button
                      onClick={discardRecording}
                      disabled={loading}
                      title="Delete recording"
                      aria-label="Delete recording"
                      style={{
                        ...trashIconButtonStyle,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.65 : 1,
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}

              {message && <p style={messageStyle}>{message}</p>}
            </div>

            <form
              onSubmit={handleUploadFile}
              style={{
                ...cardStyle,
              }}
            >
              <h2 style={{ marginTop: 0 }}>Upload Existing Audio</h2>

              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                Already recorded something on your phone or computer? Upload it here.
              </p>

              <input
                id="audioFile"
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                style={inputStyle}
              />

              {audioFile && (
                <p style={{ color: "#14532d", marginTop: "10px", lineHeight: "1.5" }}>
                  Selected: {audioFile.name}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...greenButtonStyle,
                  marginTop: "16px",
                  background: "#14532d",
                }}
              >
                {loading ? "Uploading..." : "Upload Audio"}
              </button>
            </form>
          </section>

          <section>
            <h2 style={{ marginTop: 0 }}>Your Saved Voice Notes</h2>

            <p style={{ color: "#6b7280", lineHeight: "1.6", marginTop: "-6px" }}>
              Your recordings are saved for your account. Later, Wesiya will add
              stronger encryption for private storage.
            </p>

            {voiceNotes.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "30px",
                  border: "1px solid #e5e7eb",
                  textAlign: "center",
                  color: "#6b7280",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ fontSize: "34px", marginBottom: "10px" }}>🎙️</div>
                No voice notes yet. Record your first memory, reminder, or update
                when you are ready.
              </div>
            ) : (
              voiceNotes.map((note) => {
                const isDeleting = deletingId === note.id;

                return (
                  <div
                    key={note.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "20px",
                      padding: "22px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "14px",
                        alignItems: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "16px",
                          background: "#dcfce7",
                          color: "#14532d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          flexShrink: 0,
                        }}
                      >
                        🎧
                      </div>

                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0 }}>
                          {note.title || "Untitled Voice Note"}
                        </h3>
                        <small style={{ color: "#6b7280" }}>
                          Saved {new Date(note.created_at).toLocaleString()}
                        </small>
                      </div>

                      <button
                        onClick={() => deleteSavedVoiceNote(note.id)}
                        disabled={isDeleting}
                        title="Delete voice note"
                        aria-label="Delete voice note"
                        style={{
                          ...trashIconButtonStyle,
                          width: "42px",
                          height: "42px",
                          borderRadius: "12px",
                          fontSize: "18px",
                          cursor: isDeleting ? "not-allowed" : "pointer",
                          opacity: isDeleting ? 0.65 : 1,
                        }}
                      >
                        {isDeleting ? "…" : "🗑️"}
                      </button>
                    </div>

                    <audio controls style={{ width: "100%", marginTop: "8px" }}>
                      <source src={note.audio_url} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                );
              })
            )}
          </section>
        </section>
      </section>
    </main>
  );
}