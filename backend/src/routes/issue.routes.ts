/**
 * Issue Routes
 *
 * API endpoints for managing issues (user stories/tickets) in games
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { AuthenticatedRequest } from "../types/auth.types";
import { ImportIssueInput } from "../types/game.types";
import { ServerEvents } from "../types/websocket.types";
import { authenticate } from "../middleware/auth";
import { uploadRateLimiter } from "../middleware/rateLimiter";
import {
  getGameIssues,
  createIssue,
  updateIssue,
  deleteIssue,
  importIssues,
  importIssueRecords,
  getExistingExternalIssueKeys,
  setVotingIssue,
} from "../services/issueService";
import { hasGamePermission } from "../services/gameService";
import { fetchJiraSprintIssues, JiraApiError } from "../services/jiraService";
import { logger } from "../utils/logger";

const router = Router();
const JIRA_SOURCE = "jira";

const getJiraRequestFields = (body: any) => {
  const siteUrl = typeof body.siteUrl === "string" ? body.siteUrl.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const apiToken =
    typeof body.apiToken === "string" ? body.apiToken.trim() : "";
  const sprintId =
    typeof body.sprintId === "string" ? body.sprintId.trim() : "";

  return { siteUrl, email, apiToken, sprintId };
};

const handleIssueImportError = (res: Response, error: any): void => {
  if (
    error.message === "You don't have permission to manage issues in this game"
  ) {
    res.status(403).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.message === "No valid issue titles provided") {
    res.status(400).json({
      success: false,
      error: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: "Failed to import issues",
  });
};

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024, // 1MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

/**
 * GET /api/v1/games/:gameId/issues
 * Get all issues for a game
 */
router.get(
  "/:gameId/issues",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { gameId } = req.params;

      const issues = await getGameIssues(gameId);

      res.json({
        success: true,
        issues,
      });
      return;
    } catch (error) {
      logger.error("Error fetching issues:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch issues",
      });
      return;
    }
  },
);

/**
 * POST /api/v1/games/:gameId/issues
 * Create a new issue
 */
router.post(
  "/:gameId/issues",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { gameId } = req.params;
      const { title } = req.body;

      if (!title) {
        res.status(400).json({
          success: false,
          error: "Issue title is required",
        });
        return;
      }

      const issue = await createIssue(gameId, authReq.userId, { title });

      res.status(201).json({
        success: true,
        issue,
      });
      return;
    } catch (error: any) {
      logger.error("Error creating issue:", error);

      if (
        error.message ===
        "You don't have permission to manage issues in this game"
      ) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message && error.message.includes("must be between")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to create issue",
      });
      return;
    }
  },
);

/**
 * PATCH /api/v1/games/:gameId/issues/:issueId
 * Update an issue
 */
router.patch(
  "/:gameId/issues/:issueId",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { gameId, issueId } = req.params;
      const { title, status, final_estimate, display_order } = req.body;

      const updatedIssue = await updateIssue(issueId, gameId, authReq.userId, {
        title,
        status,
        final_estimate,
        display_order,
      });

      if (!updatedIssue) {
        res.status(404).json({
          success: false,
          error: "Issue not found",
        });
        return;
      }

      res.json({
        success: true,
        issue: updatedIssue,
      });
      return;
    } catch (error: any) {
      logger.error("Error updating issue:", error);

      if (
        error.message === "Issue not found" ||
        error.message === "Issue does not belong to this game"
      ) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (
        error.message ===
        "You don't have permission to manage issues in this game"
      ) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message && error.message.includes("must be between")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to update issue",
      });
      return;
    }
  },
);

/**
 * DELETE /api/v1/games/:gameId/issues/:issueId
 * Delete an issue
 */
router.delete(
  "/:gameId/issues/:issueId",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { gameId, issueId } = req.params;

      const deleted = await deleteIssue(issueId, gameId, authReq.userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Issue not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Issue deleted successfully",
      });
      return;
    } catch (error: any) {
      logger.error("Error deleting issue:", error);

      if (
        error.message === "Issue not found" ||
        error.message === "Issue does not belong to this game"
      ) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (
        error.message ===
        "You don't have permission to manage issues in this game"
      ) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete issue",
      });
      return;
    }
  },
);

/**
 * POST /api/v1/games/:gameId/issues/import/jira/preview
 * Preview Jira sprint issues before importing
 */
router.post(
  "/:gameId/issues/import/jira/preview",
  authenticate as any,
  uploadRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { gameId } = req.params;
      const { siteUrl, email, apiToken, sprintId } = getJiraRequestFields(
        req.body,
      );

      if (!siteUrl || !email || !apiToken || !sprintId) {
        res.status(400).json({
          success: false,
          error: "Jira site, email, API token, and sprint ID are required",
        });
        return;
      }

      const hasPermission = await hasGamePermission(
        gameId,
        authReq.userId,
        "manage_issues",
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: "You don't have permission to manage issues in this game",
        });
        return;
      }

      const jiraIssues = await fetchJiraSprintIssues({
        siteUrl,
        email,
        apiToken,
        sprintId,
      });
      const existingKeys = await getExistingExternalIssueKeys(
        gameId,
        JIRA_SOURCE,
        jiraIssues.map((issue) => issue.key),
      );
      const candidates = jiraIssues.map((issue) => ({
        ...issue,
        isDuplicate: existingKeys.has(issue.key),
      }));

      res.json({
        success: true,
        candidates,
        count: candidates.length,
        duplicateCount: candidates.filter((issue) => issue.isDuplicate).length,
      });
      return;
    } catch (error: any) {
      logger.error("Error previewing Jira issues:", {
        message: error?.message,
        statusCode: error?.statusCode,
      });

      if (error instanceof JiraApiError) {
        res.status(error.statusCode >= 500 ? 502 : error.statusCode).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to preview Jira issues",
      });
      return;
    }
  },
);

