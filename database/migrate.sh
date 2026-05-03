#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

read_env_value() {
  key="$1"
  value=""

  for env_file in backend/.env.development backend/.env.local; do
    if [ -f "$env_file" ]; then
      line="$(grep -E "^${key}=" "$env_file" | tail -n 1 || true)"
      if [ -n "$line" ]; then
        value="${line#*=}"
      fi
    fi
  done

  printf '%s' "$value" | tr -d '\r'
}

DB_HOST_VALUE="$(read_env_value DB_HOST)"
DB_PORT_VALUE="$(read_env_value DB_PORT)"
DB_NAME_VALUE="$(read_env_value DB_NAME)"
DB_USER_VALUE="$(read_env_value DB_USER)"
DB_PASSWORD_VALUE="$(read_env_value DB_PASSWORD)"
DB_MIGRATION_USER_VALUE="$(read_env_value DB_MIGRATION_USER)"
DB_MIGRATION_PASSWORD_VALUE="$(read_env_value DB_MIGRATION_PASSWORD)"

export PGHOST="${DB_HOST_VALUE:-localhost}"
export PGPORT="${DB_PORT_VALUE:-5432}"
export PGDATABASE="${DB_NAME_VALUE:-planning_poker_dev}"
export PGUSER="${DB_MIGRATION_USER_VALUE:-postgres}"

if [ -n "$DB_MIGRATION_PASSWORD_VALUE" ]; then
  export PGPASSWORD="$DB_MIGRATION_PASSWORD_VALUE"
elif [ "$PGUSER" = "${DB_USER_VALUE:-planning_poker}" ]; then
  export PGPASSWORD="$DB_PASSWORD_VALUE"
else
  unset PGPASSWORD
fi

PSQL="psql -v ON_ERROR_STOP=1"

$PSQL <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM schema_migrations WHERE filename = '001_initial_schema.sql'
       ) THEN
        INSERT INTO schema_migrations (filename) VALUES ('001_initial_schema.sql');
    END IF;
END $$;
SQL

for migration in database/migrations/[0-9][0-9][0-9]_*.sql; do
  case "$migration" in
    *_down.sql) continue ;;
  esac

  filename="$(basename "$migration")"
  applied="$($PSQL -tA -c "SELECT 1 FROM schema_migrations WHERE filename = '$filename'")"

  if [ "$applied" = "1" ]; then
    echo "Skipping $filename"
    continue
  fi

  echo "Applying $filename"
  $PSQL -f "$migration"
  $PSQL -c "INSERT INTO schema_migrations (filename) VALUES ('$filename') ON CONFLICT (filename) DO NOTHING"
done
