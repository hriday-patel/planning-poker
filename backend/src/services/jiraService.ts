import { JiraImportCandidate } from "../types/game.types";

const DEFAULT_ALLOWED_JIRA_HOSTS = ["*.atlassian.net", "*.ibm.com"];

export const DEFAULT_JIRA_SITE_URL = "https://jsw.ibm.com/secure/Dashboard.jspa";

interface FetchJiraSprintIssuesParams {
  siteUrl: string;
  email: string;
  apiToken: string;
  sprintId: string;
}

interface JiraIssueResponse {
  key?: string;
  fields?: {
    summary?: string;
    issuetype?: {
      name?: string;
    };
    status?: {
      name?: string;
    };
    assignee?: {
      displayName?: string;
      name?: string;
      emailAddress?: string;
    } | null;
  };
}

interface JiraSprintIssuesResponse {
  issues?: JiraIssueResponse[];
  startAt?: number;
  maxResults?: number;
  total?: number;
}

interface JiraFetchContext {
  authHeader: string;
  normalizedSiteUrl: string;
  sprintId: string;
}

interface JiraFieldResponse {
  id?: string;
  name?: string;
}

export interface JiraStoryPointUpdate {
  issueKey: string;
  storyPoints: number;
}

interface PushJiraStoryPointsParams {
  siteUrl: string;
  email: string;
  apiToken: string;
  updates: JiraStoryPointUpdate[];
}

export interface JiraStoryPointsPushResult {
  updated: { key: string; storyPoints: number }[];
  failed: { key: string; error: string }[];
}

export class JiraApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "JiraApiError";
    this.statusCode = statusCode;
  }
}

const getAllowedJiraHostPatterns = (): string[] => {
  const configuredHosts = process.env.JIRA_ALLOWED_HOSTS;

  if (!configuredHosts) {
    return DEFAULT_ALLOWED_JIRA_HOSTS;
  }

  return configuredHosts
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
};

const hostMatchesPattern = (hostname: string, pattern: string): boolean => {
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1);
    return hostname.endsWith(suffix) && hostname.length > suffix.length;
  }

  return hostname === pattern;
};

const isAllowedJiraHost = (hostname: string): boolean => {
  const normalizedHostname = hostname.toLowerCase();
  return getAllowedJiraHostPatterns().some((pattern) =>
    hostMatchesPattern(normalizedHostname, pattern),
  );
};

export const normalizeJiraSiteUrl = (siteUrl: string): string => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(siteUrl.trim());
  } catch (_error) {
    throw new JiraApiError("Enter a valid Jira site URL");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new JiraApiError("Jira site URL must use HTTPS");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new JiraApiError("Jira site URL must not include credentials");
  }

  if (!isAllowedJiraHost(parsedUrl.hostname)) {
    throw new JiraApiError("Jira site host is not allowed for imports");
  }

  return parsedUrl.origin;
};

const formatSprintJqlValue = (sprintId: string): string => {
  if (/^\d+$/.test(sprintId)) {
    return sprintId;
  }

  const escapedSprintName = sprintId
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  return `"${escapedSprintName}"`;
};

const toImportCandidate = (
  issue: JiraIssueResponse,
  normalizedSiteUrl: string,
): JiraImportCandidate | null => {
  if (!issue.key) {
    return null;
  }

  const summary = issue.fields?.summary?.trim() || issue.key;
  const assignee = issue.fields?.assignee;
  const assigneeName =
    assignee?.displayName?.trim() ||
    assignee?.name?.trim() ||
    assignee?.emailAddress?.trim() ||
    null;

  return {
    key: issue.key,
    title: summary,
    url: `${normalizedSiteUrl}/browse/${encodeURIComponent(issue.key)}`,
    issueType: issue.fields?.issuetype?.name || null,
    status: issue.fields?.status?.name || null,
    assignee: assigneeName,
  };
};

const readJiraError = async (response: Response): Promise<string> => {
  try {
    const data: any = await response.json();
    const message =
      data?.message ||
      data?.errorMessages?.[0] ||
      data?.errors?.[Object.keys(data.errors || {})[0]];

    return typeof message === "string" ? message : response.statusText;
  } catch (_error) {
    return response.statusText;
  }
};

