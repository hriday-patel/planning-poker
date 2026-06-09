import crypto from "crypto";

/**
 * AES-256-GCM helpers for encrypting small secrets (e.g. saved Jira API
 * tokens) at rest. The key is derived from JIRA_TOKEN_ENCRYPTION_KEY when
 * provided, otherwise from JWT_SECRET.
 */

const IV_LENGTH = 12;

const getEncryptionKey = (): Buffer => {
  const secret =
    process.env.JIRA_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JIRA_TOKEN_ENCRYPTION_KEY or JWT_SECRET must be set to encrypt secrets",
    );
  }

  return crypto.createHash("sha256").update(secret).digest();
};

export const encryptSecret = (plaintext: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
};

export const decryptSecret = (payload: string): string => {
  const [ivPart, authTagPart, dataPart] = payload.split(".");

  if (!ivPart || !authTagPart || !dataPart) {
    throw new Error("Invalid encrypted payload format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagPart, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64")),
    decipher.final(),
  ]).toString("utf8");
};
