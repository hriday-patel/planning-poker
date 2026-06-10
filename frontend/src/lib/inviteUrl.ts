const DEFAULT_APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const getAppOrigin = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return DEFAULT_APP_ORIGIN;
};

export const buildInviteUrl = (gameId: string, inviteToken: string): string => {
  const params = new URLSearchParams({ invite: inviteToken });
  return `${getAppOrigin()}/game/${gameId}?${params.toString()}`;
};

export const extractInviteToken = (inviteUrl: string): string | null => {
  try {
    return new URL(inviteUrl).searchParams.get("invite");
  } catch {
    return null;
  }
};

export const resolveInviteUrl = (
  gameId: string,
  backendInviteUrl: string,
): string => {
  const inviteToken = extractInviteToken(backendInviteUrl);
  if (!inviteToken) {
    return backendInviteUrl;
  }

  return buildInviteUrl(gameId, inviteToken);
};
