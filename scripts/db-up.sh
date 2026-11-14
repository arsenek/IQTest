#!/usr/bin/env bash
# Start a durable Postgres whose data survives process/machine restart.
# Prefer Docker Compose named volume; fall back to Homebrew Postgres + on-disk data dir.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DATA_DIR="${IQTEST_PGDATA:-$ROOT/.data/postgres}"
PORT="${IQTEST_PGPORT:-5432}"
DB_NAME="${IQTEST_PGDATABASE:-iqtest}"
DB_USER="${IQTEST_PGUSER:-postgres}"
DB_PASS="${IQTEST_PGPASSWORD:-postgres}"

compose_up() {
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "Docker CLI present but daemon not reachable; trying local Postgres fallback." >&2
    return 1
  fi
  echo "Starting Postgres 16 via docker compose (named volume iqtest_pgdata)…"
  docker compose up -d db
  echo "Waiting for health…"
  for _ in $(seq 1 40); do
    if docker compose exec -T db pg_isready -U postgres -d iqtest >/dev/null 2>&1; then
      echo "Postgres ready on localhost:${PORT} (Docker volume)."
      echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:${PORT}/${DB_NAME}?schema=public"
      return 0
    fi
    sleep 1
  done
  echo "Docker Postgres did not become ready in time." >&2
  return 1
}

local_up() {
  local bindir bin
  bindir=""
  for candidate in \
    /opt/homebrew/opt/postgresql@16/bin \
    /usr/local/opt/postgresql@16/bin \
    /opt/homebrew/opt/postgresql/bin \
    /usr/local/opt/postgresql/bin; do
    if [[ -x "$candidate/initdb" && -x "$candidate/pg_ctl" ]]; then
      bindir="$candidate"
      break
    fi
  done
  if [[ -z "$bindir" ]]; then
    if command -v brew >/dev/null 2>&1; then
      echo "Installing postgresql@16 via Homebrew (one-time)…"
      brew install postgresql@16
      bindir="$(brew --prefix postgresql@16)/bin"
    else
      echo "Neither Docker nor Homebrew Postgres is available." >&2
      echo "Install Docker Desktop, or: brew install postgresql@16" >&2
      return 1
    fi
  fi

  mkdir -p "$(dirname "$DATA_DIR")"
  if [[ ! -f "$DATA_DIR/PG_VERSION" ]]; then
    echo "Initializing Postgres data dir at $DATA_DIR …"
    "$bindir/initdb" -D "$DATA_DIR" -U "$DB_USER" --auth-local=trust --auth-host=trust --locale=C --encoding=UTF8
  fi

  if "$bindir/pg_ctl" -D "$DATA_DIR" status >/dev/null 2>&1; then
    echo "Local Postgres already running (data dir: $DATA_DIR)."
  else
    echo "Starting local Postgres on port ${PORT} (data dir: $DATA_DIR)…"
    "$bindir/pg_ctl" -D "$DATA_DIR" -l "$DATA_DIR/server.log" -o "-p ${PORT}" start
  fi

  export PATH="$bindir:$PATH"
  for _ in $(seq 1 40); do
    if "$bindir/pg_isready" -h localhost -p "$PORT" -U "$DB_USER" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done

  if ! "$bindir/psql" -h localhost -p "$PORT" -U "$DB_USER" -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
    "$bindir/createdb" -h localhost -p "$PORT" -U "$DB_USER" "$DB_NAME"
  fi

  echo "Postgres ready on localhost:${PORT} (on-disk: $DATA_DIR)."
  echo "DATABASE_URL=postgresql://${DB_USER}@localhost:${PORT}/${DB_NAME}?schema=public"
}

if compose_up; then
  exit 0
fi
local_up
