#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-local}"   # local | remote

case "$MODE" in
  local)
    echo "[migrate_all] applying migrations to LOCAL db (reset)"
    supabase start >/dev/null 2>&1 || true
    supabase db reset
    ;;
  remote)
    echo "[migrate_all] applying migrations to REMOTE project (linked)"
    supabase db push
    ;;
  *)
    echo "usage: $0 [local|remote]"
    exit 1
    ;;
esac

echo "[migrate_all] done."
