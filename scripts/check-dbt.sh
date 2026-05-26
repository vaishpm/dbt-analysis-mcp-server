#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env first." >&2
  exit 1
fi

set -a
source .env
set +a

: "${DBT_PROJECT_DIR:?DBT_PROJECT_DIR is required}"
DBT_PATH="${DBT_PATH:-dbt}"

cd "$DBT_PROJECT_DIR"
"$DBT_PATH" debug
"$DBT_PATH" ls --resource-type model --output name
