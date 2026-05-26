# dbt + Redash for Codex

Ask business questions in plain English. Codex queries your dbt models and saves results to Redash — no local dbt install, no warehouse credentials needed.

---

## Setup (one-time, ~5 minutes)

### 1. Set your credentials

Add to `~/.zshrc` and run `source ~/.zshrc`:

```bash
export DBT_AUTH_HEADER="token <your-dbt-personal-access-token>"
export DBT_PROD_ENV_ID="<your-prod-environment-id>"
export REDASH_API_KEY="<your-redash-api-key>"
```

Ask the analytics team for these values if you don't have them.

### 2. Run the installer

```bash
curl -fsSL https://raw.githubusercontent.com/vaishpm/dbt-analysis-mcp-server/main/scripts/install.sh | bash
```

This installs Codex CLI (if needed) and wires up dbt + Redash as MCP tools.

### 3. Start working

```bash
codex
```

That's it. No repo to clone, no config files to edit.

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