const getJiraStatusMessage = async (
  response: Response,
  notFoundMessage = "Jira sprint was not found for this site",
): Promise<string> => {
  if (response.status === 401 || response.status === 403) {
    return "Jira rejected the email or API token";
  }

  if (response.status === 404) {
    return notFoundMessage;
  }

  if (response.status === 429) {
    return "Jira rate limit reached; try again shortly";
  }

  const detail = await readJiraError(response);
  return detail || "Jira request failed";
};

const fetchJiraAgileSprintIssues = async ({
  authHeader,
  normalizedSiteUrl,
  sprintId,
}: JiraFetchContext): Promise<JiraImportCandidate[]> => {
  const issues: JiraImportCandidate[] = [];
  let startAt = 0;
  let total = Number.POSITIVE_INFINITY;
  const maxResults = 50;

  while (startAt < total) {
    const url = new URL(
      `/rest/agile/1.0/sprint/${encodeURIComponent(sprintId)}/issue`,
      normalizedSiteUrl,
    );
    url.searchParams.set("startAt", String(startAt));
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("fields", "summary,issuetype,status,assignee");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!response.ok) {
      throw new JiraApiError(
        await getJiraStatusMessage(response),
        response.status,
      );
    }

    const data = (await response.json()) as JiraSprintIssuesResponse;
    const pageIssues = Array.isArray(data.issues) ? data.issues : [];

    pageIssues.forEach((issue) => {
      const candidate = toImportCandidate(issue, normalizedSiteUrl);

      if (candidate) {
        issues.push(candidate);
      }
    });

    total = typeof data.total === "number" ? data.total : issues.length;
    const returnedCount = pageIssues.length;

    if (returnedCount === 0) {
      break;
    }

    startAt +=
      typeof data.maxResults === "number" ? data.maxResults : maxResults;
  }

  return issues;
};

const fetchJiraSearchSprintIssues = async ({
  authHeader,
  normalizedSiteUrl,
  sprintId,
}: JiraFetchContext): Promise<JiraImportCandidate[]> => {
  const issues: JiraImportCandidate[] = [];
  let startAt = 0;
  let total = Number.POSITIVE_INFINITY;
  const maxResults = 50;
  const jql = `Sprint = ${formatSprintJqlValue(sprintId)}`;

  while (startAt < total) {
    const url = new URL("/rest/api/2/search", normalizedSiteUrl);
    url.searchParams.set("jql", jql);
    url.searchParams.set("startAt", String(startAt));
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("fields", "summary,issuetype,status,assignee");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!response.ok) {
      throw new JiraApiError(
        await getJiraStatusMessage(response),
        response.status,
      );
    }

    const data = (await response.json()) as JiraSprintIssuesResponse;
    const pageIssues = Array.isArray(data.issues) ? data.issues : [];

    pageIssues.forEach((issue) => {
      const candidate = toImportCandidate(issue, normalizedSiteUrl);

      if (candidate) {
        issues.push(candidate);
      }
    });

    total = typeof data.total === "number" ? data.total : issues.length;
    const returnedCount = pageIssues.length;

    if (returnedCount === 0) {
      break;
    }

    startAt +=
      typeof data.maxResults === "number" ? data.maxResults : maxResults;
  }

  return issues;
};

export const fetchJiraSprintIssues = async ({
  apiToken,
  email,
  siteUrl,
  sprintId,
}: FetchJiraSprintIssuesParams): Promise<JiraImportCandidate[]> => {
  const normalizedSiteUrl = normalizeJiraSiteUrl(siteUrl);
  const trimmedEmail = email.trim();
  const trimmedToken = apiToken.trim();
  const trimmedSprintId = sprintId.trim();

  if (!trimmedEmail || !trimmedToken || !trimmedSprintId) {
    throw new JiraApiError(
      "Jira site, email, API token, and sprint ID are required",
    );
  }

  const authHeader = Buffer.from(`${trimmedEmail}:${trimmedToken}`).toString(
    "base64",
  );
  const jiraContext = {
    authHeader,
    normalizedSiteUrl,
    sprintId: trimmedSprintId,
  };

  if (!/^\d+$/.test(trimmedSprintId)) {
    return fetchJiraSearchSprintIssues(jiraContext);
  }

  try {
    return await fetchJiraAgileSprintIssues(jiraContext);
  } catch (error) {
    if (
      error instanceof JiraApiError &&
      (error.statusCode === 400 || error.statusCode === 404)
    ) {
      return fetchJiraSearchSprintIssues(jiraContext);
    }

    throw error;
  }
};

