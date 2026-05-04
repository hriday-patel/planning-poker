"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ListChecks } from "lucide-react";
import {
  JiraDuplicateAction,
  JiraImportCandidate,
  JiraImportPreviewResponse,
  JiraImportRequest,
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

interface JiraImportModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (
    issues: JiraImportCandidate[],
    duplicateAction: JiraDuplicateAction,
  ) => Promise<void>;
  onPreview: (request: JiraImportRequest) => Promise<JiraImportPreviewResponse>;
}

const emptyCredentials: JiraImportRequest = {
  siteUrl: "",
  email: "",
  apiToken: "",
  sprintId: "",
};

export default function JiraImportModal({
  isLoading,
  isOpen,
  onClose,
  onConfirm,
  onPreview,
}: JiraImportModalProps) {
  const [credentials, setCredentials] =
    useState<JiraImportRequest>(emptyCredentials);
  const [candidates, setCandidates] = useState<JiraImportCandidate[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [duplicateAction, setDuplicateAction] =
    useState<JiraDuplicateAction>("skip");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCredentials(emptyCredentials);
      setCandidates([]);
      setSelectedKeys(new Set());
      setDuplicateAction("skip");
      setError(null);
    }
  }, [isOpen]);

  const selectedCandidates = useMemo(() => {
    return candidates.filter((candidate) => selectedKeys.has(candidate.key));
  }, [candidates, selectedKeys]);

  const importCandidates = useMemo(() => {
    if (duplicateAction === "include") {
      return selectedCandidates;
    }

    return selectedCandidates.filter((candidate) => !candidate.isDuplicate);
  }, [duplicateAction, selectedCandidates]);

  const duplicateCount = candidates.filter(
    (candidate) => candidate.isDuplicate,
  ).length;
  const formIsComplete = Boolean(
    credentials.siteUrl.trim() &&
    credentials.email.trim() &&
    credentials.apiToken.trim() &&
    credentials.sprintId.trim(),
  );

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const preview = await onPreview(credentials);
      setCandidates(preview.candidates);
      setSelectedKeys(
        new Set(
          preview.candidates
            .filter((candidate) => !candidate.isDuplicate)
            .map((candidate) => candidate.key),
        ),
      );
      setDuplicateAction(preview.duplicateCount > 0 ? "skip" : "include");
    } catch (previewError: any) {
      setCandidates([]);
      setSelectedKeys(new Set());
      setError(previewError.message || "Failed to preview Jira sprint");
    }
  };

  const handleDuplicateActionChange = (nextAction: JiraDuplicateAction) => {
    setDuplicateAction(nextAction);

    if (nextAction === "skip") {
      setSelectedKeys(
        new Set(
          candidates
            .filter(
              (candidate) =>
                selectedKeys.has(candidate.key) && !candidate.isDuplicate,
            )
            .map((candidate) => candidate.key),
        ),
      );
    }
  };

  const handleToggleCandidate = (candidate: JiraImportCandidate) => {
    if (candidate.isDuplicate && duplicateAction === "skip") {
      return;
    }

    setSelectedKeys((prev) => {
      const next = new Set(prev);

      if (next.has(candidate.key)) {
        next.delete(candidate.key);
      } else {
        next.add(candidate.key);
      }

      return next;
    });
  };

  const handleImport = async () => {
    if (importCandidates.length === 0) {
      setError("Choose at least one Jira issue to import");
      return;
    }

    setError(null);

    try {
      await onConfirm(importCandidates, duplicateAction);
      onClose();
    } catch (importError: any) {
      setError(importError.message || "Failed to import Jira issues");
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-3xl">
      <ModalHeader
        icon={ListChecks}
        title="Import Jira Sprint"
        subtitle="Preview sprint issues before adding them to this game"
        onClose={onClose}
      />

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <form
          id="jira-preview-form"
          onSubmit={handlePreview}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jira site">
              <Input
                value={credentials.siteUrl}
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    siteUrl: event.target.value,
                  }))
                }
                placeholder="https://jsw.ibm.com"
                autoComplete="url"
              />
            </Field>

            <Field label="Email">
              <Input
                value={credentials.email}
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                type="email"
                autoComplete="email"
              />
            </Field>

            <Field label="API token">
              <Input
                value={credentials.apiToken}
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    apiToken: event.target.value,
                  }))
                }
                type="password"
                autoComplete="off"
              />
            </Field>

            <Field label="Sprint ID or name">
              <Input
                value={credentials.sprintId}
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    sprintId: event.target.value,
                  }))
                }
                inputMode="numeric"
              />
            </Field>
          </div>
        </form>

        {candidates.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{candidates.length} found</Badge>
                {duplicateCount > 0 && (
                  <Badge variant="warning">{duplicateCount} duplicates</Badge>
                )}
                <Badge variant="success">
                  {importCandidates.length} selected
                </Badge>
              </div>

              {duplicateCount > 0 && (
                <div
                  className="inline-flex rounded-lg border p-1"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={duplicateAction === "skip" ? "primary" : "ghost"}
                    aria-pressed={duplicateAction === "skip"}
                    onClick={() => handleDuplicateActionChange("skip")}
                  >
                    Skip duplicates
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      duplicateAction === "include" ? "primary" : "ghost"
                    }
                    aria-pressed={duplicateAction === "include"}
                    onClick={() => handleDuplicateActionChange("include")}
                  >
                    Include duplicates
                  </Button>
                </div>
              )}
            </div>

            <div
              className="max-h-80 space-y-2 overflow-y-auto rounded-lg border p-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              {candidates.map((candidate) => {
                const disabled =
                  candidate.isDuplicate && duplicateAction === "skip";
                const checked = selectedKeys.has(candidate.key) && !disabled;

                return (
                  <label
                    key={candidate.key}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                    style={{
                      backgroundColor: "var(--surface-secondary)",
                      borderColor: "var(--border-subtle)",
                      opacity: disabled ? 0.62 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => handleToggleCandidate(candidate)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={candidate.isDuplicate ? "warning" : "info"}
                        >
                          {candidate.key}
                        </Badge>
                        {candidate.issueType && (
                          <Badge variant="neutral">{candidate.issueType}</Badge>
                        )}
                        {candidate.status && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {candidate.status}
                          </span>
                        )}
                      </span>
                      <span className="block text-sm font-medium leading-5">
                        {candidate.title}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {candidates.length === 0 && (
          <Alert variant="neutral">
            Enter the sprint details and preview the Jira issues.
          </Alert>
        )}
      </div>

      <ModalFooter layout="split">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="submit"
            form="jira-preview-form"
            disabled={!formIsComplete}
            isLoading={isLoading && candidates.length === 0}
          >
            Preview
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleImport}
            disabled={importCandidates.length === 0}
            isLoading={isLoading && candidates.length > 0}
          >
            Import selected
          </Button>
        </div>
      </ModalFooter>
    </ModalShell>
  );
}

// Made with Bob
