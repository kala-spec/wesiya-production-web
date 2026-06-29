"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/api";
import PhoneInput, {
  isValidPhoneNumber,
  parsePhoneNumber,
} from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

type LanguageOption = {
  code: string;
  name: string;
};

const fallbackLanguages: LanguageOption[] = [
  { code: "en", name: "English" },
];

const countryLanguageOptions: Partial<Record<Country, LanguageOption[]>> = {
  ET: [
    { code: "am", name: "Amharic" },
    { code: "om", name: "Afaan Oromo" },
    { code: "ti", name: "Tigrinya" },
    { code: "so", name: "Somali" },
    { code: "en", name: "English" },
  ],
  US: [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
  ],
  CA: [
    { code: "en", name: "English" },
    { code: "fr", name: "French" },
  ],
  GB: [{ code: "en", name: "English" }],
  AE: [
    { code: "ar", name: "Arabic" },
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "ur", name: "Urdu" },
  ],
  SA: [
    { code: "ar", name: "Arabic" },
    { code: "en", name: "English" },
  ],
  EG: [
    { code: "ar", name: "Arabic" },
    { code: "en", name: "English" },
  ],
  SD: [
    { code: "ar", name: "Arabic" },
    { code: "en", name: "English" },
  ],
  SO: [
    { code: "so", name: "Somali" },
    { code: "ar", name: "Arabic" },
    { code: "en", name: "English" },
  ],
  KE: [
    { code: "sw", name: "Swahili" },
    { code: "en", name: "English" },
  ],
  TZ: [
    { code: "sw", name: "Swahili" },
    { code: "en", name: "English" },
  ],
  NG: [
    { code: "en", name: "English" },
    { code: "ha", name: "Hausa" },
    { code: "yo", name: "Yoruba" },
    { code: "ig", name: "Igbo" },
  ],
  GH: [
    { code: "en", name: "English" },
    { code: "ak", name: "Akan" },
    { code: "ee", name: "Ewe" },
  ],
  ZA: [
    { code: "en", name: "English" },
    { code: "zu", name: "Zulu" },
    { code: "xh", name: "Xhosa" },
    { code: "af", name: "Afrikaans" },
  ],
  FR: [
    { code: "fr", name: "French" },
    { code: "en", name: "English" },
  ],
  DE: [
    { code: "de", name: "German" },
    { code: "en", name: "English" },
  ],
  IT: [
    { code: "it", name: "Italian" },
    { code: "en", name: "English" },
  ],
  ES: [
    { code: "es", name: "Spanish" },
    { code: "ca", name: "Catalan" },
    { code: "en", name: "English" },
  ],
  PT: [
    { code: "pt", name: "Portuguese" },
    { code: "en", name: "English" },
  ],
  BR: [
    { code: "pt", name: "Portuguese" },
    { code: "en", name: "English" },
  ],
  MX: [
    { code: "es", name: "Spanish" },
    { code: "en", name: "English" },
  ],
  IN: [
    { code: "hi", name: "Hindi" },
    { code: "en", name: "English" },
    { code: "bn", name: "Bengali" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "ur", name: "Urdu" },
  ],
  PK: [
    { code: "ur", name: "Urdu" },
    { code: "en", name: "English" },
    { code: "pa", name: "Punjabi" },
    { code: "ps", name: "Pashto" },
  ],
  BD: [
    { code: "bn", name: "Bengali" },
    { code: "en", name: "English" },
  ],
  CN: [
    { code: "zh", name: "Chinese" },
    { code: "en", name: "English" },
  ],
  JP: [
    { code: "ja", name: "Japanese" },
    { code: "en", name: "English" },
  ],
  KR: [
    { code: "ko", name: "Korean" },
    { code: "en", name: "English" },
  ],
  TR: [
    { code: "tr", name: "Turkish" },
    { code: "en", name: "English" },
  ],
  RU: [
    { code: "ru", name: "Russian" },
    { code: "en", name: "English" },
  ],
  UA: [
    { code: "uk", name: "Ukrainian" },
    { code: "ru", name: "Russian" },
    { code: "en", name: "English" },
  ],
};

