#!/usr/bin/env bash
set -euo pipefail

REPO="https://raw.githubusercontent.com/visable-dev/dbt-analysis-mcp-server/main"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"

echo "Setting up Codex for dbt + Redash analysis..."

# Check prerequisites
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required. Install from https://nodejs.org" >&2
  exit 1
fi
if ! command -v codex &>/dev/null; then
  echo "Installing Codex CLI..."
  npm install -g @openai/codex
fi

# Check required env vars. The dbt prod environment ID is baked into config/codex.example.toml.
missing=()
[[ -z "${DBT_AUTH_HEADER:-}" ]] && missing+=("DBT_AUTH_HEADER")
[[ -z "${REDASH_API_KEY:-}" ]]  && missing+=("REDASH_API_KEY")

if [[ ${#missing[@]} -gt 0 ]]; then
  echo ""
  echo "Missing environment variables. Add these to your ~/.zshrc and run 'source ~/.zshrc':"
  echo ""
  for var in "${missing[@]}"; do
    case "$var" in
      DBT_AUTH_HEADER) echo "  export DBT_AUTH_HEADER=\"token <your-dbt-personal-access-token>\"" ;;
      REDASH_API_KEY)  echo "  export REDASH_API_KEY=\"<your-redash-api-key>\"" ;;
    esac
  done
  echo ""
  echo "Ask the analytics team for these values, then re-run:"
  echo "  curl -fsSL $REPO/scripts/install.sh | bash"
  exit 1
fi

# Install config and agent instructions
mkdir -p "$CODEX_HOME"
curl -fsSL "$REPO/config/codex.example.toml" -o "$CODEX_HOME/config.toml"
curl -fsSL "$REPO/AGENTS.md"                 -o "$CODEX_HOME/AGENTS.md"

echo ""
echo "Done! Start Codex and ask anything:"
echo ""
echo "  codex"
echo ""
echo "  'What dbt models are available?'"
echo "  'How many active buyers last month by market?'"
echo "  'Create a Redash query for weekly AB and AB2 trends.'"
