# User Quickstart

## Codex Setup (Product Managers)

Use this if you have the **Codex CLI** and want to run data analysis against dbt and Redash.
You do not need a local dbt install, `profiles.yml`, or warehouse credentials.

### Prerequisites

- Install Codex CLI: `npm install -g @openai/codex`
- Log in: `codex login`
- Install Node.js (needed for the Redash MCP process)
- Ask your analytics team for:
  - Your personal dbt Cloud access token
  - Your Redash API key

### 1. Set credentials in your shell profile

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
export DBT_AUTH_HEADER="token <your-dbt-personal-access-token>"
export DBT_PROD_ENV_ID="<your-prod-environment-id>"
export REDASH_API_KEY="<your-redash-api-key>"
```

Then reload: `source ~/.zshrc`

### 2. Add MCP config to Codex

Copy `config/codex.example.toml` from this repo into `~/.codex/config.toml`
(create the file if it does not exist):

```bash
mkdir -p ~/.codex
cp config/codex.example.toml ~/.codex/config.toml
```

### 3. Wire the agent instructions (one-time)

The repo root contains an `AGENTS.md` that tells Codex how to use dbt and Redash together.
Codex loads it automatically when you run it from this directory.

If you want it to apply globally (across any working directory), copy it to your Codex home:

```bash
cp AGENTS.md ~/.codex/AGENTS.md
```

### 4. Try It

Start Codex from this repo directory and ask:

```text
What dbt models are available?
```

```text
Show me the mart models and describe what each one contains.
```

```text
How many active buyers did we have last month? Break it down by market.
```

```text
Create a Redash query showing weekly AB and AB2 by market for the last 3 months.
```

### What each tool gives you

| Tool | What you can ask |
|------|-----------------|
| **dbt** | List models, explore lineage, generate SQL from plain English, query metrics |
| **Redash** | List dashboards, create/run queries, build visualizations, save results |

---

## Hosted Cursor Setup

Use this setup when your team has shared a hosted MCP URL. You do not need a local dbt install, `profiles.yml`, warehouse credentials, or a dbt token.

### 1. Add Cursor Config

Cursor Settings -> MCP:

```json
{
  "mcpServers": {
    "dbt-analysis": {
      "url": "https://dbt-analysis-mcp.your-company.example/mcp"
    }
  }
}
```

Replace the URL with your team's internal MCP endpoint.

### 2. Try It

Ask Cursor:

```text
What dbt analysis tools are available?
```

Then try:

```text
List dbt models in the project.
```

```text
Compile the orders model and explain the generated SQL.
```

## Local Development Setup

Use this only if you are running the MCP server on your own machine.

### 1. Install

```bash
git clone git@github.com:vaishpm/dbt-analysis-mcp-server.git
cd dbt-analysis-mcp-server
scripts/install-local.sh
```

### 2. Configure

Edit `.env`:

```bash
DBT_PROJECT_DIR=/absolute/path/to/your/dbt/project
DBT_PATH=dbt
DBT_PROFILES_DIR=/absolute/path/to/profiles/dir
DBT_TARGET=dev
```

### 3. Check dbt

```bash
scripts/check-dbt.sh
```

### 4. Start MCP Server

```bash
scripts/run-local.sh
```

### 5. Add Cursor Config

Cursor Settings -> MCP:

```json
{
  "mcpServers": {
    "dbt-analysis": {
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

### 6. Try It

Ask Cursor:

```text
What dbt analysis tools are available?
```

Then try:

```text
List dbt models in my project.
```

```text
Compile the orders model and explain the generated SQL.
```
