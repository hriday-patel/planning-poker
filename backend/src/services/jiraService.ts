import { JiraImportCandidate } from "../types/game.types";

const DEFAULT_ALLOWED_JIRA_HOSTS = ["*.atlassian.net", "*.ibm.com"];

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

const normalizeJiraSiteUrl = (siteUrl: string): string => {
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
  return {
    key: issue.key,
    title: summary,
    url: `${normalizedSiteUrl}/browse/${encodeURIComponent(issue.key)}`,
    issueType: issue.fields?.issuetype?.name || null,
    status: issue.fields?.status?.name || null,
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

const getJiraStatusMessage = async (response: Response): Promise<string> => {
  if (response.status === 401 || response.status === 403) {
    return "Jira rejected the email or API token";
  }

  if (response.status === 404) {
    return "Jira sprint was not found for this site";
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
    url.searchParams.set("fields", "summary,issuetype,status");

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
    url.searchParams.set("fields", "summary,issuetype,status");

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

// Made with Bob
