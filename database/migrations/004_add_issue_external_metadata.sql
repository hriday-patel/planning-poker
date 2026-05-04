-- Add external issue metadata for imports from tools like Jira.
ALTER TABLE issues
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS external_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS external_url TEXT;

CREATE INDEX IF NOT EXISTS idx_issues_external_key
    ON issues(game_id, source, external_key)
    WHERE external_key IS NOT NULL;
