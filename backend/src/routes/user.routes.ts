import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth.types";
import { authenticate } from "../middleware/auth";
import { updateUser, toUserSession } from "../services/userService";
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
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

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

      const updatedUser = await updateUser(authReq.userId, {
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

export default router;

// Made with Bob
