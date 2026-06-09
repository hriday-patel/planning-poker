-- Per-user Jira integration settings used for sprint imports.
-- The API token is stored encrypted (AES-256-GCM) by the backend.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS jira_site_url TEXT NOT NULL DEFAULT 'https://jsw.ibm.com/secure/Dashboard.jspa',
    ADD COLUMN IF NOT EXISTS jira_api_token_encrypted TEXT;
