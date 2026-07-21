#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.."&&pwd)";if [[ "${ALLOW_SCHEMA_MUTATION:-}" != "yes" ]];then echo "Refusing schema changes until ALLOW_SCHEMA_MUTATION=yes after backup/review." >&2;exit 1;fi;if [[ -z "${DATABASE_URL:-}" ]];then echo "DATABASE_URL is required." >&2;exit 1;fi;for migration in "$PROJECT_DIR"/server/migrations/*.sql;do psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f "$migration";done
