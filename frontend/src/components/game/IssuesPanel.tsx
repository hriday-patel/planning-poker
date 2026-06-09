"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  FileUp,
  Link as LinkIcon,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
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
  isImportingJira: boolean;
  isInsertingEstimates: boolean;
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
  onImportJira: () => void;
  onInsertEstimates: () => void;
  onNewIssueTitleChange: (value: string) => void;
  onRemovePendingIssues: () => void;
  onToggleAddIssueForm: () => void;
  onVoteIssue: (issue: Issue) => void;
}

const ALL_ASSIGNEES_FILTER = "all";
const UNASSIGNED_FILTER = "__unassigned__";

const getIssueAssignee = (issue: Issue): string | null =>
  issue.assignee?.trim() || null;

export default function IssuesPanel({
  actionError,
  activeIssueId,
  canManageIssues,
  isConnected,
  isImportingIssues,
  isImportingJira,
  isInsertingEstimates,
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
  onImportJira,
  onInsertEstimates,
  onNewIssueTitleChange,
  onRemovePendingIssues,
  onToggleAddIssueForm,
  onVoteIssue,
  revealedIssueId,
  showAddIssueForm,
}: IssuesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const issueRefs = useRef(new Map<string, HTMLDivElement>());
  const previousIssueIdsRef = useRef<Set<string>>(new Set());
  const isInitialIssuesRenderRef = useRef(true);
  const [assigneeFilter, setAssigneeFilter] = useState<string>(
    ALL_ASSIGNEES_FILTER,
  );

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();

    issues.forEach((issue) => {
      const assignee = getIssueAssignee(issue);

      if (assignee) {
        names.add(assignee);
      }
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [issues]);

  const hasUnassignedIssues = useMemo(
    () => issues.some((issue) => !getIssueAssignee(issue)),
    [issues],
  );

  // Reset the filter if the selected assignee no longer has any issues.
  useEffect(() => {
    if (assigneeFilter === ALL_ASSIGNEES_FILTER) {
      return;
    }

    const filterIsStale =
      assigneeFilter === UNASSIGNED_FILTER
        ? !hasUnassignedIssues
        : !assigneeOptions.includes(assigneeFilter);

    if (filterIsStale) {
      setAssigneeFilter(ALL_ASSIGNEES_FILTER);
    }
  }, [assigneeFilter, assigneeOptions, hasUnassignedIssues]);

  const visibleIssues = useMemo(() => {
    if (assigneeFilter === ALL_ASSIGNEES_FILTER) {
      return issues;
    }

    if (assigneeFilter === UNASSIGNED_FILTER) {
      return issues.filter((issue) => !getIssueAssignee(issue));
    }

    return issues.filter(
      (issue) => getIssueAssignee(issue) === assigneeFilter,
    );
  }, [assigneeFilter, issues]);

  const isAssigneeFilterActive = assigneeFilter !== ALL_ASSIGNEES_FILTER;

  useEffect(() => {
    const currentIssueIds = new Set(issues.map((issue) => issue.id));

    if (isInitialIssuesRenderRef.current) {
      isInitialIssuesRenderRef.current = false;
      previousIssueIdsRef.current = currentIssueIds;
      return;
    }

    const newlyAddedIssues = issues.filter(
      (issue) => !previousIssueIdsRef.current.has(issue.id),
    );
    previousIssueIdsRef.current = currentIssueIds;

    if (newlyAddedIssues.length === 0) {
      return;
    }

    const newlyAddedIssueIds = new Set(
      newlyAddedIssues.map((issue) => issue.id),
    );
    const lastNewIssue = [...issues]
      .reverse()
      .find((issue) => newlyAddedIssueIds.has(issue.id));

    if (!lastNewIssue) {
      return;
    }

    requestAnimationFrame(() => {
      issueRefs.current
        .get(lastNewIssue.id)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [issues]);

  const pendingCount = issues.filter(
    (issue) => issue.status === "pending",
  ).length;
  const estimateReadyCount = issues.filter(
    (issue) =>
      issue.source === "jira" &&
      Boolean(issue.external_key) &&
      issue.final_estimate != null,
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
            disabled={actionsDisabled || isImportingIssues || isImportingJira}
            isLoading={isImportingIssues}
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Import CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onImportJira}
            disabled={actionsDisabled || isImportingIssues || isImportingJira}
            isLoading={isImportingJira}
          >
            <LinkIcon className="h-4 w-4" aria-hidden="true" />
            Import Jira
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onInsertEstimates}
            disabled={
              actionsDisabled || isInsertingEstimates || estimateReadyCount === 0
            }
            isLoading={isInsertingEstimates}
            title="Update Jira story points with the finalized estimates"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Insert Estimates
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
          <div className="relative col-span-2">
            <Users
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden="true"
            />
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              aria-label="Filter issues by assignee"
              title={
                assigneeOptions.length === 0
                  ? "No assignee information yet; import Jira issues to filter by assignee"
                  : "Filter issues by assignee"
              }
              disabled={assigneeOptions.length === 0}
              className="min-h-9 w-full appearance-none rounded-lg border py-2 pl-9 pr-9 text-sm font-semibold shadow-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-55"
              style={{
                backgroundColor: "var(--surface-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              <option value={ALL_ASSIGNEES_FILTER}>All assignees</option>
              {assigneeOptions.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
              {hasUnassignedIssues && assigneeOptions.length > 0 && (
                <option value={UNASSIGNED_FILTER}>Unassigned</option>
              )}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden="true"
            />
          </div>
          {isAssigneeFilterActive && (
            <p
              className="col-span-2 text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Showing {visibleIssues.length} of {issues.length} issues for{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                {assigneeFilter === UNASSIGNED_FILTER
                  ? "Unassigned"
                  : assigneeFilter}
              </span>
            </p>
          )}
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
          ) : visibleIssues.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No matching issues"
              description="No issues match the selected assignee filter."
              className="mt-8"
            />
          ) : (
            <div className="space-y-3">
              {visibleIssues.map((issue) => {
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
                    ref={(element) => {
                      if (element) {
                        issueRefs.current.set(issue.id, element);
                      } else {
                        issueRefs.current.delete(issue.id);
                      }
                    }}
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
                      <div className="min-w-0 flex-1">
                        {(issue.external_key || issue.assignee) && (
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {issue.external_key &&
                              (issue.external_url ? (
                                <a
                                  href={issue.external_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex"
                                >
                                  <Badge variant="info">
                                    {issue.external_key}
                                  </Badge>
                                </a>
                              ) : (
                                <Badge variant="info">
                                  {issue.external_key}
                                </Badge>
                              ))}
                            {issue.assignee && (
                              <span
                                className="inline-flex min-w-0 items-center gap-1 text-xs font-medium"
                                style={{ color: "var(--text-secondary)" }}
                                title={`Assigned to ${issue.assignee}`}
                              >
                                <User
                                  className="h-3 w-3 shrink-0"
                                  aria-hidden="true"
                                />
                                <span className="truncate">
                                  {issue.assignee}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                        <h3 className="min-w-0 text-sm font-semibold leading-5">
                          {issue.title}
                        </h3>
                      </div>
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
                          {issue.final_estimate || " —"}
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
