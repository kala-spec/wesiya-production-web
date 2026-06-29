"use client";

import Link from "next/link";
import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

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

export default function PasskeyRegisterPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegisterPasskey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatusMessage("");
    setErrorMessage("");

    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage("Please enter your username/email and password.");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage("Preparing passkey setup...");

      const optionsResponse = await fetch(
        `${API_BASE_URL}/passkeys/register/options/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username_or_email: usernameOrEmail.trim(),
            password: password,
          }),
        }
      );

      const optionsData = await readApiResponse(optionsResponse);

      if (!optionsResponse.ok) {
        throw new Error(optionsData.error || "Could not start passkey setup.");
      }

      setStatusMessage(
        "Your browser will ask for Face ID, fingerprint, PIN, or device passkey..."
      );

      const credential = await startRegistration({
        optionsJSON: optionsData.options,
      });

      setStatusMessage("Verifying passkey with Wesiya...");

      const verifyResponse = await fetch(
        `${API_BASE_URL}/passkeys/register/verify/`,
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
        throw new Error(verifyData.error || "Passkey verification failed.");
      }

      setStatusMessage(
        "Passkey registered successfully. You can now login with Face ID, fingerprint, PIN, or your device passkey."
      );
      setPassword("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while setting up your passkey.";

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
            Wesiya Security
          </p>
          <h1 className="text-3xl font-bold">Set up Passkey</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Add Face ID, fingerprint, Windows Hello, Android biometrics, PIN, or
            a security key to your Wesiya account.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">
          Wesiya does not store your face or fingerprint. Your device handles
          biometrics. Wesiya only stores passkey credential data needed for secure
          login.
        </div>

        <form onSubmit={handleRegisterPasskey} className="space-y-5">
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

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Current password
            </label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Confirm your password"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#8b6f3d] focus:ring-2 focus:ring-[#8b6f3d]/20"
            />
            <p className="mt-2 text-xs text-gray-500">
              We ask for your password once to make sure it is really you before
              adding a passkey.
            </p>
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
            {isLoading ? "Working..." : "Set up passkey"}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 text-center text-sm sm:flex-row sm:justify-center">
          <Link
            href="/passkey-login"
            className="font-semibold text-[#8b6f3d] hover:underline"
          >
            Login with passkey
          </Link>
          <span className="hidden text-gray-400 sm:block">|</span>
          <Link
            href="/login"
            className="font-semibold text-[#8b6f3d] hover:underline"
          >
            Back to normal login
          </Link>
        </div>
      </div>
    </main>
  );
}