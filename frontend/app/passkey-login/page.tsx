"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";

const API_BASE_URL = "http://localhost:8001/api/accounts";

async function readApiResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error(
        "Backend returned an HTML page instead of JSON. This usually means the API route does not exist, Django crashed, or backend is not running correctly on port 8001."
      );
    }

    throw new Error(text || "Backend returned an invalid response.");
  }
}

export default function PasskeyLoginPage() {
  const router = useRouter();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handlePasskeyLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatusMessage("");
    setErrorMessage("");

    if (!usernameOrEmail.trim()) {
      setErrorMessage("Please enter your username or email.");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage("Preparing passkey login...");

      const optionsResponse = await fetch(
        `${API_BASE_URL}/passkeys/login/options/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username_or_email: usernameOrEmail.trim(),
          }),
        }
      );

      const optionsData = await readApiResponse(optionsResponse);

      if (!optionsResponse.ok) {
        throw new Error(optionsData.error || "Could not start passkey login.");
      }

      setStatusMessage("Use Face ID, fingerprint, PIN, or your device passkey...");

      const credential = await startAuthentication({
        optionsJSON: optionsData.options,
      });

      setStatusMessage("Verifying login with Wesiya...");

      const verifyResponse = await fetch(
        `${API_BASE_URL}/passkeys/login/verify/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            challenge_id: optionsData.challenge_id,
            credential: credential,
          }),
        }
      );

      const verifyData = await readApiResponse(verifyResponse);

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Passkey login failed.");
      }

      localStorage.setItem("wesiya_user", JSON.stringify(verifyData.user));
      localStorage.setItem("user", JSON.stringify(verifyData.user));

      setStatusMessage("Login successful. Redirecting...");

      if (verifyData.user?.is_superuser) {
        router.push("/super-admin");
      } else {
        router.push("/profile");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while logging in with passkey.";

      setErrorMessage(message);
      setStatusMessage("");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-4 py-10 text-[#2d261f]">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#8b6f3d]">
            Wesiya Passkey Login
          </p>
          <h1 className="text-3xl font-bold">Login without password</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Use Face ID, fingerprint, Windows Hello, Android biometrics, PIN, or
            your saved device passkey.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          Enter your username or email first. Then your device will ask you to
          approve the login with your saved passkey.
        </div>

        <form onSubmit={handlePasskeyLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Username or email
            </label>
            <input
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
              type="text"
              placeholder="Enter username or email"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#8b6f3d] focus:ring-2 focus:ring-[#8b6f3d]/20"
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {statusMessage && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#2d261f] px-5 py-3 font-semibold text-white transition hover:bg-[#463a30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Checking passkey..." : "Login with passkey"}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 text-center text-sm sm:flex-row sm:justify-center">
          <Link
            href="/passkey-register"
            className="font-semibold text-[#8b6f3d] hover:underline"
          >
            Set up passkey
          </Link>
          <span className="hidden text-gray-400 sm:block">|</span>
          <Link
            href="/login"
            className="font-semibold text-[#8b6f3d] hover:underline"
          >
            Use password login
          </Link>
        </div>
      </div>
    </main>
  );
}