# dbt + Redash MCP Config for Codex and Cursor

Connect Codex CLI or Cursor to your dbt Cloud models and Redash dashboards — no local dbt install, no warehouse credentials, no profiles.yml.

This repo contains:
- `AGENTS.md` — Codex instructions that load automatically
- `config/codex.example.toml` — Codex MCP wiring for dbt + Redash
- `config/cursor.hosted.example.json` — Cursor MCP config for dbt

---

## Codex Setup (recommended for PMs)

### 1. Prerequisites

- Node.js installed
- Codex CLI: `npm install -g @openai/codex`
- Log in: `codex login`
- Your **dbt Cloud personal access token** and **Redash API key** (ask the analytics team)

### 2. Clone this repo

```bash
git clone git@github.com:vaishpm/dbt-analysis-mcp-server.git
cd dbt-analysis-mcp-server
```

### 3. Set credentials in your shell profile

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
export DBT_AUTH_HEADER="token <your-dbt-personal-access-token>"
export DBT_PROD_ENV_ID="<your-prod-environment-id>"
export REDASH_API_KEY="<your-redash-api-key>"
```

Then reload: `source ~/.zshrc`

### 4. Copy the Codex config

```bash
mkdir -p ~/.codex
cp config/codex.example.toml ~/.codex/config.toml
```

### 5. Copy the agent instructions (one-time)

```bash
cp AGENTS.md ~/.codex/AGENTS.md
```

This tells Codex how to use dbt and Redash together. It loads automatically every session.

### 6. Run Codex and ask in plain English

```bash
codex
```

Try:

```
What dbt models are available?
```
```
How many active buyers did we have last month, broken down by market?
```
```
Create a Redash query showing weekly AB and AB2 trends for the last 3 months.
```

---

## What Codex can do for you

| Ask Codex | What happens |
|-----------|-------------|
| "What models exist for buyers / suppliers / orders?" | Calls `get_mart_models` and explains each one |
| "How many AB and AB2 last quarter by market?" | Discovers the right model, writes Redshift SQL, returns results |
| "Create a Redash query for weekly AB trends" | Writes SQL → saves query → validates it → creates a chart |
| "Build a dashboard for the RFQ funnel" | Creates Redash query + visualization + dashboard in one go |
| "What's the grain of the active_buyers model?" | Calls `get_model_details` and explains the row-level definition |
| "Show me the SQL behind the AB2 metric" | Fetches compiled SQL from the dbt Semantic Layer |
