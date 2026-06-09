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

export default function JiraSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<JiraSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiFetch("/api/v1/users/me/jira-settings");

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
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
    const response = await apiFetch("/api/v1/users/me/jira-settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
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
