# dbt + Redash Analysis Agent

Ask business questions in plain English. The agent queries your dbt models and saves results to Redash — no local dbt install, no warehouse credentials needed.

Three ways to use it:

| Option | Best for | Setup |
|--------|----------|-------|
| **Web app** | Everyone — just a browser | Get the URL from the analytics team |
| **Cursor** | Analysts who use Cursor IDE | One-time script, ~1 minute |
| **Codex** | Developers with OpenAI CLI | One-time script, ~2 minutes |

---

## Option 1 — Web App (no setup needed)

The agent is available as a chat interface at the internal URL shared by the analytics team.

Log in with the shared team password and start asking questions immediately — no installs, no credentials.

---

## Option 2 — Cursor Setup (one-time, ~1 minute)

### 1. Run the remote installer

```bash
curl -fsSL https://raw.githubusercontent.com/vaishpm/dbt-analysis-mcp-server/main/install-cursor-rules-remote.sh | bash
```

This copies 4 rule files into `~/.cursor/rules/` so the agent knows your data models in every new chat.

### 2. Restart Cursor

Quit Cursor completely (`Cmd+Q`) and reopen it. The rules are now active in every new chat — no project needs to be open.

> **Updating rules:** Re-run the same `curl` command. It overwrites existing files safely.

---

## Option 3 — Codex Setup (one-time, ~2 minutes)

### 1. Clone the repo and run the installer

```bash
git clone https://github.com/vaishpm/dbt-analysis-mcp-server
cd dbt-analysis-mcp-server
bash scripts/install.sh
```

The installer installs Codex CLI if needed, wires up dbt + Redash as MCP tools, and tells you which credentials are still missing.

### 2. Add missing credentials (if prompted)

Add these to `~/.zshrc` and run `source ~/.zshrc`:

```bash
export DBT_AUTH_HEADER="token <your-dbt-personal-access-token>"
export REDASH_API_KEY="<your-redash-api-key>"
```

Ask the analytics team for your dbt personal access token and Redash API key.

> **Requires Node.js.** Install from https://nodejs.org if `codex` isn't found.

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
Create a Direct Requests funnel for the last 6 months by platform.
```
```
Deep dive Direct Requests drop-off from created request to positive supplier reply by market.
```
```
Automate a reusable Redash dashboard for Direct Requests funnel conversion and supplier reply SLA.
```
```
What's the definition of AB2?
```
```
Show me the SQL behind the active_buyers model.
```

---

## Regular Analysis Playbooks

The agent has built-in playbooks for recurring PM analysis. For Direct Requests funnel analysis, ask naturally:

```
Create a Direct Requests funnel for the last 6 months by platform.
```

The agent will use `reporting.fact_direct_requests`, validate the model schema, build the funnel stages, calculate conversion rates, identify the biggest drop-off, and create a Redash query or dashboard when you ask for a reusable view.

Default Direct Requests funnel stages:

| Stage | Logic |
|-------|-------|
| Direct requests created | `COUNT(DISTINCT id)` |
| Quality direct requests | `is_quality = true` |
| Supplier replied | `is_answered = true` or `first_reply_from_supplier_at IS NOT NULL` |
| Positive supplier reply | `LOWER(response_type) = 'positive'` |
| Converted to RFQ | `rfq_id IS NOT NULL` |
| Purchaser selected RFQ conversion | `has_purchaser_selected_convert_to_rfq = true` |

For recurring use, PMs should pull the latest rules and reinstall:

```bash
cd dbt-analysis-mcp-server
git pull
bash scripts/install.sh
```

Cursor users should also run:

```bash
curl -fsSL https://raw.githubusercontent.com/vaishpm/dbt-analysis-mcp-server/main/install-cursor-rules-remote.sh | bash
```

Restart Cursor after updating rules.

---

## Repo structure

```
AGENTS.md                    ← Agent instructions (Codex reads this automatically)
config/codex.example.toml   ← Codex MCP config (dbt + Redash)
scripts/install.sh           ← Codex one-command installer
cursor-rules/                ← Cursor rule files (.mdc)
  ab-ab2-metric-definitions.mdc
  data-source-routing.mdc
  uv-metric-definition.mdc
  supplier-facts-schema.mdc
install-cursor-rules.sh      ← Cursor one-command installer
install-cursor-rules-remote.sh ← Cursor no-clone remote installer
web/                         ← Web app (Next.js chat interface)
```
