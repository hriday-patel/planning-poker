"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Palette,
  Settings,
  ShieldCheck,
} from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";
import { apiFetch } from "@/lib/api";
import {
  Avatar,
  Badge,
  Button,
  Card,
  PageHeader,
  PageShell,
} from "@/components/ui";

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
          avatar_url: data.user.avatarUrl ?? null,
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
      <PageShell className="flex items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"
            style={{ borderColor: "var(--primary)" }}
          />
          <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return null;
  }

  const infoRows = [
    ["Authentication", "IBM W3ID"],
    ["Display Name Source", "IBM Blue Pages"],
    ["Account Type", "Enterprise User"],
  ];

  const quickLinks = [
    {
      icon: HelpCircle,
      label: "FAQs",
      onClick: () => router.push("/faq"),
    },
    {
      icon: FileText,
      label: "Legal Notice",
      onClick: () => router.push("/legal"),
    },
  ];

  return (
    <PageShell>
      <nav
        className="border-b"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
            className="shadow-none"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </Button>
          <h1 className="text-xl font-semibold">My Account</h1>
          <div className="w-28" />
        </div>
      </nav>

      <main className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader
          eyebrow="Profile"
          title="Account Settings"
          description="Review your profile defaults, game preferences, and account details."
          actions={<Badge variant="success">Enterprise user</Badge>}
        />

        <Card className="p-6 sm:p-8" variant="primary">
          <section
            className="mb-8 flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-center"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Avatar
              name={user.display_name}
              imageUrl={user.avatar_url}
              size="lg"
              className="h-24 w-24 text-3xl"
            />
            <div className="min-w-0 flex-1">
              <h2 className="mb-1 text-2xl font-bold">{user.display_name}</h2>
              <p
                className="mb-1 break-all text-sm"
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
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowEditModal(true)}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Manage Settings
              </Button>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>

            <Card className="p-4" variant="secondary">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Eye
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                    aria-hidden="true"
                  />
                  <div>
                    <h4 className="mb-1 font-medium">Spectator Mode</h4>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Join games without voting
                    </p>
                  </div>
                </div>
                <Badge variant={user.spectator_mode ? "success" : "neutral"}>
                  {user.spectator_mode ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </Card>

            <Card className="p-4" variant="secondary">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Palette
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                    aria-hidden="true"
                  />
                  <div>
                    <h4 className="mb-1 font-medium">Theme</h4>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Current theme preference
                    </p>
                  </div>
                </div>
                <Badge variant="info">{user.theme_preference}</Badge>
              </div>
            </Card>

            <Card className="p-4" variant="secondary">
              <div className="flex items-start gap-3">
                <ImageIcon
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "var(--text-secondary)" }}
                  aria-hidden="true"
                />
                <div>
                  <h4 className="mb-1 font-medium">Avatar Policy</h4>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    This application uses a static placeholder avatar. Photo
                    upload, storage, and profile image management are disabled.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck
                className="h-4 w-4"
                style={{ color: "var(--primary)" }}
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold">Account Information</h3>
            </div>
            <div className="space-y-3 text-sm">
              {infoRows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
                  <span className="text-right font-medium">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickLinks.map(({ icon: Icon, label, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="rounded-lg border p-4 text-left transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon
                      className="h-4 w-4"
                      style={{ color: "var(--text-secondary)" }}
                      aria-hidden="true"
                    />
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </Card>
      </main>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUserUpdate}
        />
      )}
    </PageShell>
  );
}

// Made with Bob
