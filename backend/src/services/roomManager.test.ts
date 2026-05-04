import { GamePermission, GameStatus } from "../types/game.types";
import {
  addPlayerToRoom,
  calculateVotingResults,
  clearCurrentRound,
  getRoomState,
  haveAllPlayersVoted,
  setPlayerSpectatorMode,
  skipVotingRound,
  startVotingRound,
  submitVote,
} from "./roomManager";
import { getGameDetails } from "./gameService";
import { getGameIssues } from "./issueService";
import { findUserById } from "./userService";

jest.mock("./gameService", () => ({
  getGameDetails: jest.fn(),
}));

jest.mock("./issueService", () => ({
  getGameIssues: jest.fn(),
}));

jest.mock("./userService", () => ({
  findUserById: jest.fn(),
}));

const mockedGetGameDetails = jest.mocked(getGameDetails);
const mockedGetGameIssues = jest.mocked(getGameIssues);
const mockedFindUserById = jest.mocked(findUserById);

const buildGame = (gameId = "") => ({
  id: gameId,
  name: "Planning Game",
  creator_id: "u1",
  facilitator_id: "u1",
  deck_id: "deck-1",
  who_can_reveal: GamePermission.ALL_PLAYERS,
  who_can_manage_issues: GamePermission.ALL_PLAYERS,
  who_can_toggle_spectator: GamePermission.ALL_PLAYERS,
  auto_reveal: false,
  show_average: true,
  show_countdown: true,
  status: GameStatus.ACTIVE,
  created_at: new Date(),
  updated_at: new Date(),
  deck: {
    id: "deck-1",
    name: "Fibonacci",
    values: ["0", "1", "2", "3", "5"],
    is_default: true,
    created_by: null,
    created_at: new Date(),
  },
  creator_name: "User 1",
  facilitator_name: "User 1",
});

beforeEach(() => {
  mockedGetGameDetails.mockImplementation(async (gameId = "") =>
    buildGame(gameId),
  );
  mockedGetGameIssues.mockResolvedValue([]);
  mockedFindUserById.mockImplementation(async (userId = "") => ({
    id: userId,
    display_name: `User ${userId.slice(1)}`,
    spectator_mode: false,
    theme_preference: "dark",
    created_at: new Date(),
    updated_at: new Date(),
  }));
});

describe("roomManager voting eligibility", () => {
  it("marks players who join during an active round as observers until the next round", async () => {
    const gameId = "late-join-game";

    await addPlayerToRoom(gameId, "socket-u1", "u1");
    await addPlayerToRoom(gameId, "socket-u2", "u2");
    startVotingRound(gameId, "round-1", "issue-1");

    await addPlayerToRoom(gameId, "socket-u3", "u3");

    const activeState = await getRoomState(gameId);
    const latePlayer = activeState.players.find((player) => player.id === "u3");
    const lateVoteState = activeState.current_round?.votes.find(
      (vote) => vote.user_id === "u3",
    );

    expect(latePlayer?.is_round_observer).toBe(true);
    expect(latePlayer?.observer_reason).toBe("joined_mid_round");
    expect(lateVoteState?.can_vote).toBe(false);
    expect(() => submitVote(gameId, "u3", "3")).toThrow(
      "You joined after this round started",
    );

    clearCurrentRound(gameId);
    startVotingRound(gameId, "round-2", "issue-2");

    const nextState = await getRoomState(gameId);
    const nextLatePlayer = nextState.players.find(
      (player) => player.id === "u3",
    );
    const nextLateVoteState = nextState.current_round?.votes.find(
      (vote) => vote.user_id === "u3",
    );

    expect(nextLatePlayer?.is_round_observer).toBe(false);
    expect(nextLatePlayer?.observer_reason).toBeNull();
    expect(nextLateVoteState?.can_vote).toBe(true);
  });

  it("removes a spectator from active-round eligibility and results", async () => {
    const gameId = "spectator-toggle-game";

    await addPlayerToRoom(gameId, "socket-u1", "u1");
    await addPlayerToRoom(gameId, "socket-u2", "u2");
    startVotingRound(gameId, "round-1", "issue-1");

    submitVote(gameId, "u2", "5");
    setPlayerSpectatorMode(gameId, "u2", true);

    expect(haveAllPlayersVoted(gameId)).toBe(false);

    submitVote(gameId, "u1", "3");

    expect(haveAllPlayersVoted(gameId)).toBe(true);
    expect(calculateVotingResults(gameId).votes).toEqual([
      { user_id: "u1", card_value: "3", submitted_at: expect.any(String) },
    ]);

    setPlayerSpectatorMode(gameId, "u2", false);

    const activeState = await getRoomState(gameId);
    const voterAgain = activeState.current_round?.votes.find(
      (vote) => vote.user_id === "u2",
    );

    expect(voterAgain?.can_vote).toBe(false);
    expect(
      activeState.players.find((player) => player.id === "u2")?.is_spectator,
    ).toBe(false);

    clearCurrentRound(gameId);
    startVotingRound(gameId, "round-2", "issue-2");

    const nextState = await getRoomState(gameId);
    expect(
      nextState.current_round?.votes.find((vote) => vote.user_id === "u2")
        ?.can_vote,
    ).toBe(true);
  });

  it("skips the active issue round and clears submitted votes", async () => {
    const gameId = "skip-round-game";

    await addPlayerToRoom(gameId, "socket-u1", "u1");
    await addPlayerToRoom(gameId, "socket-u2", "u2");
    startVotingRound(gameId, "round-1", "issue-1");

    submitVote(gameId, "u1", "5");

    const skippedRound = skipVotingRound(gameId, "round-1", "issue-1");
    const state = await getRoomState(gameId);

    expect(skippedRound).toEqual({
      round_id: "round-1",
      issue_id: "issue-1",
    });
    expect(state.current_round).toBeNull();
    expect(state.players.every((player) => !player.is_round_observer)).toBe(
      true,
    );
  });

  it("does not skip after every eligible player has voted", async () => {
    const gameId = "skip-complete-round-game";

    await addPlayerToRoom(gameId, "socket-u1", "u1");
    await addPlayerToRoom(gameId, "socket-u2", "u2");
    startVotingRound(gameId, "round-1", "issue-1");

    submitVote(gameId, "u1", "3");
    submitVote(gameId, "u2", "5");

    expect(() => skipVotingRound(gameId, "round-1", "issue-1")).toThrow(
      "Cannot skip after all eligible players have voted",
    );
  });
});

// Made with Bob
