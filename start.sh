#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"&&pwd)";SERVER_PORT="${SERVER_PORT:-3001}";CLIENT_PORT="${CLIENT_PORT:-3000}";JWT_SECRET_VALUE="${JWT_SECRET:-}"
if [[ ! -d "$PROJECT_DIR/server/node_modules" || ! -d "$PROJECT_DIR/client/node_modules" ]];then echo "Dependencies absent; run ./scripts/bootstrap.sh." >&2;exit 1;fi
if [[ -z "${DATABASE_URL:-}" && ( -z "${DB_HOST:-}" || -z "${DB_NAME:-}" || -z "${DB_USER:-}" || -z "${DB_PASSWORD:-}" ) ]];then echo "Database configuration is incomplete." >&2;exit 1;fi
if [[ "${#JWT_SECRET_VALUE}" -lt 32 ]];then echo "JWT_SECRET must contain at least 32 characters." >&2;exit 1;fi
for port in "$SERVER_PORT" "$CLIENT_PORT";do if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1;then echo "Port $port is occupied; no process was terminated." >&2;exit 1;fi;done
(cd "$PROJECT_DIR/server" && SERVER_PORT="$SERVER_PORT" npm start) &
server_pid=$!
(cd "$PROJECT_DIR/client" && BROWSER=none PORT="$CLIENT_PORT" npm start) &
client_pid=$!
cleanup() {
  kill "$server_pid" "$client_pid" 2>/dev/null || true
  wait "$server_pid" "$client_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
wait "$server_pid"
