-- Development Seed Data
-- This file contains sample data for development and testing purposes
-- DO NOT run this in production!

-- Insert test users (simulating W3ID authenticated users)
INSERT INTO users (id, display_name, avatar_url, spectator_mode, theme_preference) VALUES
    ('w3id_user_001', 'Alice Johnson', 'https://i.pravatar.cc/150?img=1', false, 'dark'),
    ('w3id_user_002', 'Bob Smith', 'https://i.pravatar.cc/150?img=2', false, 'dark'),
    ('w3id_user_003', 'Carol Williams', 'https://i.pravatar.cc/150?img=3', false, 'light'),
    ('w3id_user_004', 'David Brown', 'https://i.pravatar.cc/150?img=4', false, 'dark'),
    ('w3id_user_005', 'Eve Davis', 'https://i.pravatar.cc/150?img=5', true, 'dark'),
    ('w3id_user_006', 'Frank Miller', 'https://i.pravatar.cc/150?img=6', false, 'light');

-- Insert a custom deck
INSERT INTO decks (id, name, values, is_default, created_by) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'My Custom Deck', ARRAY['1', '2', '3', '5', '8', '13', '?', '☕'], false, 'w3id_user_001');

-- Insert test games
INSERT INTO games (id, name, creator_id, facilitator_id, deck_id, who_can_reveal, who_can_manage_issues, who_can_toggle_spectator, auto_reveal, show_average, show_countdown, status) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', 'Sprint 23 Planning', 'w3id_user_001', 'w3id_user_001', 
     (SELECT id FROM decks WHERE name = 'Fibonacci' LIMIT 1), 
    'all_players', 'all_players', 'all_players', false, true, true, 'active'),
    
    ('550e8400-e29b-41d4-a716-446655440011', 'Q2 Feature Estimation', 'w3id_user_002', 'w3id_user_002',
     (SELECT id FROM decks WHERE name = 'Modified Fibonacci' LIMIT 1),
    'facilitator_only', 'facilitator_only', 'facilitator_only', true, true, true, 'active'),
    
    ('550e8400-e29b-41d4-a716-446655440012', 'Bug Triage Session', 'w3id_user_003', 'w3id_user_003',
     (SELECT id FROM decks WHERE name = 'T-shirts' LIMIT 1),
    'all_players', 'all_players', 'all_players', false, true, false, 'active'),
    
    ('550e8400-e29b-41d4-a716-446655440013', 'Archived Game Example', 'w3id_user_001', 'w3id_user_001',
     (SELECT id FROM decks WHERE name = 'Fibonacci' LIMIT 1),
    'all_players', 'all_players', 'all_players', false, true, true, 'archived');

-- Insert game participants
INSERT INTO game_participants (game_id, user_id, is_active) VALUES
    -- Sprint 23 Planning participants
    ('550e8400-e29b-41d4-a716-446655440010', 'w3id_user_001', true),
    ('550e8400-e29b-41d4-a716-446655440010', 'w3id_user_002', true),
    ('550e8400-e29b-41d4-a716-446655440010', 'w3id_user_003', true),
    ('550e8400-e29b-41d4-a716-446655440010', 'w3id_user_004', false),
    ('550e8400-e29b-41d4-a716-446655440010', 'w3id_user_005', true),
    
    -- Q2 Feature Estimation participants
    ('550e8400-e29b-41d4-a716-446655440011', 'w3id_user_002', true),
    ('550e8400-e29b-41d4-a716-446655440011', 'w3id_user_003', true),
    ('550e8400-e29b-41d4-a716-446655440011', 'w3id_user_006', true),
    
    -- Bug Triage Session participants
    ('550e8400-e29b-41d4-a716-446655440012', 'w3id_user_003', true),
    ('550e8400-e29b-41d4-a716-446655440012', 'w3id_user_004', true);

-- Insert issues for Sprint 23 Planning
INSERT INTO issues (id, game_id, title, status, final_estimate, created_by, display_order) VALUES
    ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 
     'Implement user authentication with W3ID', 'voted', '8', 'w3id_user_001', 1),
    
    ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010',
     'Create game room UI with card selection', 'voted', '13', 'w3id_user_001', 2),
    
    ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440010',
     'Build WebSocket server for real-time voting', 'voting', NULL, 'w3id_user_001', 3),
    
    ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440010',
     'Implement timer feature', 'pending', NULL, 'w3id_user_002', 4),
    
    ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440010',
     'Add dark/light theme toggle', 'pending', NULL, 'w3id_user_002', 5);

