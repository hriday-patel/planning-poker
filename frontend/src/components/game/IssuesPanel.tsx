"use client";

import { type FormEvent } from "react";
import { ListChecks, Plus, X } from "lucide-react";
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
  isRoundInProgress: boolean;
  issueCounts: IssueCounts;
  issues: Issue[];
  newIssueTitle: string;
  showAddIssueForm: boolean;
  onAddIssueSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelAddIssue: () => void;
  onClose: () => void;
  onNewIssueTitleChange: (value: string) => void;
  onToggleAddIssueForm: () => void;
  onVoteIssue: (issue: Issue) => void;
}

export default function IssuesPanel({
  actionError,
  activeIssueId,
  canManageIssues,
  isConnected,
  isRoundInProgress,
  issueCounts,
  issues,
  newIssueTitle,
  onAddIssueSubmit,
  onCancelAddIssue,
  onClose,
  onNewIssueTitleChange,
  onToggleAddIssueForm,
  onVoteIssue,
  showAddIssueForm,
}: IssuesPanelProps) {
  return (
    <aside
      aria-labelledby="issues-panel-heading"
      className="fixed inset-y-0 right-0 z-50 flex w-[min(92vw,380px)] flex-col border-l lg:static lg:z-auto lg:w-auto"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div
        className="flex min-h-16 items-center justify-between border-b px-4"
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
                : "Only the facilitator can manage issues"
            }
            variant="secondary"
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
            <Plus className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          <IconButton
            onClick={onClose}
            aria-label="Close issues"
            title="Close issues"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!canManageIssues && (
          <Alert variant="warning" className="mb-3">
            Only the facilitator can add issues or start issue voting.
          </Alert>
        )}

        {actionError && (
          <Alert variant="danger" className="mb-3">
            {actionError}
          </Alert>
        )}

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
                    <Badge
                      variant={
                        issue.status === "voting"
                          ? "info"
                          : isIssueVoted
                            ? "success"
                            : "neutral"
                      }
                      className="shrink-0 capitalize"
                    >
                      {issue.status}
                    </Badge>
                  </div>

                  {isIssueVoted && (
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
                          ? "Facilitator only"
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
    </aside>
  );
}

// Made with Bob
