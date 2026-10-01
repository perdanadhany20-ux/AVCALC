#!/usr/bin/env bash
# Menjalankan migration + supabase/tests/*.sql pada Postgres lokal (tanpa Docker).
# Butuh: postgresql-16 dan postgresql-16-pgtap. Koneksi lewat variabel standar PGHOST, PGPORT, PGUSER.
# Contoh: PGHOST=localhost PGUSER=postgres bash scripts/ci/test-rls-local.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
psql -d postgres -v ON_ERROR_STOP=1 -q -c "drop database if exists avcalc_rls" -c "create database avcalc_rls"
TEST_URL=avcalc_rls
psql -d "$TEST_URL" -v ON_ERROR_STOP=1 -q -f scripts/ci/supabase-stub.sql
for f in supabase/migrations/*.sql; do psql -d "$TEST_URL" -v ON_ERROR_STOP=1 -q -f "$f"; done
psql -d "$TEST_URL" -v ON_ERROR_STOP=1 -q -c "create extension if not exists pgtap with schema extensions"
status=0
for t in supabase/tests/*.test.sql; do
  out=$(psql -d "$TEST_URL" -X -q -t -A -v ON_ERROR_STOP=1 -c "set search_path = public, extensions" -f "$t")
  echo "$out"
  if echo "$out" | grep -q "^not ok"; then status=1; fi
  if ! echo "$out" | grep -qE "^ok [0-9]+"; then status=1; fi
done
exit $status
