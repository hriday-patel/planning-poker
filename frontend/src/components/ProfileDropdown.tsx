"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  ChevronDown,
  Eye,
  FileText,
  HelpCircle,
  LogOut,
  Mail,
  Moon,
  Palette,
  Pencil,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import EditProfileModal from "./EditProfileModal";
import { apiFetch } from "@/lib/api";
import { Avatar, Badge, Button } from "@/components/ui";

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

interface MenuButtonProps {
  children: ReactNode;
  disabled?: boolean;
  icon: LucideIcon;
  isDanger?: boolean;
  onClick?: () => void;
}

function MenuButton({
  children,
  disabled = false,
  icon: Icon,
  isDanger = false,
  onClick,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ color: isDanger ? "var(--danger)" : "var(--text-primary)" }}
    >
      <Icon
        className="h-4 w-4 shrink-0"
        style={{ color: isDanger ? "var(--danger)" : "var(--text-secondary)" }}
        aria-hidden="true"
      />
      {children}
    </button>
  );
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
    setSpectatorMode(user.spectator_mode);
  }, [user.spectator_mode]);

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

  const closeAndRoute = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const ThemeIcon = theme === "dark" ? Moon : Sun;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          style={{
            backgroundColor: "var(--surface-secondary)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
          }}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <Avatar
            name={user.display_name}
            imageUrl={user.avatar_url}
            size="sm"
          />
          <span className="hidden max-w-40 truncate text-sm font-medium md:inline">
            {user.display_name}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--text-secondary)" }}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border py-2 shadow-theme-strong"
            style={{
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
            role="menu"
          >
            <div
              className="border-b px-4 py-3"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={user.display_name}
                  imageUrl={user.avatar_url}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {user.display_name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(true);
                      setIsOpen(false);
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: "var(--primary)" }}
                  >
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                    Edit profile
                  </button>
                </div>
              </div>
            </div>

            <div className="py-1">
              <MenuButton icon={Briefcase} disabled>
                <span>My games</span>
                <Badge className="ml-auto" variant="neutral">
                  Soon
                </Badge>
              </MenuButton>

              <div className="flex items-center justify-between gap-3 px-4 py-2">
                <div className="flex items-center gap-3">
                  <Eye
                    className="h-4 w-4"
                    style={{ color: "var(--text-secondary)" }}
                    aria-hidden="true"
                  />
                  <span className="text-sm">Spectator mode</span>
                </div>
                <button
                  type="button"
                  onClick={handleSpectatorToggle}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: spectatorMode
                      ? "var(--primary)"
                      : "var(--surface-tertiary)",
                  }}
                  aria-pressed={spectatorMode}
                  aria-label="Toggle spectator mode"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      spectatorMode ? "translate-x-5" : "translate-x-1"
                    }`}
                    style={{ backgroundColor: "var(--control-knob)" }}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-2">
                <div className="flex items-center gap-3">
                  <Palette
                    className="h-4 w-4"
                    style={{ color: "var(--text-secondary)" }}
                    aria-hidden="true"
                  />
                  <span className="text-sm">Appearance</span>
                </div>
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={toggleTheme}
                >
                  <ThemeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {theme === "dark" ? "Dark" : "Light"}
                </Button>
              </div>

              <div
                className="my-1 border-t"
                style={{ borderColor: "var(--border-color)" }}
              />

              <MenuButton
                icon={UserRound}
                onClick={() => closeAndRoute("/account")}
              >
                My account
              </MenuButton>
              <a
                href="mailto:support@planningpoker.com"
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-opacity hover:opacity-80"
                onClick={() => setIsOpen(false)}
              >
                <Mail
                  className="h-4 w-4"
                  style={{ color: "var(--text-secondary)" }}
                  aria-hidden="true"
                />
                Contact us
              </a>
              <MenuButton
                icon={FileText}
                onClick={() => closeAndRoute("/legal")}
              >
                Legal notice
              </MenuButton>
              <MenuButton
                icon={HelpCircle}
                onClick={() => closeAndRoute("/faq")}
              >
                FAQs
              </MenuButton>

              <div
                className="my-1 border-t"
                style={{ borderColor: "var(--border-color)" }}
              />

              <MenuButton icon={LogOut} onClick={handleLogout} isDanger>
                Sign out
              </MenuButton>
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
