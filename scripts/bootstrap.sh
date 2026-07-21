#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.."&&pwd)";npm --prefix "$PROJECT_DIR/server" ci;npm --prefix "$PROJECT_DIR/client" ci;echo "Lockfile dependencies installed; database state unchanged."