// Field names checked when discovering the story points field, in priority
// order. "Story Points" is the classic field; "Story point estimate" is used
// by Jira Cloud team-managed projects.
const STORY_POINTS_FIELD_NAMES = ["story points", "story point estimate"];

const discoverStoryPointsFieldIds = async (
  authHeader: string,
  normalizedSiteUrl: string,
): Promise<string[]> => {
  const configuredFieldId = process.env.JIRA_STORY_POINTS_FIELD?.trim();

  if (configuredFieldId) {
    return [configuredFieldId];
  }

  const url = new URL("/rest/api/2/field", normalizedSiteUrl);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${authHeader}`,
    },
  });

  if (!response.ok) {
    throw new JiraApiError(
      await getJiraStatusMessage(response, "Jira fields could not be loaded"),
      response.status,
    );
  }

  const fields = (await response.json()) as JiraFieldResponse[];
  const candidateIds = (Array.isArray(fields) ? fields : [])
    .filter(
      (field) =>
        field.id &&
        field.name &&
        STORY_POINTS_FIELD_NAMES.includes(field.name.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        STORY_POINTS_FIELD_NAMES.indexOf((a.name as string).trim().toLowerCase()) -
        STORY_POINTS_FIELD_NAMES.indexOf((b.name as string).trim().toLowerCase()),
    )
    .map((field) => field.id as string);

  if (candidateIds.length === 0) {
    throw new JiraApiError(
      "No Story Points field was found on this Jira site",
      400,
    );
  }

  return candidateIds;
};

const updateJiraIssueStoryPoints = async (
  authHeader: string,
  normalizedSiteUrl: string,
  issueKey: string,
  fieldId: string,
  storyPoints: number,
): Promise<void> => {
  const url = new URL(
    `/rest/api/2/issue/${encodeURIComponent(issueKey)}`,
    normalizedSiteUrl,
  );

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify({
      fields: {
        [fieldId]: storyPoints,
      },
    }),
  });

  if (!response.ok) {
    throw new JiraApiError(
      await getJiraStatusMessage(
        response,
        `Jira issue ${issueKey} was not found`,
      ),
      response.status,
    );
  }
};

export const pushJiraStoryPoints = async ({
  apiToken,
  email,
  siteUrl,
  updates,
}: PushJiraStoryPointsParams): Promise<JiraStoryPointsPushResult> => {
  const normalizedSiteUrl = normalizeJiraSiteUrl(siteUrl);
  const trimmedEmail = email.trim();
  const trimmedToken = apiToken.trim();

  if (!trimmedEmail || !trimmedToken) {
    throw new JiraApiError("Jira site, email, and API token are required");
  }

  if (updates.length === 0) {
    return { updated: [], failed: [] };
  }

  const authHeader = Buffer.from(`${trimmedEmail}:${trimmedToken}`).toString(
    "base64",
  );
  const fieldIds = await discoverStoryPointsFieldIds(
    authHeader,
    normalizedSiteUrl,
  );

  const updated: JiraStoryPointsPushResult["updated"] = [];
  const failed: JiraStoryPointsPushResult["failed"] = [];
  // Remember the field that worked so subsequent issues try it first.
  let preferredFieldId = fieldIds[0];

  for (const update of updates) {
    const orderedFieldIds = [
      preferredFieldId,
      ...fieldIds.filter((fieldId) => fieldId !== preferredFieldId),
    ];
    let lastErrorMessage = "Failed to update Jira issue";
    let didUpdate = false;

    for (const fieldId of orderedFieldIds) {
      try {
        await updateJiraIssueStoryPoints(
          authHeader,
          normalizedSiteUrl,
          update.issueKey,
          fieldId,
          update.storyPoints,
        );
        preferredFieldId = fieldId;
        didUpdate = true;
        break;
      } catch (error) {
        if (!(error instanceof JiraApiError)) {
          throw error;
        }

        // Bad credentials will fail for every issue; stop immediately.
        if (error.statusCode === 401) {
          throw error;
        }

        lastErrorMessage = error.message;
      }
    }

    if (didUpdate) {
      updated.push({ key: update.issueKey, storyPoints: update.storyPoints });
    } else {
      failed.push({ key: update.issueKey, error: lastErrorMessage });
    }
  }

  return { updated, failed };
};

// Made with Bob
