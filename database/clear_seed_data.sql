-- Clear seed data from database
-- Run this with: psql -U postgres -d planning_poker_dev -f database/clear_seed_data.sql

-- Delete votes from seed games
DELETE FROM votes 
WHERE round_id IN (
  SELECT id FROM voting_rounds 
  WHERE game_id IN (
    SELECT id FROM games WHERE creator_id LIKE 'seed_%'
  )
);

-- Delete voting rounds from seed games
DELETE FROM voting_rounds 
WHERE game_id IN (
  SELECT id FROM games WHERE creator_id LIKE 'seed_%'
);

-- Delete issues from seed games
DELETE FROM issues 
WHERE game_id IN (
  SELECT id FROM games WHERE creator_id LIKE 'seed_%'
);

-- Delete game participants from seed games
DELETE FROM game_participants 
WHERE game_id IN (
  SELECT id FROM games WHERE creator_id LIKE 'seed_%'
);

-- Delete seed games
DELETE FROM games WHERE creator_id LIKE 'seed_%';

-- Delete seed users
DELETE FROM users WHERE id LIKE 'seed_%';

-- Verify cleanup
SELECT 'Remaining seed users:' as status, COUNT(*) as count FROM users WHERE id LIKE 'seed_%'
UNION ALL
SELECT 'Remaining seed games:' as status, COUNT(*) as count FROM games WHERE creator_id LIKE 'seed_%';

-- Made with Bob
