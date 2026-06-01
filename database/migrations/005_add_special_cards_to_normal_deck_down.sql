-- Rollback Migration: Remove special cards (? and ☕) from Normal (0-10) deck
-- Description: Reverts the Normal (0-10) deck back to its original values without special cards

-- Revert the Normal (0-10) deck to original values
UPDATE decks
SET values = ARRAY['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
WHERE name = 'Normal (0-10)' 
  AND is_default = true
  AND values = ARRAY['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕'];

-- Made with Bob