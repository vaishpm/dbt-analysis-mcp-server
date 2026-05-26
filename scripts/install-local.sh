#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example. Update DBT_PROJECT_DIR and DBT_PATH before starting the server."
else
  echo ".env already exists; leaving it unchanged."
fi

echo "Install complete."
