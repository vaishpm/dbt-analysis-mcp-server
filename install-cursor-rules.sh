#!/bin/bash
# install-cursor-rules.sh
# Installs Cursor rules for the B2B data analysis agent.
# Run once on any machine: bash install-cursor-rules.sh

set -e

RULES_DIR="$HOME/.cursor/rules"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cursor-rules"

echo "Installing Cursor data analysis rules..."

mkdir -p "$RULES_DIR"

for file in "$SCRIPT_DIR"/*.mdc; do
  name="$(basename "$file")"
  dest="$RULES_DIR/$name"

  if [ -f "$dest" ]; then
    echo "  ↺  Updating  $name"
  else
    echo "  +  Installing $name"
  fi

  cp "$file" "$dest"
done

echo ""
echo "Done! $(ls "$SCRIPT_DIR"/*.mdc | wc -l | tr -d ' ') rules installed to $RULES_DIR"
echo "Restart Cursor (Cmd+Q, then reopen) for the rules to take effect."
