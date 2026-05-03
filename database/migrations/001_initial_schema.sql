-- Sprint Planning Poker Database Schema
-- Migration 001: Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- W3ID user identifier
    display_name VARCHAR(40) NOT NULL,
    avatar_url TEXT,
    spectator_mode BOOLEAN DEFAULT FALSE,
    theme_preference VARCHAR(10) DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on users for faster lookups
CREATE INDEX idx_users_created_at ON users(created_at);

-- Decks table (voting systems)
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    values TEXT[] NOT NULL, -- Array of card values
    is_default BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on decks
CREATE INDEX idx_decks_created_by ON decks(created_by);
CREATE INDEX idx_decks_is_default ON decks(is_default);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(60) NOT NULL,
    creator_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facilitator_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE RESTRICT,
    who_can_reveal VARCHAR(20) DEFAULT 'all_players' CHECK (who_can_reveal IN ('all_players', 'facilitator_only')),
    who_can_manage_issues VARCHAR(20) DEFAULT 'all_players' CHECK (who_can_manage_issues IN ('all_players', 'facilitator_only')),
    who_can_toggle_spectator VARCHAR(20) DEFAULT 'all_players' CHECK (who_can_toggle_spectator IN ('all_players', 'facilitator_only')),
    auto_reveal BOOLEAN DEFAULT FALSE,
    show_average BOOLEAN DEFAULT TRUE,
    show_countdown BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on games
CREATE INDEX idx_games_creator_id ON games(creator_id);
CREATE INDEX idx_games_facilitator_id ON games(facilitator_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at);

-- Game participants table (tracks who joined which game)
CREATE TABLE game_participants (
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE, -- Online status
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id, user_id)
);

-- Create indexes on game_participants
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_game_participants_is_active ON game_participants(game_id, is_active);

-- Issues table
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'voted')),
    final_estimate VARCHAR(10), -- Can be numeric or special values like '?', '☕'
    created_by VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on issues
CREATE INDEX idx_issues_game_id ON issues(game_id);
CREATE INDEX idx_issues_status ON issues(game_id, status);
CREATE INDEX idx_issues_display_order ON issues(game_id, display_order);

-- Voting rounds table
CREATE TABLE voting_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revealed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes on voting_rounds
CREATE INDEX idx_voting_rounds_game_id ON voting_rounds(game_id);
CREATE INDEX idx_voting_rounds_issue_id ON voting_rounds(issue_id);
CREATE INDEX idx_voting_rounds_is_active ON voting_rounds(game_id, is_active);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES voting_rounds(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_value VARCHAR(10) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, user_id) -- One vote per user per round
);

-- Create indexes on votes
CREATE INDEX idx_votes_round_id ON votes(round_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- Timer state table (for synchronized timer across clients)
CREATE TABLE timer_state (
    game_id UUID PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    remaining_seconds INTEGER NOT NULL CHECK (remaining_seconds >= 0 AND remaining_seconds <= duration_seconds),
    is_running BOOLEAN DEFAULT FALSE,
    time_issues BOOLEAN DEFAULT FALSE, -- Auto-reset after each round
    started_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default decks
INSERT INTO decks (name, values, is_default, created_by) VALUES
    ('Fibonacci', ARRAY['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'], TRUE, NULL),
    ('Modified Fibonacci', ARRAY['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕'], TRUE, NULL),
    ('T-shirts', ARRAY['XS', 'S', 'M', 'L', 'XL', '?', '☕'], TRUE, NULL),
    ('Powers of 2', ARRAY['0', '1', '2', '4', '8', '16', '32', '64', '?', '☕'], TRUE, NULL),
    ('Normal (0-10)', ARRAY['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], TRUE, NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timer_state_updated_at BEFORE UPDATE ON timer_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user profiles authenticated via IBM W3ID';
COMMENT ON TABLE decks IS 'Voting card decks (Fibonacci, T-shirts, etc.)';
COMMENT ON TABLE games IS 'Planning poker game sessions';
COMMENT ON TABLE game_participants IS 'Tracks which users have joined which games';
COMMENT ON TABLE issues IS 'User stories/tasks to be estimated';
COMMENT ON TABLE voting_rounds IS 'Individual voting rounds within a game';
COMMENT ON TABLE votes IS 'Individual votes cast by users in a round';
COMMENT ON TABLE timer_state IS 'Real-time synchronized timer state per game';

-- Grant privileges to the application role used by the backend
GRANT USAGE ON SCHEMA public TO planning_poker;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO planning_poker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO planning_poker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO planning_poker;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO planning_poker;

-- Made with Bob
