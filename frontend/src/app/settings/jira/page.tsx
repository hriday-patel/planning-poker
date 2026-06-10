"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Info, KeyRound } from "lucide-react";
import JiraSiteChangeModal from "@/components/JiraSiteChangeModal";
import { apiFetch } from "@/lib/api";
import { JiraSettings } from "@/types/game.types";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  PageShell,
} from "@/components/ui";

const JIRA_API_TOKEN_URL =
  "https://jsw.ibm.com/plugins/servlet/de.resolution.apitokenauth/admin";

// Mirrors DEFAULT_JIRA_SITE_URL in backend/src/services/jiraService.ts; shown
// to visitors who don't have a session (and therefore no stored settings) yet.
const DEFAULT_JIRA_SETTINGS: JiraSettings = {
  siteUrl: "https://jsw.ibm.com/secure/Dashboard.jspa",
  hasApiToken: false,
};

export default function JiraSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<JiraSettings | null>(null);
  const [isGuestSession, setIsGuestSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const loadSettingsAndSession = () =>
          Promise.all([
            apiFetch("/api/v1/users/me/jira-settings"),
            apiFetch("/api/v1/auth/me"),
          ]);

        let [settingsResponse, meResponse] = await loadSettingsAndSession();

        if (settingsResponse.status === 401) {
          // The access token may simply have expired; try to restore the
          // session before treating this as a visitor without an account.
          const refreshResponse = await apiFetch("/api/v1/auth/refresh", {
            method: "POST",
          });

          if (refreshResponse.ok) {
            [settingsResponse, meResponse] = await loadSettingsAndSession();
          }
        }

        if (settingsResponse.status === 401) {
          // No session yet (e.g. first visit): show the defaults. A guest
          // session is created automatically on the first save.
          setIsGuestSession(true);
          setSettings(DEFAULT_JIRA_SETTINGS);
          return;
        }

        if (!settingsResponse.ok) {
          router.push("/login");
          return;
        }

        const meData = meResponse.ok ? await meResponse.json() : null;
        setIsGuestSession(Boolean(meData?.user?.isGuest));

        const data = await settingsResponse.json();
        setSettings(data.settings);
      } catch (fetchError) {
        console.error("Error fetching JIRA settings:", fetchError);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSettings();
  }, [router]);

  const saveSettings = async (updates: {
    siteUrl?: string;
    apiToken?: string;
  }): Promise<JiraSettings> => {
    const putSettings = () =>
      apiFetch("/api/v1/users/me/jira-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

    let response = await putSettings();

    if (response.status === 401) {
      // Settings live on a user record, so a session is required to save
      // them. Restore an expired session if possible; otherwise start a
      // guest session (the same kind used by "Try as Guest" games).
      const refreshResponse = await apiFetch("/api/v1/auth/refresh", {
        method: "POST",
      });

      if (!refreshResponse.ok) {
        const guestResponse = await apiFetch("/api/v1/guest/create-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!guestResponse.ok) {
          throw new Error(
            "Could not start a session to save your settings. Please try again.",
          );
        }

        setIsGuestSession(true);
      }

      response = await putSettings();
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Failed to update JIRA settings");
    }

    setSettings(data.settings);
    return data.settings;
  };

  const handleSaveSite = async (siteUrl: string) => {
    await saveSettings({ siteUrl });
    setError(null);
    setSuccessMessage("Jira site updated");
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      return;
    }

    setIsSavingToken(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await saveSettings({ apiToken: tokenInput.trim() });
      setTokenInput("");
      setSuccessMessage("JIRA API token saved");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save JIRA API token",
      );
    } finally {
      setIsSavingToken(false);
    }
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

  if (!settings) {
    return null;
  }

  return (
    <PageShell>
      <main className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader
          eyebrow="Integrations"
          title="JIRA Settings"
          description="Manage the Jira site and API token used when importing sprint issues into your games."
          actions={
            <Badge variant={settings.hasApiToken ? "success" : "warning"}>
              {settings.hasApiToken ? "Token saved" : "Token not set"}
            </Badge>
          }
        />

        <Card className="p-6 sm:p-8" variant="primary">
          {isGuestSession && (
            <Alert variant="info" className="mb-6">
              You&apos;re not signed in. Settings saved here are kept in a
              temporary guest session in this browser and are used when you
              create or join games as a guest. Sign in with W3ID before saving
              if you want them on your permanent account.
            </Alert>
          )}
          {error && (
            <Alert variant="danger" className="mb-6">
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert variant="success" className="mb-6">
              {successMessage}
            </Alert>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe
                className="h-4 w-4"
                style={{ color: "var(--primary)" }}
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold">Jira Site</h3>
            </div>

            <Field
              label="Site URL"
              helperText="This value can't be edited directly. Use the Change button to update it."
            >
              <div className="flex items-stretch gap-3">
                <Input value={settings.siteUrl} readOnly />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setShowSiteModal(true);
                  }}
                  className="shrink-0"
                >
                  Change
                </Button>
              </div>
            </Field>
          </section>

          <section
            className="mt-8 space-y-4 border-t pt-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="flex items-center gap-2">
              <KeyRound
                className="h-4 w-4"
                style={{ color: "var(--primary)" }}
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold">JIRA API Token</h3>
            </div>

            <Field
              label="API token"
              helperText={
                settings.hasApiToken
                  ? "A token is already saved. Enter a new one to replace it."
                  : "No token saved yet. Paste your JIRA API token and save it."
              }
            >
              <div className="flex items-stretch gap-3">
                <Input
                  type="password"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder={
                    settings.hasApiToken
                      ? "••••••••••••"
                      : "Paste your JIRA API token"
                  }
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSaveToken}
                  isLoading={isSavingToken}
                  disabled={!tokenInput.trim()}
                  className="shrink-0"
                >
                  Save
                </Button>
              </div>
              <a
                href={JIRA_API_TOKEN_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-medium underline"
                style={{ color: "var(--primary)" }}
              >
                Generate API Token
              </a>
            </Field>
          </section>

          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Alert variant="neutral" className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                These values are applied automatically whenever you import Jira
                sprint issues into a game, so you no longer need to enter the
                Jira site or API token during each import.
              </span>
            </Alert>
          </section>
        </Card>
      </main>

      {showSiteModal && (
        <JiraSiteChangeModal
          currentSiteUrl={settings.siteUrl}
          onClose={() => setShowSiteModal(false)}
          onSave={handleSaveSite}
        />
      )}
    </PageShell>
  );
}
