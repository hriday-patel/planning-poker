"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EditProfileModal from "@/components/EditProfileModal";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  spectator_mode: boolean;
  theme_preference: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await apiFetch("/api/v1/auth/me");

      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.user.userId,
          display_name: data.user.displayName,
          avatar_url: data.user.avatarUrl ?? "/images/avatar-placeholder.png",
          spectator_mode: data.user.spectatorMode,
          theme_preference: data.user.themePreference,
        });
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    setShowEditModal(false);
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"
            style={{ borderColor: "var(--primary)" }}
          />
          <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 30%), var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <nav
        className="border-b backdrop-blur supports-[backdrop-filter]:bg-[color:var(--overlay)]"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
          <h1 className="text-xl font-semibold">My Account</h1>
          <div className="w-24" />
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-6 py-12">
        <div
          className="rounded-[28px] border p-8 shadow-xl"
          style={{
            backgroundColor: "var(--surface-elevated)",
            borderColor: "var(--border-color)",
            boxShadow:
              "0 30px 80px -50px color-mix(in srgb, var(--text-primary) 30%, transparent)",
          }}
        >
          <div
            className="mb-8 flex items-center gap-6 border-b pb-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              }}
            >
              {user.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="mb-1 text-2xl font-bold">{user.display_name}</h2>
              <p
                className="mb-1 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                User ID: {user.id}
              </p>
              <p
                className="mb-4 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Display name is sourced from IBM Blue Pages and is read-only.
              </p>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, var(--accent) 28%) 100%)",
                }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v12m6-6H6"
                  />
                </svg>
                Manage Settings
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Settings</h3>

            <div
              className="flex items-center justify-between rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--surface-primary)",
                borderColor: "var(--border-muted)",
              }}
            >
              <div>
                <h4 className="mb-1 font-medium">Spectator Mode</h4>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Join games without voting
                </p>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.spectator_mode ? "" : ""
                }`}
                style={{
                  backgroundColor: user.spectator_mode
                    ? "var(--primary)"
                    : "var(--border-strong)",
                }}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    user.spectator_mode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
            </div>

            <div
              className="flex items-center justify-between rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--surface-primary)",
                borderColor: "var(--border-muted)",
              }}
            >
              <div>
                <h4 className="mb-1 font-medium">Theme</h4>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Current theme: {user.theme_preference}
                </p>
              </div>
              <span className="text-2xl">
                {user.theme_preference === "dark" ? "🌙" : "☀️"}
              </span>
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--surface-primary)",
                borderColor: "var(--border-muted)",
              }}
            >
              <h4 className="mb-1 font-medium">Avatar Policy</h4>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                This application uses a static placeholder avatar. Photo upload,
                storage, and profile image management are disabled.
              </p>
            </div>
          </div>

          <div
            className="mt-8 border-t pt-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h3 className="mb-4 text-lg font-semibold">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>
                  Authentication
                </span>
                <span className="font-medium">IBM W3ID</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>
                  Display Name Source
                </span>
                <span className="font-medium">IBM Blue Pages</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-tertiary)" }}>
                  Account Type
                </span>
                <span className="font-medium">Enterprise User</span>
              </div>
            </div>
          </div>

          <div
            className="mt-8 border-t pt-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/faq")}
                className="rounded-2xl border p-3 text-left transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-muted)",
                }}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  FAQs
                </div>
              </button>

              <button
                onClick={() => router.push("/legal")}
                className="rounded-2xl border p-3 text-left transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-muted)",
                }}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Legal Notice
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}

// Made with Bob
