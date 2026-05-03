-- Add the unique deck-name constraint expected by deck initialization.
-- Existing databases created before this constraint was added to the initial
-- schema need this repair so ON CONFLICT (name) can infer a unique index.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.decks'::regclass
          AND conname = 'decks_name_key'
    ) THEN
        ALTER TABLE public.decks
            ADD CONSTRAINT decks_name_key UNIQUE (name);
    END IF;
END $$;

-- Made with Bob
