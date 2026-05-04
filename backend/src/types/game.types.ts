/**
 * Game and Deck Type Definitions
 *
 * Defines all types related to games, decks, and game settings
 * for the Planning Poker application.
 */

/**
 * Voting system deck configuration
 */
export interface Deck {
  id: string;
  name: string;
  values: string[]; // Ordered array of card values
  is_default: boolean;
  created_by: string | null; // User ID, null for system decks
  created_at: Date;
}

/**
 * Deck creation payload
 */
export interface CreateDeckPayload {
  name: string;
  values: string[];
}

/**
 * Game permissions enum
 */
export enum GamePermission {
  ALL_PLAYERS = "all_players",
  FACILITATOR_ONLY = "facilitator_only",
}

/**
 * Game status enum
 */
export enum GameStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

/**
 * Game entity from database
 */
export interface GameRecord {
  id: string; // UUID
  name: string;
  creator_id: string;
  facilitator_id: string;
  deck_id: string; // Deck ID
  who_can_reveal: GamePermission;
  who_can_manage_issues: GamePermission;
  who_can_toggle_spectator: GamePermission;
  auto_reveal: boolean;
  show_average: boolean;
  show_countdown: boolean;
  status: GameStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Game creation payload
 */
export interface CreateGamePayload {
  name: string;
  deck_id?: string; // Deck ID or supported voting-system alias
  voting_system?: string;
  who_can_reveal?: GamePermission;
  who_can_manage_issues?: GamePermission;
  who_can_toggle_spectator?: GamePermission;
  auto_reveal?: boolean;
  show_average?: boolean;
  show_countdown?: boolean;
}

/**
 * Game update payload
 */
export interface UpdateGamePayload {
  name?: string;
  facilitator_id?: string;
  who_can_reveal?: GamePermission;
  who_can_manage_issues?: GamePermission;
  who_can_toggle_spectator?: GamePermission;
  auto_reveal?: boolean;
  show_average?: boolean;
  show_countdown?: boolean;
  status?: GameStatus;
}

/**
 * Game details response (includes deck info)
 */
export interface GameDetails extends GameRecord {
  deck: Deck;
  creator_name: string;
  facilitator_name: string;
}

/**
 * Game participant entity
 */
export interface GameParticipant {
  game_id: string;
  user_id: string;
  joined_at: Date;
  is_active: boolean; // Online status
  last_seen_at: Date;
}

/**
 * System deck definitions
 */
export const SYSTEM_DECKS: Omit<Deck, "id" | "created_at">[] = [
  {
    name: "Fibonacci",
    values: [
      "0",
      "1",
      "2",
      "3",
      "5",
      "8",
      "13",
      "21",
      "34",
      "55",
      "89",
      "?",
      "☕",
    ],
    is_default: true,
    created_by: null,
  },
  {
    name: "Modified Fibonacci",
    values: [
      "0",
      "½",
      "1",
      "2",
      "3",
      "5",
      "8",
      "13",
      "20",
      "40",
      "100",
      "?",
      "☕",
    ],
    is_default: true,
    created_by: null,
  },
  {
    name: "T-shirts",
    values: ["XS", "S", "M", "L", "XL", "?", "☕"],
    is_default: true,
    created_by: null,
  },
  {
    name: "Powers of 2",
    values: ["0", "1", "2", "4", "8", "16", "32", "64", "?", "☕"],
    is_default: true,
    created_by: null,
  },
  {
    name: "Normal (0-10)",
    values: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    is_default: true,
    created_by: null,
  },
];

/**
 * Issue status enum
 */
export enum IssueStatus {
  PENDING = "pending",
  VOTING = "voting",
  VOTED = "voted",
}

/**
 * Issue entity from database
 */
export interface IssueRecord {
  id: string; // UUID
  game_id: string;
  title: string;
  status: IssueStatus;
  final_estimate: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  display_order: number;
  source: string;
  external_key: string | null;
  external_url: string | null;
}

/**
 * Issue creation payload
 */
export interface CreateIssuePayload {
  title: string;
}

/**
 * Issue update payload
 */
export interface UpdateIssuePayload {
  title?: string;
  status?: IssueStatus;
  final_estimate?: string | null;
  display_order?: number;
}

/**
 * Issue import from CSV
 */
export interface ImportIssuesPayload {
  issues: string[]; // Array of issue titles
}

export interface ImportIssueInput {
  title: string;
  source?: string;
  external_key?: string | null;
  external_url?: string | null;
}

export interface JiraImportCandidate {
  key: string;
  title: string;
  url: string;
  issueType: string | null;
  status: string | null;
  isDuplicate?: boolean;
}

export interface VotingRoundRecord {
  id: string; // UUID
  game_id: string;
  issue_id: string | null;
  started_at: Date;
  revealed_at: Date | null;
  is_active: boolean;
}

export interface VoteRecord {
  id: string; // UUID
  round_id: string;
  user_id: string;
  card_value: string;
  submitted_at: Date;
}

export interface TimerStateRecord {
  game_id: string;
  duration_seconds: number;
  remaining_seconds: number;
  is_running: boolean;
  time_issues: boolean;
  started_at: Date | null;
  updated_at: Date;
}

/**
 * Validation constants
 */
export const GAME_VALIDATION = {
  NAME_MAX_LENGTH: 60,
  DECK_NAME_MAX_LENGTH: 50,
  DECK_VALUE_MAX_LENGTH: 3,
  DECK_VALUES_MAX_COUNT: 20,
  DECK_VALUES_MIN_COUNT: 2,
  ISSUE_TITLE_MAX_LENGTH: 500,
  ISSUE_TITLE_MIN_LENGTH: 1,
};

// Made with Bob
