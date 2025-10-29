#!/usr/bin/env bash
set -euo pipefail

SQL_FILE="scripts/sql/check-policies.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[check-policies] DATABASE_URL is not set."
  echo "export DATABASE_URL='postgres://postgres:<db_password>@db.<ref>.supabase.co:5432/postgres'"
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
