-- Add assignee display name for issues imported from tools like Jira.
ALTER TABLE issues
    ADD COLUMN IF NOT EXISTS assignee VARCHAR(255);
