#!/usr/bin/env bash
# install-cursor-rules-remote.sh
# Installs Cursor rules without cloning the repository.

set -euo pipefail

REPO_RAW="https://raw.githubusercontent.com/vaishpm/dbt-analysis-mcp-server/main"
RULES_DIR="$HOME/.cursor/rules"

RULE_FILES=(
  "ab-ab2-metric-definitions.mdc"
  "data-source-routing.mdc"
  "supplier-facts-schema.mdc"
  "uv-metric-definition.mdc"
)

echo "Installing Cursor data analysis rules..."
mkdir -p "$RULES_DIR"

for name in "${RULE_FILES[@]}"; do
  url="$REPO_RAW/cursor-rules/$name"
  dest="$RULES_DIR/$name"

  if [[ -f "$dest" ]]; then
    echo "  ↺  Updating  $name"
  else
    echo "  +  Installing $name"
  fi

  curl -fsSL "$url" -o "$dest"
done

echo ""
echo "Done! ${#RULE_FILES[@]} rules installed to $RULES_DIR"
echo "Restart Cursor (Cmd+Q, then reopen) for the rules to take effect."
