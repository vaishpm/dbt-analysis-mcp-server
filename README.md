# dbt + Redash Analysis Agent

Ask business questions in plain English. The agent queries your dbt models and saves results to Redash — no local dbt install, no warehouse credentials needed.

Works with two AI tools:

| Tool | How it gets instructions | Install |
|------|--------------------------|---------|
| **Codex** (OpenAI CLI) | `AGENTS.md` in repo root — loaded automatically | `scripts/install.sh` |
| **Cursor** | `.mdc` rules in `cursor-rules/` — copied to `~/.cursor/rules/` | `install-cursor-rules.sh` |

---

## Codex Setup (one-time, ~2 minutes)

### 1. Clone the repo and let Codex set itself up

```bash
git clone https://github.com/vaishpm/dbt-analysis-mcp-server
cd dbt-analysis-mcp-server
codex "set me up"
```

Codex reads `AGENTS.md` and runs `scripts/install.sh` automatically — it installs the Codex CLI (if needed), wires up dbt + Redash as MCP tools, and tells you exactly which credentials are still missing.

### 2. Add missing credentials

If prompted, add these to `~/.zshrc` and run `source ~/.zshrc`:

```bash
export DBT_AUTH_HEADER="token <your-dbt-personal-access-token>"
export DBT_PROD_ENV_ID="<your-prod-environment-id>"
export REDASH_API_KEY="<your-redash-api-key>"
```

Ask the analytics team for these values if you don't have them.

### 3. Start working

```bash
codex
```

> **Requires Node.js.** If `codex` isn't found, install Node.js from https://nodejs.org first.

---

## Cursor Setup (one-time, ~1 minute)

### 1. Clone the repo and run the installer

```bash
git clone https://github.com/vaishpm/dbt-analysis-mcp-server
bash dbt-analysis-mcp-server/install-cursor-rules.sh
```

This copies the 4 `.mdc` rule files from `cursor-rules/` into `~/.cursor/rules/`.

### 2. Restart Cursor

Quit Cursor completely (`Cmd+Q`) and reopen it. The rules are now active in every new chat — no project or file needs to be open.

> **Updating rules:** Pull the latest repo and re-run `install-cursor-rules.sh`. It overwrites existing files safely.

---

## What to ask

```
What dbt models are available?
```
```
How many active buyers did we have last month, broken down by market?
```
```
Create a Redash query showing weekly AB and AB2 for the last 3 months.
```
```
Build a dashboard for the RFQ funnel.
```
```
What's the definition of AB2?
```
```
Show me the SQL behind the active_buyers model.
```

---

## Repo structure

```
AGENTS.md                    ← Codex agent instructions (auto-loaded from repo root)
config/codex.example.toml   ← Codex MCP config (dbt + Redash)
scripts/install.sh           ← Codex one-command installer
cursor-rules/                ← Cursor rule files
  ab-ab2-metric-definitions.mdc
  data-source-routing.mdc
  uv-metric-definition.mdc
  supplier-facts-schema.mdc
install-cursor-rules.sh      ← Cursor one-command installer
```
