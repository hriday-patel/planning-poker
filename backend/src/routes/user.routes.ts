import { Router, Request, Response } from "express";
import {
  AuthenticatedRequest,
  JiraSettingsUpdatePayload,
} from "../types/auth.types";
import { authenticate } from "../middleware/auth";
import {
  updateUser,
  toUserSession,
  getUserJiraSettings,
  updateUserJiraSettings,
} from "../services/userService";
import { JiraApiError, normalizeJiraSiteUrl } from "../services/jiraService";
import { logger } from "../utils/logger";

const router = Router();

/**
 * PATCH /api/v1/users/me
 * Update current user's allowed profile preferences
 */
router.patch(
  "/me",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      const { display_name, avatar_url, spectator_mode, theme_preference } =
        req.body;

      if (display_name !== undefined) {
        res.status(400).json({
          success: false,
          error:
            "Display name is managed by IBM Blue Pages and cannot be changed",
        });
        return;
      }

      if (avatar_url !== undefined) {
        res.status(400).json({
          success: false,
          error: "Profile photo uploads are disabled for this application",
        });
        return;
      }

      if (theme_preference && !["dark", "light"].includes(theme_preference)) {
        res.status(400).json({
          success: false,
          error: "Theme preference must be 'dark' or 'light'",
        });
        return;
      }

      const updatedUser = await updateUser(authReq.userId!, {
        spectator_mode,
        theme_preference,
      });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        user: toUserSession(updatedUser),
      });
      return;
    } catch (error) {
      logger.error("Error updating user profile:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
      });
      return;
    }
  },
);

/**
 * GET /api/v1/users/me/jira-settings
 * Get current user's Jira integration settings (token is never returned)
 */
router.get(
  "/me/jira-settings",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      const settings = await getUserJiraSettings(authReq.userId!);

      if (!settings) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        settings,
      });
      return;
    } catch (error) {
      logger.error("Error fetching Jira settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch JIRA settings",
      });
      return;
    }
  },
);

/**
 * PUT /api/v1/users/me/jira-settings
 * Update current user's Jira site URL and/or API token
 */
router.put(
  "/me/jira-settings",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      const { siteUrl, apiToken } = req.body ?? {};
      const updates: JiraSettingsUpdatePayload = {};

      if (siteUrl !== undefined) {
        if (typeof siteUrl !== "string" || !siteUrl.trim()) {
          res.status(400).json({
            success: false,
            error: "Jira site URL is required",
          });
          return;
        }

        try {
          normalizeJiraSiteUrl(siteUrl);
        } catch (validationError) {
          res.status(400).json({
            success: false,
            error:
              validationError instanceof JiraApiError
                ? validationError.message
                : "Enter a valid Jira site URL",
          });
          return;
        }

        updates.siteUrl = siteUrl.trim();
      }

      if (apiToken !== undefined) {
        if (typeof apiToken !== "string" || !apiToken.trim()) {
          res.status(400).json({
            success: false,
            error: "JIRA API token cannot be empty",
          });
          return;
        }

        updates.apiToken = apiToken.trim();
      }

      if (updates.siteUrl === undefined && updates.apiToken === undefined) {
        res.status(400).json({
          success: false,
          error: "Provide a Jira site URL or API token to update",
        });
        return;
      }

      const settings = await updateUserJiraSettings(authReq.userId!, updates);

      if (!settings) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        settings,
      });
      return;
    } catch (error) {
      logger.error("Error updating Jira settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update JIRA settings",
      });
      return;
    }
  },
);

export default router;

// Made with Bob
