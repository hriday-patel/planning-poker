/**
 * Frontend Game Types
 *
 * Type definitions for game-related data structures on the frontend
 */

export interface Deck {
  id: string;
  name: string;
  values: string[];
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

export enum GamePermission {
  ALL_PLAYERS = "all_players",
  FACILITATOR_ONLY = "facilitator_only",
}

export enum GameStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export interface Game {
  id: string;
  name: string;
  creator_id: string;
  facilitator_id: string;
  deck_id: string;
  who_can_reveal: GamePermission;
  who_can_manage_issues: GamePermission;
  auto_reveal: boolean;
  fun_features_enabled: boolean;
  show_average: boolean;
  show_countdown: boolean;
  status: GameStatus;
  created_at: string;
  updated_at: string;
  deck: Deck;
  creator_name: string;
  facilitator_name: string;
}

export interface Player {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_facilitator: boolean;
  is_spectator: boolean;
  has_voted: boolean;
  card_value: string | null; // null until revealed
  is_online: boolean;
}

export interface Issue {
  id: string;
  game_id: string;
  title: string;
  status: "pending" | "voting" | "voted";
  final_estimate: string | null;
  created_by: string;
  created_at: string;
  display_order: number;
}

export interface VotingResults {
  votes: { [key: string]: number }; // card_value -> count
  average: number | null;
  agreement: number; // 0-100 percentage
  total_voters: number;
}

export enum VotingPhase {
  WAITING = "waiting", // No active voting
  VOTING = "voting", // Players are voting
  REVEALED = "revealed", // Cards revealed
}

export interface GameState {
  game: Game | null;
  players: Player[];
  currentUser: Player | null;
  issues: Issue[];
  currentIssue: Issue | null;
  votingPhase: VotingPhase;
  votingResults: VotingResults | null;
  selectedCard: string | null;
  isLoading: boolean;
  error: string | null;
}

// Made with Bob
