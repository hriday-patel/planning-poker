import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import { W3IDProfile } from "../types/auth.types";
import { logger } from "../utils/logger";

/**
 * Configure Passport OAuth2 strategy for IBM W3ID
 */
export const configurePassport = (): void => {
  const w3idClientId = process.env.W3ID_CLIENT_ID || "";
  const w3idClientSecret = process.env.W3ID_CLIENT_SECRET || "";
  const w3idIssuer =
    process.env.W3ID_ISSUER ||
    "https://preprod.login.w3.ibm.com/oidc/endpoint/default";
  const w3idAuthorizationUrl =
    process.env.W3ID_AUTHORIZATION_URL || `${w3idIssuer}/authorize`;
  const w3idTokenUrl = process.env.W3ID_TOKEN_URL || `${w3idIssuer}/token`;
  const w3idUserinfoUrl =
    process.env.W3ID_USERINFO_URL || `${w3idIssuer}/userinfo`;
  const w3idCallbackUrl =
    process.env.W3ID_CALLBACK_URL ||
    "http://localhost:3001/api/v1/auth/w3id/callback";
  const w3idScope = process.env.W3ID_SCOPE || "openid profile email";

  passport.use(
    "w3id",
    new OAuth2Strategy(
      {
        authorizationURL: w3idAuthorizationUrl,
        tokenURL: w3idTokenUrl,
        clientID: w3idClientId,
        clientSecret: w3idClientSecret,
        callbackURL: w3idCallbackUrl,
        scope: w3idScope.split(" "),
        state: true, // Enable CSRF protection
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: any,
      ) => {
        try {
          // The profile will be populated by userProfile function below
          logger.info("W3ID OAuth callback successful");
          return done(null, profile);
        } catch (error) {
          logger.error("Error in W3ID OAuth callback:", error);
          return done(error as Error);
        }
      },
    ),
  );

  // Override userProfile to fetch user info from W3ID
  ((passport as any)._strategies["w3id"] as any).userProfile = async function (
    accessToken: string,
    done: (err: Error | null, profile?: W3IDProfile) => void,
  ) {
    try {
      const response = await fetch(w3idUserinfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      const json: any = await response.json();

      // Map W3ID response to our profile format
      const profile: W3IDProfile = {
        id: json.sub || json.uid || json.id,
        displayName:
          json.name ||
          json.preferred_username ||
          json.email?.split("@")[0] ||
          "User",
        email: json.email,
        bluePagesDisplayName: json.name,
        provider: "w3id",
        _raw: JSON.stringify(json),
        _json: json,
      };

      logger.info(`Fetched W3ID profile for user: ${profile.id}`);
      done(null, profile);
    } catch (error) {
      logger.error("Error fetching W3ID user profile:", error);
      done(error as Error);
    }
  };

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  logger.info("Passport W3ID OAuth2 strategy configured");
};

// Made with Bob
