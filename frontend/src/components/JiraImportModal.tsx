"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ListChecks, Settings2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  JiraDuplicateAction,
  JiraImportCandidate,
  JiraImportPreviewResponse,
  JiraImportRequest,
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
  email: "",
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
  const [enabledIssueTypes, setEnabledIssueTypes] = useState<Set<string>>(
    new Set(),
  );
  const [jiraSettings, setJiraSettings] = useState<JiraSettings | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCredentials(emptyCredentials);
      setCandidates([]);
      setSelectedKeys(new Set());
      setDuplicateAction("skip");
      setError(null);
      setEnabledIssueTypes(new Set());
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

  // Get all unique issue types from candidates
  const issueTypes = useMemo(() => {
    const types = new Set<string>();
    candidates.forEach((candidate) => {
      if (candidate.issueType) {
        types.add(candidate.issueType);
      }
    });
    return Array.from(types).sort();
  }, [candidates]);

  // Group candidates by issue type
  const groupedCandidates = useMemo(() => {
    const groups = new Map<string, JiraImportCandidate[]>();
    
    candidates.forEach((candidate) => {
      const type = candidate.issueType || "Other";
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(candidate);
    });

    // Sort groups by issue type name
    return new Map(
      Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)),
    );
  }, [candidates]);

  // Filter candidates based on enabled issue types
  const filteredCandidates = useMemo(() => {
    if (enabledIssueTypes.size === 0) {
      return candidates;
    }
    return candidates.filter((candidate) =>
      enabledIssueTypes.has(candidate.issueType || "Other"),
    );
  }, [candidates, enabledIssueTypes]);

  // Filter grouped candidates based on enabled issue types
  const filteredGroupedCandidates = useMemo(() => {
    if (enabledIssueTypes.size === 0) {
      return groupedCandidates;
    }
    const filtered = new Map<string, JiraImportCandidate[]>();
    groupedCandidates.forEach((issues, type) => {
      if (enabledIssueTypes.has(type)) {
        filtered.set(type, issues);
      }
    });
    return filtered;
  }, [groupedCandidates, enabledIssueTypes]);

  const selectedCandidates = useMemo(() => {
    return filteredCandidates.filter((candidate) =>
      selectedKeys.has(candidate.key),
    );
  }, [filteredCandidates, selectedKeys]);

  const importCandidates = useMemo(() => {
    if (duplicateAction === "include") {
      return selectedCandidates;
    }

    return selectedCandidates.filter((candidate) => !candidate.isDuplicate);
  }, [duplicateAction, selectedCandidates]);

  const duplicateCount = filteredCandidates.filter(
    (candidate) => candidate.isDuplicate,
  ).length;
  const hasSavedToken = jiraSettings?.hasApiToken ?? true;
  const formIsComplete = Boolean(
    credentials.email.trim() && credentials.sprintId.trim() && hasSavedToken,
  );

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const preview = await onPreview(credentials);
      setCandidates(preview.candidates);
      
      // Enable all issue types by default
      const types = new Set<string>();
      preview.candidates.forEach((candidate) => {
        if (candidate.issueType) {
          types.add(candidate.issueType);
        }
      });
      setEnabledIssueTypes(types);
      
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
      setEnabledIssueTypes(new Set());
      setError(previewError.message || "Failed to preview Jira sprint");
    }
  };

  const handleDuplicateActionChange = (nextAction: JiraDuplicateAction) => {
    setDuplicateAction(nextAction);

    if (nextAction === "skip") {
      setSelectedKeys(
        new Set(
          filteredCandidates
            .filter(
              (candidate) =>
                selectedKeys.has(candidate.key) && !candidate.isDuplicate,
            )
            .map((candidate) => candidate.key),
        ),
      );
    }
  };

  const handleToggleIssueType = (issueType: string) => {
    setEnabledIssueTypes((prev) => {
      const next = new Set(prev);
      if (next.has(issueType)) {
        next.delete(issueType);
        // Deselect all issues of this type
        const issuesOfType = candidates
          .filter((c) => (c.issueType || "Other") === issueType)
          .map((c) => c.key);
        setSelectedKeys((prevKeys) => {
          const nextKeys = new Set(prevKeys);
          issuesOfType.forEach((key) => nextKeys.delete(key));
          return nextKeys;
        });
      } else {
        next.add(issueType);
        // Auto-select non-duplicate issues of this type
        const issuesOfType = candidates
          .filter(
            (c) =>
              (c.issueType || "Other") === issueType &&
              (duplicateAction === "include" || !c.isDuplicate),
          )
          .map((c) => c.key);
        setSelectedKeys((prevKeys) => {
          const nextKeys = new Set(prevKeys);
          issuesOfType.forEach((key) => nextKeys.add(key));
          return nextKeys;
        });
      }
      return next;
    });
  };

  const handleSelectAllInGroup = (issueType: string) => {
    const issuesInGroup = candidates.filter(
      (c) =>
        (c.issueType || "Other") === issueType &&
        (duplicateAction === "include" || !c.isDuplicate),
    );
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      issuesInGroup.forEach((issue) => next.add(issue.key));
      return next;
    });
  };

  const handleDeselectAllInGroup = (issueType: string) => {
    const issuesInGroup = candidates.filter(
      (c) => (c.issueType || "Other") === issueType,
    );
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      issuesInGroup.forEach((issue) => next.delete(issue.key));
      return next;
    });
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
            before importing.
          </Alert>
        )}

        <form
          id="jira-preview-form"
          onSubmit={handlePreview}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
                Importing from{" "}
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

        {candidates.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{filteredCandidates.length} found</Badge>
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

            {/* Issue Type Filters */}
            {issueTypes.length > 0 && (
              <div
                className="rounded-lg border p-3"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="mb-2 text-sm font-medium">Filter by type:</div>
                <div className="flex flex-wrap gap-2">
                  {issueTypes.map((issueType) => {
                    const typeCount = groupedCandidates.get(issueType)?.length || 0;
                    const isEnabled = enabledIssueTypes.has(issueType);
                    
                    return (
                      <label
                        key={issueType}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 transition-colors"
                        style={{
                          backgroundColor: isEnabled
                            ? "var(--primary-color)"
                            : "var(--surface-primary)",
                          borderColor: isEnabled
                            ? "var(--primary-color)"
                            : "var(--border-color)",
                          color: isEnabled
                            ? "var(--primary-contrast)"
                            : "var(--text-primary)",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={isEnabled}
                          onChange={() => handleToggleIssueType(issueType)}
                        />
                        <span className="text-sm font-medium">
                          {issueType} ({typeCount})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grouped Issues List */}
            <div
              className="max-h-80 space-y-3 overflow-y-auto rounded-lg border p-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              {filteredGroupedCandidates.size === 0 ? (
                <div
                  className="rounded-lg p-4 text-center text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No issues match the selected filters
                </div>
              ) : (
                Array.from(filteredGroupedCandidates.entries()).map(
                  ([issueType, issues]) => {
                    const selectedInGroup = issues.filter((issue) =>
                      selectedKeys.has(issue.key),
                    ).length;
                    const selectableInGroup = issues.filter(
                      (issue) =>
                        duplicateAction === "include" || !issue.isDuplicate,
                    ).length;

                    return (
                      <div key={issueType} className="space-y-2">
                        {/* Group Header */}
                        <div
                          className="sticky top-0 z-10 flex items-center justify-between rounded-lg border px-3 py-2"
                          style={{
                            backgroundColor: "var(--surface-primary)",
                            borderColor: "var(--border-color)",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {issueType}
                            </span>
                            <Badge variant="neutral">
                              {selectedInGroup}/{issues.length}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSelectAllInGroup(issueType)}
                              disabled={selectedInGroup === selectableInGroup}
                            >
                              Select all
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeselectAllInGroup(issueType)
                              }
                              disabled={selectedInGroup === 0}
                            >
                              Deselect all
                            </Button>
                          </div>
                        </div>

                        {/* Issues in Group */}
                        <div className="space-y-2 pl-2">
                          {issues.map((candidate) => {
                            const disabled =
                              candidate.isDuplicate &&
                              duplicateAction === "skip";
                            const checked =
                              selectedKeys.has(candidate.key) && !disabled;

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
                                  onChange={() =>
                                    handleToggleCandidate(candidate)
                                  }
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="mb-1 flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant={
                                        candidate.isDuplicate
                                          ? "warning"
                                          : "info"
                                      }
                                    >
                                      {candidate.key}
                                    </Badge>
                                    {candidate.status && (
                                      <span
                                        className="text-xs"
                                        style={{
                                          color: "var(--text-tertiary)",
                                        }}
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
                    );
                  },
                )
              )}
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
