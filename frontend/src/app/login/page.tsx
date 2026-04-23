"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const errorMessage = useMemo(() => {
    const error = searchParams.get("error");

    switch (error) {
      case "auth_failed":
        return "Authentication failed. Please try signing in again.";
      case "invalid_state":
        return "Your sign-in session expired. Please start again.";
      case "server_error":
        return "A server error occurred during sign-in.";
      default:
        return null;
    }
  }, [searchParams]);

  const returnTo = useMemo(() => {
    const invite = searchParams.get("invite");
    const gameId = searchParams.get("gameId");

    if (invite && gameId) {
      return `/game/${gameId}?invite=${encodeURIComponent(invite)}`;
    }

    return "/";
  }, [searchParams]);

  useEffect(() => {
    const checkSession = async () => {
      if (searchParams.get("error")) {
        return;
      }

      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
        const response = await fetch(`${appUrl}/api/v1/auth/me`, {
          credentials: "include",
        });

        if (response.ok) {
          router.push(returnTo);
        }
      } catch (_error) {
        // Ignore bootstrap failures on login screen
      }
    };

    void checkSession();
  }, [router, returnTo, searchParams]);

  const handleW3IDLogin = () => {
    setIsRedirecting(true);

    const loginUrl =
      process.env.NEXT_PUBLIC_W3ID_LOGIN_URL ||
      "https://localhost:3002/api/v1/auth/w3id";
    const redirectUrl = `${loginUrl}?returnTo=${encodeURIComponent(returnTo)}`;

    window.location.href = redirectUrl;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="max-w-md w-full mx-4">
        <div
          className="rounded-xl p-8 shadow-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
          <p
            className="text-center mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign in with IBM W3ID to access your planning sessions
          </p>

          {errorMessage && (
            <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleW3IDLogin}
            disabled={isRedirecting}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 text-white disabled:opacity-70"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            {isRedirecting
              ? "Redirecting to IBM W3ID..."
              : "Sign in with IBM W3ID"}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/")}
              className="transition-colors text-sm hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              ← Back to Home
            </button>
          </div>

          <div
            className="mt-8 pt-6 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            <p
              className="text-xs text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              IBM W3ID authentication automatically retrieves your official
              display name from Blue Pages.
              <br />
              Your corporate display name is read-only and cannot be edited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
