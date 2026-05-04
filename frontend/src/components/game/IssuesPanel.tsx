"use client";

import { type ChangeEvent, type FormEvent, useRef } from "react";
import { FileUp, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Issue } from "@/types/game.types";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  IconButton,
  Textarea,
} from "@/components/ui";

interface IssueCounts {
  total: number;
  voted: number;
}

interface IssuesPanelProps {
  actionError: string | null;
  activeIssueId?: string | null;
  canManageIssues: boolean;
  isConnected: boolean;
  isImportingIssues: boolean;
  isRoundInProgress: boolean;
  issueCounts: IssueCounts;
  issues: Issue[];
  newIssueTitle: string;
  revealedIssueId?: string | null;
  showAddIssueForm: boolean;
  onAddIssueSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelAddIssue: () => void;
  onClose: () => void;
  onDeleteIssue: (issue: Issue) => void;
  onEditIssue: (issue: Issue) => void;
  onImportCsv: (file: File) => void;
  onNewIssueTitleChange: (value: string) => void;
  onRemovePendingIssues: () => void;
  onToggleAddIssueForm: () => void;
  onVoteIssue: (issue: Issue) => void;
}

export default function IssuesPanel({
  actionError,
  activeIssueId,
  canManageIssues,
  isConnected,
  isImportingIssues,
  isRoundInProgress,
  issueCounts,
  issues,
  newIssueTitle,
  onAddIssueSubmit,
  onCancelAddIssue,
  onClose,
  onDeleteIssue,
  onEditIssue,
  onImportCsv,
  onNewIssueTitleChange,
  onRemovePendingIssues,
  onToggleAddIssueForm,
  onVoteIssue,
  revealedIssueId,
  showAddIssueForm,
}: IssuesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingCount = issues.filter(
    (issue) => issue.status === "pending",
  ).length;
  const actionsDisabled = !isConnected || !canManageIssues;

  const handleCsvChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      onImportCsv(file);
    }
  };

  return (
    <aside
      aria-labelledby="issues-panel-heading"
      className="fixed inset-y-0 right-0 z-50 flex w-[min(92vw,380px)] flex-col border-l lg:static lg:z-auto lg:h-full lg:min-h-0 lg:w-auto"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div
        className="flex min-h-16 shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div>
          <h2 id="issues-panel-heading" className="text-lg font-semibold">
            Issues
          </h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {issueCounts.voted}/{issueCounts.total} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            onClick={onToggleAddIssueForm}
            aria-label="Add issue"
            title={
              canManageIssues
                ? "Add issue"
                : "Issue management is facilitator-only in this game"
            }
            variant="secondary"
            size="sm"
            style={{
              backgroundColor: canManageIssues
                ? "var(--surface-secondary)"
                : "var(--surface-tertiary)",
              borderColor: "var(--border-color)",
              color: canManageIssues
                ? "var(--text-primary)"
                : "var(--text-muted)",
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton
            onClick={onClose}
            aria-label="Close issues"
            title="Close issues"
            size="sm"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        {!canManageIssues && (
          <Alert variant="warning" className="mb-3">
            Issue management is controlled by the facilitator in this game.
          </Alert>
        )}

        {actionError && (
          <Alert variant="danger" className="mb-3">
            {actionError}
          </Alert>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={actionsDisabled || isImportingIssues}
            isLoading={isImportingIssues}
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Import CSV
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onRemovePendingIssues}
            disabled={actionsDisabled || pendingCount === 0}
            title="Remove all pending issues"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Pending
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvChange}
          />
        </div>

        {showAddIssueForm && (
          <form onSubmit={onAddIssueSubmit} className="mb-4 space-y-3">
            <label htmlFor="new-issue-title" className="sr-only">
              Issue title
            </label>
            <Textarea
              id="new-issue-title"
              value={newIssueTitle}
              onChange={(event) => onNewIssueTitleChange(event.target.value)}
              maxLength={500}
              rows={4}
              autoFocus
              placeholder="Write an issue or user story"
              className="w-full resize-none rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  !newIssueTitle.trim() || !isConnected || !canManageIssues
                }
                className="flex-1"
              >
                Add issue
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onCancelAddIssue}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {issues.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No issues yet"
              description="Use the add button to build the voting queue."
              className="mt-8"
            />
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => {
                const isActiveIssue = activeIssueId === issue.id;
                const isIssueVoted = issue.status === "voted";
                const isPendingIssue = issue.status === "pending";
                const shouldShowEstimate =
                  isIssueVoted || revealedIssueId === issue.id;
                const canDeleteIssue =
                  actionsDisabled === false && isPendingIssue;
                const canEditIssue =
                  actionsDisabled === false && isPendingIssue;
                const canStartIssueVote =
                  isConnected &&
                  canManageIssues &&
                  !isIssueVoted &&
                  !isRoundInProgress;

                return (
                  <div
                    key={issue.id}
                    className="rounded-lg border p-4 shadow-theme"
                    style={{
                      backgroundColor: isActiveIssue
                        ? "var(--surface-accent)"
                        : "var(--surface-primary)",
                      borderColor: isActiveIssue
                        ? "var(--primary)"
                        : "var(--border-color)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 text-sm font-semibold leading-5">
                        {issue.title}
                      </h3>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant={
                            issue.status === "voting"
                              ? "info"
                              : isIssueVoted
                                ? "success"
                                : "neutral"
                          }
                          className="capitalize"
                        >
                          {issue.status}
                        </Badge>
                        {isPendingIssue && canManageIssues && (
                          <IconButton
                            type="button"
                            aria-label={`Edit ${issue.title}`}
                            title="Edit pending issue"
                            size="sm"
                            variant="secondary"
                            onClick={() => onEditIssue(issue)}
                            disabled={!canEditIssue}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </IconButton>
                        )}
                        {isPendingIssue && (
                          <IconButton
                            type="button"
                            aria-label={`Remove ${issue.title}`}
                            title="Remove pending issue"
                            size="sm"
                            variant="danger"
                            onClick={() => onDeleteIssue(issue)}
                            disabled={!canDeleteIssue}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </IconButton>
                        )}
                      </div>
                    </div>

                    {shouldShowEstimate && (
                      <div
                        className="mt-3 rounded-lg border px-3 py-2 text-sm"
                        style={{
                          backgroundColor: "var(--surface-secondary)",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        Estimate:{" "}
                        <span className="font-semibold">
                          {issue.final_estimate || "No consensus"}
                        </span>
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={() => onVoteIssue(issue)}
                      disabled={!canStartIssueVote}
                      variant={canStartIssueVote ? "primary" : "subtle"}
                      className="mt-3 w-full"
                    >
                      {isIssueVoted
                        ? "Voted"
                        : isActiveIssue && isRoundInProgress
                          ? "Voting now"
                          : !canManageIssues
                            ? "Restricted"
                            : isRoundInProgress
                              ? "Finish current issue"
                              : "Vote this issue"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// Made with Bob
