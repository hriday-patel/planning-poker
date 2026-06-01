-- Migration: Add special cards (? and ☕) to Normal (0-10) deck
-- Description: Updates the Normal (0-10) deck to include "?" and "☕" special cards at the end

-- Update the Normal (0-10) deck to include special cards
UPDATE decks
SET values = ARRAY['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕']
WHERE name = 'Normal (0-10)' 
  AND is_default = true
  AND values = ARRAY['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

-- Made with Bob