-- Insert issues for Q2 Feature Estimation
INSERT INTO issues (id, game_id, title, status, final_estimate, created_by, display_order) VALUES
    ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440011',
     'Design new dashboard layout', 'voted', '20', 'w3id_user_002', 1),
    
    ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440011',
     'Implement analytics tracking', 'pending', NULL, 'w3id_user_002', 2);

-- Insert voting rounds (completed rounds)
INSERT INTO voting_rounds (id, game_id, issue_id, started_at, revealed_at, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440010',
     '550e8400-e29b-41d4-a716-446655440020', 
     CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 55 minutes', false),
    
    ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440010',
     '550e8400-e29b-41d4-a716-446655440021',
     CURRENT_TIMESTAMP - INTERVAL '1 hour 50 minutes', CURRENT_TIMESTAMP - INTERVAL '1 hour 45 minutes', false),
    
    ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440010',
     '550e8400-e29b-41d4-a716-446655440022',
     CURRENT_TIMESTAMP - INTERVAL '10 minutes', NULL, true);

-- Insert votes for completed rounds
INSERT INTO votes (round_id, user_id, card_value, submitted_at) VALUES
    -- Round 1 votes (Issue: Implement user authentication)
    ('550e8400-e29b-41d4-a716-446655440040', 'w3id_user_001', '8', CURRENT_TIMESTAMP - INTERVAL '1 hour 58 minutes'),
    ('550e8400-e29b-41d4-a716-446655440040', 'w3id_user_002', '8', CURRENT_TIMESTAMP - INTERVAL '1 hour 57 minutes'),
    ('550e8400-e29b-41d4-a716-446655440040', 'w3id_user_003', '5', CURRENT_TIMESTAMP - INTERVAL '1 hour 56 minutes'),
    ('550e8400-e29b-41d4-a716-446655440040', 'w3id_user_004', '8', CURRENT_TIMESTAMP - INTERVAL '1 hour 56 minutes'),
    
    -- Round 2 votes (Issue: Create game room UI)
    ('550e8400-e29b-41d4-a716-446655440041', 'w3id_user_001', '13', CURRENT_TIMESTAMP - INTERVAL '1 hour 48 minutes'),
    ('550e8400-e29b-41d4-a716-446655440041', 'w3id_user_002', '13', CURRENT_TIMESTAMP - INTERVAL '1 hour 47 minutes'),
    ('550e8400-e29b-41d4-a716-446655440041', 'w3id_user_003', '13', CURRENT_TIMESTAMP - INTERVAL '1 hour 46 minutes'),
    ('550e8400-e29b-41d4-a716-446655440041', 'w3id_user_004', '8', CURRENT_TIMESTAMP - INTERVAL '1 hour 46 minutes'),
    
    -- Round 3 votes (Issue: Build WebSocket server - active round, not revealed)
    ('550e8400-e29b-41d4-a716-446655440042', 'w3id_user_001', '13', CURRENT_TIMESTAMP - INTERVAL '8 minutes'),
    ('550e8400-e29b-41d4-a716-446655440042', 'w3id_user_002', '8', CURRENT_TIMESTAMP - INTERVAL '7 minutes'),
    ('550e8400-e29b-41d4-a716-446655440042', 'w3id_user_003', '13', CURRENT_TIMESTAMP - INTERVAL '6 minutes');

-- Insert timer state for active game
INSERT INTO timer_state (game_id, duration_seconds, remaining_seconds, is_running, time_issues) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', 2700, 1800, false, true);

-- Add comments for clarity
COMMENT ON TABLE users IS 'Sample users for development - simulates W3ID authenticated users';
COMMENT ON TABLE games IS 'Sample games showing different configurations and states';
COMMENT ON TABLE issues IS 'Sample issues in various states (pending, voting, voted)';
COMMENT ON TABLE voting_rounds IS 'Sample voting rounds including active and completed rounds';
COMMENT ON TABLE votes IS 'Sample votes showing voting patterns and consensus';

-- Made with Bob