/**
 * POST /api/v1/games/:gameId/issues/import/jira/confirm
 * Import selected Jira sprint issues after preview
 */
router.post(
  "/:gameId/issues/import/jira/confirm",
  authenticate as any,
  uploadRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { gameId } = req.params;
      const duplicateAction =
        req.body?.duplicateAction === "include" ? "include" : "skip";
      const candidateIssues: any[] = Array.isArray(req.body?.issues)
        ? req.body.issues
        : [];

      const sanitizedIssues = candidateIssues.reduce<ImportIssueInput[]>(
        (issues, issue: any) => {
          const title =
            typeof issue.title === "string" ? issue.title.trim() : "";
          const externalKey =
            typeof issue.key === "string" ? issue.key.trim() : "";

          if (!title || !externalKey) {
            return issues;
          }

          issues.push({
            title,
            source: JIRA_SOURCE,
            external_key: externalKey,
            external_url:
              typeof issue.url === "string" ? issue.url.trim() || null : null,
          });

          return issues;
        },
        [],
      );

      if (sanitizedIssues.length === 0) {
        res.status(400).json({
          success: false,
          error: "Choose at least one Jira issue to import",
        });
        return;
      }

      let issuesToImport = sanitizedIssues;
      let skippedDuplicates = 0;

      if (duplicateAction === "skip") {
        const existingKeys = await getExistingExternalIssueKeys(
          gameId,
          JIRA_SOURCE,
          sanitizedIssues.map((issue) => issue.external_key || ""),
        );
        issuesToImport = sanitizedIssues.filter(
          (issue) => !existingKeys.has(issue.external_key || ""),
        );
        skippedDuplicates = sanitizedIssues.length - issuesToImport.length;
      }

      if (issuesToImport.length === 0) {
        res.status(200).json({
          success: true,
          issues: [],
          count: 0,
          skippedDuplicates,
        });
        return;
      }

      const importedIssues = await importIssueRecords(
        gameId,
        authReq.userId,
        issuesToImport,
      );

      const socketServer = req.app.get("io");
      if (socketServer) {
        importedIssues.forEach((issue) => {
          socketServer.to(gameId).emit(ServerEvents.ISSUE_ADDED, { issue });
        });
      }

      res.status(201).json({
        success: true,
        issues: importedIssues,
        count: importedIssues.length,
        skippedDuplicates,
      });
      return;
    } catch (error: any) {
      logger.error("Error importing Jira issues:", error);
      handleIssueImportError(res, error);
      return;
    }
  },
);

/**
 * POST /api/v1/games/:gameId/issues/import
 * Import issues from various sources
 */
router.post(
  "/:gameId/issues/import",
  authenticate as any,
  uploadRateLimiter,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { gameId } = req.params;
      const { source, urls, titles } = req.body;

      let issueTitles: string[] = [];

      if (source === "csv" && req.file) {
        try {
          const csvContent = req.file.buffer.toString("utf-8");
          const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });

          issueTitles = records.map((record: any) => {
            return record.title || record.Title || Object.values(record)[0];
          });
        } catch (_csvError) {
          res.status(400).json({
            success: false,
            error: "Invalid CSV format",
          });
          return;
        }
      } else if (source === "urls" && urls) {
        const urlList = Array.isArray(urls) ? urls : urls.split("\n");
        issueTitles = urlList
          .map((url: string) => url.trim())
          .filter((url: string) => url.length > 0)
          .map((url: string) => {
            const match = url.match(/\/([^\/]+)$/);
            return match ? match[1] : url;
          });
      } else if (source === "manual" && titles) {
        issueTitles = Array.isArray(titles) ? titles : titles.split("\n");
        issueTitles = issueTitles
          .map((title: string) => title.trim())
          .filter((title: string) => title.length > 0);
      } else {
        res.status(400).json({
          success: false,
          error: "Invalid import source or missing data",
        });
        return;
      }

      if (issueTitles.length === 0) {
        res.status(400).json({
          success: false,
          error: "No valid issues to import",
        });
        return;
      }

      const importedIssues = await importIssues(
        gameId,
        authReq.userId,
        issueTitles,
        source,
      );

      const socketServer = req.app.get("io");
      if (socketServer) {
        importedIssues.forEach((issue) => {
          socketServer.to(gameId).emit(ServerEvents.ISSUE_ADDED, { issue });
        });
      }

      res.status(201).json({
        success: true,
        issues: importedIssues,
        count: importedIssues.length,
      });
      return;
    } catch (error: any) {
      logger.error("Error importing issues:", error);

      handleIssueImportError(res, error);
      return;
    }
  },
);

/**
 * POST /api/v1/games/:gameId/issues/:issueId/vote
 * Set an issue as the current voting issue
 */
router.post(
  "/:gameId/issues/:issueId/vote",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      const { gameId, issueId } = req.params;

      const issue = await setVotingIssue(gameId, issueId, authReq.userId);

      res.json({
        success: true,
        issue,
      });
      return;
    } catch (error: any) {
      logger.error("Error setting voting issue:", error);

      if (error.message === "Issue not found") {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (
        error.message ===
        "You don't have permission to manage issues in this game"
      ) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to set voting issue",
      });
      return;
    }
  },
);

export default router;

// Made with Bob
