-- Rollback: remove assignee column from issues.
ALTER TABLE issues
    DROP COLUMN IF EXISTS assignee;
