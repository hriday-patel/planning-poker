/**
 * WebSocket Event Types
 *
 * Defines all WebSocket events and their payloads for real-time
 * communication in Planning Poker games.
 */

/**
 * Client → Server Events
 */

export interface JoinGamePayload {
  game_id: string;
  user_id: string;
}

export interface LeaveGamePayload {
  game_id: string;
  user_id: string;
}

export interface SubmitVotePayload {
  game_id?: string;
  round_id: string;
  card_value: string;
}

export interface RevealCardsPayload {
  game_id?: string;
  round_id: string;
}

export interface StartNewRoundPayload {
  game_id: string;
  issue_id: string | null;
}

export interface UpdateGameSettingsPayload {
  game_id: string;
  settings: {
    name?: string;
    who_can_reveal?: string;
    who_can_manage_issues?: string;
    auto_reveal?: boolean;
    fun_features_enabled?: boolean;
    show_average?: boolean;
    show_countdown?: boolean;
  };
}

export interface StartTimerPayload {
  game_id: string;
  duration_seconds: number;
}

export interface PauseTimerPayload {
  game_id: string;
}

export interface StopTimerPayload {
  game_id: string;
}

export interface UpdateIssuePayload {
  game_id: string;
  issue: {
    id: string;
    title?: string;
    status?: string;
    final_estimate?: string | null;
    display_order?: number;
  };
}

export interface DeleteIssuePayload {
  game_id: string;
  issue_id: string;
}

export interface AddIssuePayload {
  game_id: string;
  issue_title: string;
}

export interface TransferFacilitatorPayload {
  game_id: string;
  new_facilitator_id: string;
}

/**
 * Server → Client Events
 */

export interface PlayerJoinedPayload {
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_facilitator: boolean;
    is_spectator: boolean;
  };
}

export interface PlayerLeftPayload {
  user_id: string;
}

export interface VoteSubmittedPayload {
  user_id: string;
  // Value is hidden until reveal
}

export interface CardsRevealedPayload {
  round_id: string;
  issue_id: string | null;
  votes: Array<{
    user_id: string;
    card_value: string;
    submitted_at?: string | null;
  }>;
  distribution: Record<string, number>;
  average: number | null;
  agreement: number; // 0-100 percentage
  total_voters: number;
  final_estimate: string | null;
  fastest_voter: VotingSpeedStat | null;
  slowest_voter: VotingSpeedStat | null;
}

export interface VotingSpeedStat {
  user_id: string;
  display_name: string;
  seconds: number;
}

export interface NewRoundStartedPayload {
  round_id: string;
  issue_id: string | null;
}

export interface GameSettingsUpdatedPayload {
  settings: {
    name?: string;
    who_can_reveal?: string;
    who_can_manage_issues?: string;
    auto_reveal?: boolean;
    fun_features_enabled?: boolean;
    show_average?: boolean;
    show_countdown?: boolean;
  };
}

export interface TimerTickPayload {
  remaining_seconds: number;
}

export interface TimerEndedPayload {
  // Empty payload, just notification
}

export interface IssueAddedPayload {
  issue: {
    id: string;
    game_id: string;
    title: string;
    status: string;
    final_estimate: string | null;
    created_by: string;
    created_at: string;
    display_order: number;
  };
}

export interface IssueUpdatedPayload {
  issue: {
    id: string;
    game_id: string;
    title: string;
    status: string;
    final_estimate: string | null;
    created_by: string;
    created_at: string;
    display_order: number;
  };
}

export interface IssueDeletedPayload {
  issue_id: string;
}

export interface PlayerUpdatedPayload {
  user_id: string;
  display_name?: string;
  avatar_url?: string | null;
}

export interface FacilitatorChangedPayload {
  new_facilitator_id: string;
}

export interface GameStatePayload {
  game: any; // Full game details
  players: Array<{
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_facilitator: boolean;
    is_spectator: boolean;
    is_online: boolean;
  }>;
  issues: any[]; // All issues
  current_round: {
    id: string;
    issue_id: string | null;
    votes: Array<{
      user_id: string;
      has_voted: boolean;
      card_value: string | null; // null until revealed
      can_vote: boolean;
    }>;
    is_revealed: boolean;
  } | null;
}

/**
 * WebSocket Event Names
 */
export enum ClientEvents {
  JOIN_GAME = "JOIN_GAME",
  LEAVE_GAME = "LEAVE_GAME",
  SUBMIT_VOTE = "SUBMIT_VOTE",
  REVEAL_CARDS = "REVEAL_CARDS",
  START_NEW_ROUND = "START_NEW_ROUND",
  UPDATE_GAME_SETTINGS = "UPDATE_GAME_SETTINGS",
  START_TIMER = "START_TIMER",
  PAUSE_TIMER = "PAUSE_TIMER",
  STOP_TIMER = "STOP_TIMER",
  UPDATE_ISSUE = "UPDATE_ISSUE",
  DELETE_ISSUE = "DELETE_ISSUE",
  ADD_ISSUE = "ADD_ISSUE",
  TRANSFER_FACILITATOR = "TRANSFER_FACILITATOR",
}

export enum ServerEvents {
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  VOTE_SUBMITTED = "VOTE_SUBMITTED",
  CARDS_REVEALED = "CARDS_REVEALED",
  NEW_ROUND_STARTED = "NEW_ROUND_STARTED",
  GAME_SETTINGS_UPDATED = "GAME_SETTINGS_UPDATED",
  TIMER_TICK = "TIMER_TICK",
  TIMER_ENDED = "TIMER_ENDED",
  ISSUE_ADDED = "ISSUE_ADDED",
  ISSUE_UPDATED = "ISSUE_UPDATED",
  ISSUE_DELETED = "ISSUE_DELETED",
  PLAYER_UPDATED = "PLAYER_UPDATED",
  FACILITATOR_CHANGED = "FACILITATOR_CHANGED",
  GAME_STATE = "GAME_STATE",
  ERROR = "ERROR",
}

/**
 * Socket with user info attached
 */
export interface AuthenticatedSocket {
  id: string;
  userId: string;
  displayName: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  to: (room: string) => {
    emit: (event: string, data: any) => void;
  };
  broadcast: {
    to: (room: string) => {
      emit: (event: string, data: any) => void;
    };
  };
}

/**
 * Room state stored in memory
 */
export interface RoomState {
  game_id: string;
  players: Map<
    string,
    {
      socket_id: string;
      user_id: string;
      display_name: string;
      avatar_url: string | null;
      is_facilitator: boolean;
      is_spectator: boolean;
      joined_at: Date;
    }
  >;
  current_round: {
    id: string;
    issue_id: string | null;
    votes: Map<string, string>; // user_id -> card_value
    vote_times: Map<string, Date>;
    eligible_voter_ids: Set<string>;
    is_revealed: boolean;
    started_at: Date;
  } | null;
  timer: {
    duration_seconds: number;
    remaining_seconds: number;
    interval_id: NodeJS.Timeout | null;
    is_running: boolean;
  } | null;
}

// Made with Bob
