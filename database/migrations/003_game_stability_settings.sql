-- Stabilize game settings and add the normal 0-10 system deck.

INSERT INTO decks (name, values, is_default, created_by)
VALUES ('Normal (0-10)', ARRAY['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], TRUE, NULL)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE games
    ADD COLUMN IF NOT EXISTS who_can_toggle_spectator VARCHAR(20) DEFAULT 'all_players';

UPDATE games
SET who_can_toggle_spectator = 'all_players'
WHERE who_can_toggle_spectator IS NULL;

ALTER TABLE games
    ALTER COLUMN who_can_toggle_spectator SET DEFAULT 'all_players',
    ALTER COLUMN who_can_toggle_spectator SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.games'::regclass
          AND conname = 'games_who_can_toggle_spectator_check'
    ) THEN
        ALTER TABLE games
            ADD CONSTRAINT games_who_can_toggle_spectator_check
            CHECK (who_can_toggle_spectator IN ('all_players', 'facilitator_only'));
    END IF;
END $$;

ALTER TABLE games
    DROP COLUMN IF EXISTS fun_features_enabled;

-- Made with Bob