function getCountryName(countryCode?: Country) {
  if (!countryCode) return "";

  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

function getLanguageSuggestions(countryCode?: Country) {
  if (!countryCode) return fallbackLanguages;
  return countryLanguageOptions[countryCode] || fallbackLanguages;
}

export default function SignupPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState<string | undefined>("");
  const [phoneCountry, setPhoneCountry] = useState<Country>("ET");

  const [city, setCity] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedCountryName = getCountryName(phoneCountry);
  const languageSuggestions = getLanguageSuggestions(phoneCountry);

  useEffect(() => {
    if (languageSuggestions.length === 0) return;

    const stillValid = languageSuggestions.some(
      (language) => language.code === preferredLanguage
    );

    if (!preferredLanguage || !stillValid) {
      setPreferredLanguage(languageSuggestions[0].code);
    }
  }, [phoneCountry, preferredLanguage, languageSuggestions]);

  const selectedLanguage =
    languageSuggestions.find((language) => language.code === preferredLanguage) ||
    languageSuggestions[0];

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || "").trim();
    const cleanCity = city.trim();

    const parsedPhone = cleanPhone ? parsePhoneNumber(cleanPhone) : undefined;
    const detectedCountry = parsedPhone?.country || phoneCountry;
    const countryName = getCountryName(detectedCountry);

    const finalLanguageSuggestions = getLanguageSuggestions(detectedCountry);
    const finalSelectedLanguage =
      finalLanguageSuggestions.find(
        (language) => language.code === preferredLanguage
      ) || finalLanguageSuggestions[0];

    if (
      !cleanFullName ||
      !cleanUsername ||
      !cleanEmail ||
      !cleanPhone ||
      !detectedCountry ||
      !countryName ||
      !cleanCity ||
      !finalSelectedLanguage ||
      !password ||
      !confirmPassword
    ) {
      setMessage("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!isValidPhoneNumber(cleanPhone)) {
      setMessage("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: cleanFullName,
          username: cleanUsername,
          email: cleanEmail,
          phone: parsedPhone?.number || cleanPhone,
          country: countryName,
          country_code: detectedCountry,
          city: cleanCity,
          preferred_language: finalSelectedLanguage.code,
          preferred_language_name: finalSelectedLanguage.name,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Signup failed. Please try again.");
        setSuccess(false);
        return;
      }

      setSuccess(true);
      setMessage(
        data.message ||
          "Account created. Please verify your email before logging in."
      );

      setFullName("");
      setUsername("");
      setEmail("");
      setPhone("");
      setPhoneCountry("ET");
      setCity("");
      setPreferredLanguage("am");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setSuccess(false);
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
          maxWidth: "1050px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
          background: "#ffffff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 18px 45px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ padding: isMobile ? "28px" : "44px" }}>
          <h2 style={{ fontSize: "30px", margin: "0 0 8px 0" }}>
            Create your Wesiya account
          </h2>

          <p style={{ color: "#6b7280", marginBottom: "24px", lineHeight: "1.6" }}>
            Add your basic information, verify your email, and choose your preferred
            language for future translation suggestions.
          </p>

          <form onSubmit={handleSignup}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  placeholder="Enter your full name"
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  value={username}
                  placeholder="Choose a username"
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  placeholder="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>

                <div style={phoneInputBoxStyle}>
                  <PhoneInput
                    flags={flags}
                    defaultCountry="ET"
                    value={phone}
                    onChange={setPhone}
                    onCountryChange={(country) => {
                      if (country) {
                        setPhoneCountry(country);
                      }
                    }}
                    placeholder="Enter phone number"
                    style={{ width: "100%" }}
                  />
                </div>

                <p style={helperTextStyle}>
                  You can type local or international format.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Country</label>
                <input
                  type="text"
                  value={selectedCountryName}
                  readOnly
                  placeholder="Selected from phone number"
                  style={{
                    ...inputStyle,
                    background: "#f9fafb",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  value={city}
                  placeholder="Example: Addis Ababa"
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Suggested Language</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  style={inputStyle}
                >
                  {languageSuggestions.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>

                <p style={helperTextStyle}>
                  Based on your selected country. You can change it.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Translation Preview</label>
                <input
                  type="text"
                  value={
                    selectedLanguage
                      ? `Wesiya will suggest ${selectedLanguage.name}`
                      : "Wesiya will suggest English"
                  }
                  readOnly
                  style={{
                    ...inputStyle,
                    background: "#f9fafb",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  value={password}
                  placeholder="Create a password"
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  placeholder="Re-enter password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "14px" }}>
              Password must be at least 8 characters. Phone number will be saved
              in international format.
            </p>

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
                marginTop: "8px",
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {message && (
            <p
              style={{
                marginTop: "16px",
                padding: "12px",
                background: success ? "#ecfdf5" : "#fee2e2",
                border: success ? "1px solid #bbf7d0" : "1px solid #fecaca",
                borderRadius: "12px",
                color: success ? "#14532d" : "#991b1b",
                lineHeight: "1.6",
              }}
            >
              {message}
            </p>
          )}

          {success && (
            <div
              style={{
                marginTop: "14px",
                padding: "14px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "14px",
                color: "#14532d",
                lineHeight: "1.6",
              }}
            >
              <strong>Next step:</strong> check your email verification link.
            </div>
          )}

          <p style={{ marginTop: "24px", color: "#6b7280" }}>
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              style={{
                background: "transparent",
                border: "none",
                color: "#16a34a",
                fontWeight: "bold",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Login
            </button>
          </p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #dcfce7, #ffffff)",
            padding: isMobile ? "28px" : "44px",
            borderLeft: isMobile ? "none" : "1px solid #e5e7eb",
            borderTop: isMobile ? "1px solid #e5e7eb" : "none",
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
            Wesiya can suggest translation based on country.
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: "18px",
              lineHeight: "1.7",
              fontSize: "16px",
            }}
          >
            During signup, Wesiya reads the selected country from the phone field
            and suggests common languages for that country.
          </p>

          <div
            style={{
              marginTop: "30px",
              display: "grid",
              gap: "12px",
            }}
          >
            <Feature text="Smart phone number validation" />
            <Feature text="Country-based language suggestion" />
            <Feature text="Preferred language saved to profile" />
            <Feature text="Email verification before login" />
            <Feature text="Password confirmation for safer signup" />
          </div>
        </div>
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  fontWeight: "bold",
};

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

const phoneInputBoxStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  marginTop: "8px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
};

const helperTextStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "6px 0 0 0",
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