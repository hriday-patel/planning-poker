import { Request } from "express";

// W3ID OAuth User Profile
export interface W3IDProfile {
  id: string;
  displayName: string;
  email?: string;
  bluePagesDisplayName?: string;
  provider: string;
  _raw?: string;
  _json?: any;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  displayName: string;
  iat?: number;
  exp?: number;
}

// JWT Tokens
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// User Session Data
export interface UserSession {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  spectatorMode: boolean;
  themePreference: string;
  createdAt: Date;
}

// Authenticated Request
export interface AuthenticatedRequest extends Request {
  user?: UserSession;
  userId?: string;
}

// OAuth State
export interface OAuthState {
  state: string;
  returnTo?: string;
  createdAt: number;
}

// User Database Record
export interface UserRecord {
  id: string;
  display_name: string;
  avatar_url?: string;
  spectator_mode: boolean;
  theme_preference: string;
  created_at: Date;
  updated_at: Date;
}

// User Update Payload
export interface UserUpdatePayload {
  spectator_mode?: boolean;
  theme_preference?: string;
}

// Auth Service Response
export interface AuthServiceResponse {
  success: boolean;
  user?: UserSession;
  tokens?: TokenPair;
  error?: string;
}

// Blue Pages lookup response
export interface BluePagesProfile {
  displayName: string;
  email?: string;
  uid?: string;
}

// Invite token payload
export interface InviteTokenPayload {
  tokenId: string;
  gameId: string;
  invitedBy: string;
  expiresAt: string;
}

// Invite token record stored in Redis
export interface InviteTokenRecord extends InviteTokenPayload {
  createdAt: string;
  usedBy?: string;
  usedAt?: string;
}

// Invite response payload
export interface InviteLinkResponse {
  inviteUrl: string;
  expiresAt: string;
  tokenId: string;
}

// Made with Bob
