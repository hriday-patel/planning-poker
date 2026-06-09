ALTER TABLE users
    DROP COLUMN IF EXISTS jira_site_url,
    DROP COLUMN IF EXISTS jira_api_token_encrypted;
