"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  LogOut,
  Moon,
  Palette,
  Settings2,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";

const GUEST_DISPLAY_NAME = "GUEST";

interface HeaderProfileMenuProps {
  isAuthenticated?: boolean;
  displayName?: string;
}

export default function HeaderProfileMenu({
  isAuthenticated: isAuthenticatedProp,
  displayName: displayNameProp,
}: HeaderProfileMenuProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    isAuthenticatedProp ?? false,
  );
  const [displayName, setDisplayName] = useState(
    displayNameProp ?? GUEST_DISPLAY_NAME,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticatedProp !== undefined) {
      setIsAuthenticated(isAuthenticatedProp);
    }
  }, [isAuthenticatedProp]);

  useEffect(() => {
    if (displayNameProp !== undefined) {
      setDisplayName(displayNameProp);
    }
  }, [displayNameProp]);

  useEffect(() => {
    if (isAuthenticatedProp !== undefined && displayNameProp !== undefined) {
      return;
    }

    const loadSession = async () => {
      try {
        const response = await apiFetch("/api/v1/auth/me");

        if (!response.ok) {
          setIsAuthenticated(false);
          setDisplayName(GUEST_DISPLAY_NAME);
          return;
        }

        const data = await response.json();
        const signedIn = !data.user?.isGuest;

        if (isAuthenticatedProp === undefined) {
          setIsAuthenticated(signedIn);
        }

        if (displayNameProp === undefined) {
          setDisplayName(
            signedIn
              ? data.user.displayName || GUEST_DISPLAY_NAME
              : GUEST_DISPLAY_NAME,
          );
        }
      } catch (_error) {
        setIsAuthenticated(false);
        setDisplayName(GUEST_DISPLAY_NAME);
      }
    };

    void loadSession();
  }, [displayNameProp, isAuthenticatedProp]);

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

  const handleAuthAction = async () => {
    setIsOpen(false);

    if (isAuthenticated) {
      try {
        await apiFetch("/api/v1/auth/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("Error during logout:", error);
      } finally {
        setIsAuthenticated(false);
        setDisplayName(GUEST_DISPLAY_NAME);
        router.push("/login");
      }
      return;
    }

    router.push("/login");
  };

  if (!mounted) {
    return <div className="h-8 w-8 rounded-full" aria-hidden="true" />;
  }

  const ThemeIcon = theme === "dark" ? Moon : Sun;
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-full transition-transform hover:-translate-y-0.5 active:translate-y-0"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
      >
        <Avatar name={displayName} size="sm" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border py-2 shadow-theme-strong"
          style={{
            backgroundColor: "var(--surface-primary)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
          }}
          role="menu"
        >
          <div className="flex items-center gap-3 px-4 py-2.5">
            <UserRound
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--text-secondary)" }}
              aria-hidden="true"
            />
            <span className="truncate text-sm font-medium">{displayName}</span>
          </div>

          <div
            className="my-1 border-t"
            style={{ borderColor: "var(--border-color)" }}
          />

          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="flex items-center gap-3">
              <Palette
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--text-secondary)" }}
                aria-hidden="true"
              />
              <span className="text-sm">Theme</span>
            </div>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${nextTheme} mode`}
            >
              <ThemeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {theme === "dark" ? "Dark" : "Light"}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              router.push("/settings/jira");
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-opacity hover:opacity-80"
            role="menuitem"
          >
            <Settings2
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--text-secondary)" }}
              aria-hidden="true"
            />
            JIRA Settings
          </button>

          <div
            className="my-1 border-t"
            style={{ borderColor: "var(--border-color)" }}
          />

          <button
            type="button"
            onClick={() => void handleAuthAction()}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-opacity hover:opacity-80"
            style={{
              color: isAuthenticated ? "var(--danger)" : "var(--text-primary)",
            }}
            role="menuitem"
          >
            {isAuthenticated ? (
              <LogOut
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--danger)" }}
                aria-hidden="true"
              />
            ) : (
              <LogIn
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--text-secondary)" }}
                aria-hidden="true"
              />
            )}
            {isAuthenticated ? "Sign out" : "Sign in"}
          </button>
        </div>
      )}
    </div>
  );
}
