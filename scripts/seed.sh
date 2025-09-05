#!/usr/bin/env bash
set -euo pipefail

SEED_FILE="${1:-supabase/migrations/*seeds*.sql}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[seed] DATABASE_URL is not set."
  echo "export DATABASE_URL='postgres://USER:PASSWORD@HOST:PORT/postgres'"
  exit 1
fi

echo "[seed] applying seed file(s): $SEED_FILE"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f $SEED_FILE

echo "[seed] done."
