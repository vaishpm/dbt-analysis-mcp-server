#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d .venv ]]; then
  echo "Missing .venv. Run scripts/install-local.sh first." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env and set DBT_PROJECT_DIR." >&2
  exit 1
fi

source .venv/bin/activate
set -a
source .env
set +a

exec dbt-analysis-mcp
