#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS=()
NAMES=()

cleanup() {
  local exit_code=$?

  trap - EXIT INT TERM HUP

  if ((${#PIDS[@]})); then
    kill "${PIDS[@]}" 2>/dev/null || true
    wait "${PIDS[@]}" 2>/dev/null || true
  fi

  exit "$exit_code"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

start_service() {
  local name=$1
  local directory=$2
  shift 2

  (
    cd "$ROOT_DIR/$directory"
    echo "[$name] Starting in $directory"
    exec "$@"
  ) &

  PIDS+=("$!")
  NAMES+=("$name")
}

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required." >&2
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  echo "npm is required." >&2
  exit 1
}

if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
  echo "Dependencies are missing. Run 'npm install' first." >&2
  exit 1
fi

echo "Starting MING development environment"
echo "  Web:   http://localhost:3000"
echo "  Admin: http://localhost:3001"
echo "  API:   http://localhost:4000/api"
echo

# NEXT_DIST_DIR keeps dev artifacts separate from production builds in .next.
start_service "web" "apps/web" env NEXT_DIST_DIR=.next-dev npm run dev
start_service "api" "apps/api" npm run dev
start_service "admin" "admin" env NEXT_DIST_DIR=.next-dev npm run dev

# Bash 3 (the macOS default) has no `wait -n`, so poll the child processes.
# If one service stops, exit and let the cleanup trap stop the other services.
while true; do
  for index in "${!PIDS[@]}"; do
    pid=${PIDS[$index]}

    if ! kill -0 "$pid" 2>/dev/null; then
      set +e
      wait "$pid"
      exit_code=$?
      set -e

      echo "[${NAMES[$index]}] Stopped; shutting down the remaining services." >&2
      ((exit_code == 0)) && exit_code=1
      exit "$exit_code"
    fi
  done

  sleep 1
done
