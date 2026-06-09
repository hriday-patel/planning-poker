const ACTIVE_GAME_SESSION_KEY = "planitpoker:activeGameId";

export function setActiveGameSession(gameId: string): void {
  if (typeof window === "undefined" || !gameId) {
    return;
  }

  sessionStorage.setItem(ACTIVE_GAME_SESSION_KEY, gameId);
}

export function clearActiveGameSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(ACTIVE_GAME_SESSION_KEY);
}

export function getActiveGameSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(ACTIVE_GAME_SESSION_KEY);
}

export function getActiveGameSessionPath(): string | null {
  const gameId = getActiveGameSessionId();

  if (!gameId) {
    return null;
  }

  return `/game/${gameId}`;
}

export function getHomeOrActiveGamePath(): string {
  return getActiveGameSessionPath() ?? "/";
}
