"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Settings2, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Issue,
  JiraEstimateInsertRequest,
  JiraInsertEstimatesResponse,
  JiraSettings,
} from "@/types/game.types";
import {
  Alert,
  Badge,
  Button,
  Field,
  Input,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from "@/components/ui";

interface JiraInsertEstimatesModalProps {
  isOpen: boolean;
  isLoading: boolean;
  issues: Issue[];
  onClose: () => void;
  onInsert: (
    request: JiraEstimateInsertRequest,
  ) => Promise<JiraInsertEstimatesResponse>;
}

const isNumericEstimate = (estimate: string | null): boolean => {
  if (estimate == null || estimate.trim() === "") {
    return false;
  }

  return Number.isFinite(Number(estimate.trim()));
};

const isUnsupportedEstimationError = (error: string): boolean =>
  /does not support story point estimation/i.test(error);

export default function JiraInsertEstimatesModal({
  isLoading,
  isOpen,
  issues,
  onClose,
  onInsert,
}: JiraInsertEstimatesModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JiraInsertEstimatesResponse | null>(
    null,
  );
  const [jiraSettings, setJiraSettings] = useState<JiraSettings | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setError(null);
      setResult(null);
      return;
    }

    const loadJiraSettings = async () => {
      try {
        const response = await apiFetch("/api/v1/users/me/jira-settings");

        if (!response.ok) {
          setJiraSettings(null);
          return;
        }

        const data = await response.json();
        setJiraSettings(data.settings ?? null);
      } catch (_error) {
        setJiraSettings(null);
      }
    };

    void loadJiraSettings();
  }, [isOpen]);

  const pushableIssues = useMemo(
    () => issues.filter((issue) => isNumericEstimate(issue.final_estimate)),
    [issues],
  );
  const nonNumericIssues = useMemo(
    () => issues.filter((issue) => !isNumericEstimate(issue.final_estimate)),
    [issues],
  );

  const hasSavedToken = jiraSettings?.hasApiToken ?? true;
  const formIsComplete = Boolean(
    email.trim() && pushableIssues.length > 0 && hasSavedToken,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const insertResult = await onInsert({ email: email.trim() });
      setResult(insertResult);
    } catch (insertError: any) {
      setResult(null);
      setError(insertError.message || "Failed to insert estimates into Jira");
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-2xl">
      <ModalHeader
        icon={Upload}
        title="Insert Estimates into Jira"
        subtitle="Update Jira story points with finalized estimates when the issue type supports them"
        onClose={onClose}
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {error && <Alert variant="danger">{error}</Alert>}

        {jiraSettings && !jiraSettings.hasApiToken && (
          <Alert variant="warning">
            No JIRA API token saved.{" "}
            <a
              href="/settings/jira"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline"
            >
              Add it in JIRA Settings
            </a>{" "}
            before inserting estimates.
          </Alert>
        )}

        {result ? (
          <div className="space-y-3">
            <Alert variant={result.failed.length > 0 ? "warning" : "success"}>
              Updated story points for {result.updated.length} of{" "}
              {result.total} Jira issue{result.total === 1 ? "" : "s"}
              {result.skipped.length > 0 &&
                `, skipped ${result.skipped.length}`}
              {result.failed.length > 0 && `, ${result.failed.length} failed`}.
            </Alert>

            {result.updated.length > 0 && (
              <div
                className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2"
                style={{ borderColor: "var(--border-color)" }}
              >
                {result.updated.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm"
                    style={{
                      backgroundColor: "var(--surface-secondary)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <Badge variant="success">{item.key}</Badge>
                    <span className="font-semibold">
                      {item.storyPoints} points
                    </span>
                  </div>
                ))}
              </div>
            )}

            {result.failed.length > 0 && (
              <div className="space-y-2">
                {result.failed.map((item) => (
                  <Alert
                    key={item.key}
                    variant={
                      isUnsupportedEstimationError(item.error)
                        ? "warning"
                        : "danger"
                    }
                  >
                    <span className="font-semibold">{item.key}</span>:{" "}
                    {item.error}
                  </Alert>
                ))}
              </div>
            )}

            {result.skipped.length > 0 && (
              <Alert variant="neutral">
                Skipped (non-numeric estimate):{" "}
                {result.skipped
                  .map((item) => `${item.key} (${item.estimate ?? "—"})`)
                  .join(", ")}
              </Alert>
            )}
          </div>
        ) : (
          <>
            <form
              id="jira-insert-estimates-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Field
                label="Email"
                helperText="Used with your saved API token to authenticate with Jira"
              >
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </Field>

              {jiraSettings && (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span className="min-w-0 truncate">
                    Updating story points on{" "}
                    <span className="font-medium">{jiraSettings.siteUrl}</span>
                  </span>
                  <a
                    href="/settings/jira"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 font-medium underline"
                  >
                    <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                    JIRA Settings
                  </a>
                </div>
              )}
            </form>

            {issues.length === 0 ? (
              <Alert variant="neutral">
                No Jira issues have a finalized estimate yet. Finish voting an
                issue (or set its estimate) and try again.
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">
                    {pushableIssues.length} will be updated
                  </Badge>
                  {nonNumericIssues.length > 0 && (
                    <Badge variant="warning">
                      {nonNumericIssues.length} skipped (non-numeric)
                    </Badge>
                  )}
                </div>

                <div
                  className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  {issues.map((issue) => {
                    const numeric = isNumericEstimate(issue.final_estimate);

                    return (
                      <div
                        key={issue.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                        style={{
                          backgroundColor: "var(--surface-secondary)",
                          borderColor: "var(--border-subtle)",
                          opacity: numeric ? 1 : 0.62,
                        }}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge variant={numeric ? "info" : "warning"}>
                              {issue.external_key}
                            </Badge>
                            {!numeric && (
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                Skipped — estimate is not a number
                              </span>
                            )}
                          </span>
                          <span className="block text-sm font-medium leading-5">
                            {issue.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold">
                          {issue.final_estimate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ModalFooter layout="split">
        <Button type="button" variant="secondary" onClick={onClose}>
          {result ? "Close" : "Cancel"}
        </Button>
        {result ? (
          <Button type="button" variant="primary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <Button
            type="submit"
            form="jira-insert-estimates-form"
            variant="primary"
            disabled={!formIsComplete}
            isLoading={isLoading}
          >
            Insert estimates
          </Button>
        )}
      </ModalFooter>
    </ModalShell>
  );
}
