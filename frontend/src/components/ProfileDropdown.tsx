"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import EditProfileModal from "./EditProfileModal";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  spectator_mode: boolean;
  theme_preference: string;
}

interface ProfileDropdownProps {
  user: User;
  onUserUpdate?: (user: User) => void;
}

export default function ProfileDropdown({
  user,
  onUserUpdate,
}: ProfileDropdownProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [spectatorMode, setSpectatorMode] = useState(user.spectator_mode);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSpectatorToggle = async () => {
    const newValue = !spectatorMode;
    setSpectatorMode(newValue);

    try {
      const response = await apiFetch("/api/v1/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spectator_mode: newValue }),
      });

      if (response.ok) {
        const data = await response.json();
        if (onUserUpdate && data.user) {
          onUserUpdate(data.user);
        }
      } else {
        setSpectatorMode(!newValue);
      }
    } catch (error) {
      console.error("Error updating spectator mode:", error);
      setSpectatorMode(!newValue);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      router.push("/login");
    }
  };

  const avatarFallback = (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
      }}
    >
      {user.display_name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--surface-secondary)" }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            avatarFallback
          )}
          <span className="hidden text-sm font-medium md:inline">
            {user.display_name}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--text-secondary)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border py-2 shadow-xl"
            style={{
              backgroundColor: "var(--surface-elevated)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              boxShadow:
                "0 30px 80px -48px color-mix(in srgb, var(--text-primary) 30%, transparent)",
            }}
          >
            <div
              className="border-b px-4 py-3"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                    }}
                  >
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.display_name}
                  </p>
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                    style={{ color: "var(--primary)" }}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit profile
                  </button>
                </div>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  alert("My games feature coming soon!");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                disabled
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                My games (Coming soon)
              </button>

              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ color: "var(--text-primary)" }}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="text-sm">Spectator mode</span>
                </div>
                <button
                  onClick={handleSpectatorToggle}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: spectatorMode
                      ? "var(--primary)"
                      : "var(--border-strong)",
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      spectatorMode ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ color: "var(--text-primary)" }}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span className="text-sm">Appearance</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="rounded-lg border px-2 py-1 text-xs transition-colors"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border-muted)",
                    color: "var(--text-primary)",
                  }}
                >
                  {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
                </button>
              </div>

              <div
                className="my-1 border-t"
                style={{ borderColor: "var(--border-color)" }}
              />

              <button
                onClick={() => {
                  router.push("/account");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:opacity-80"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                My account
              </button>

              <a
                href="mailto:support@planningpoker.com"
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:opacity-80"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contact us
              </a>

              <button
                onClick={() => {
                  router.push("/legal");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:opacity-80"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Legal notice
              </button>

              <button
                onClick={() => {
                  router.push("/faq");
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:opacity-80"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                FAQs
              </button>

              <div
                className="my-1 border-t"
                style={{ borderColor: "var(--border-color)" }}
              />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--danger)" }}
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedUser) => {
            if (onUserUpdate) {
              onUserUpdate(updatedUser);
            }
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}

// Made with Bob
