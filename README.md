# dbt Analysis MCP Server

Custom Python HTTP MCP server for dbt analysis workflows. It is intended as an internal, remote-like alternative to dbt's hosted MCP server when you want Cursor users to connect through one managed endpoint without each user needing dbt credentials on their laptop.

## Included Tools

- `dbt_list_resources`: list dbt models, sources, tests, metrics, exposures, and other resources.
- `dbt_compile`: compile selected dbt SQL without running models.
- `dbt_show`: preview selected dbt resources with a configurable row limit.
- `dbt_test`: run selected dbt tests for data quality checks.
- `dbt_source_freshness`: check source freshness.
- `read_dbt_project_file`: read `.sql`, `.yml`, `.yaml`, or `.md` files inside the dbt project.
- `dbt_run_analysis`: optional `dbt run`, disabled unless `ALLOW_DBT_RUN=true`.

## Recommended Setup: Hosted for Cursor

For org rollout, see `docs/ORG_ROLLOUT.md`.

In the recommended hosted setup:

- The server is deployed once by the analytics/admin team.
- The dbt project, `profiles.yml`, and warehouse/dbt credentials live only on the server.
- Cursor users configure a single HTTP MCP URL and do not need local dbt credentials.
- `ALLOW_DBT_RUN=false` keeps the exposed tools analysis-oriented by default.

Cursor MCP config for users:

```json
{
  "mcpServers": {
    "dbt-analysis": {
      "url": "https://dbt-analysis-mcp.your-company.example/mcp"
    }
  }
}
```

## Local Development Setup

```bash
cd /Users/Pagadala/dbt-analysis-mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
```

Edit `.env` and set:

```bash
DBT_PROJECT_DIR=/absolute/path/to/your/dbt/project
DBT_PATH=dbt
```

If your dbt executable is inside a virtual environment, use its absolute path:

```bash
DBT_PATH=/absolute/path/to/.venv/bin/dbt
```

## Run Locally

```bash
cd /Users/Pagadala/dbt-analysis-mcp-server
source .venv/bin/activate
set -a
source .env
set +a
dbt-analysis-mcp
```

The server uses MCP Streamable HTTP. By default, the endpoint is typically:

```text
http://127.0.0.1:8000/mcp
```

## Local Cursor MCP Config

Add this in Cursor Settings → MCP:

```json
{
  "mcpServers": {
    "dbt-analysis": {
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

Start the local server before using the MCP tools in Cursor.

## Team Quickstart

For most Cursor users, share `config/cursor.hosted.example.json` with the real hosted URL.

For local per-user development:

```bash
scripts/install-local.sh
scripts/check-dbt.sh
scripts/run-local.sh
```

For a centrally hosted service, use `Dockerfile`, `docker-compose.example.yml`, and `config/cursor.hosted.example.json`.

## Security Notes

This server does not expose arbitrary shell execution. All dbt commands are built from allowlisted Python functions and executed without a shell.

`dbt_run_analysis` is disabled by default because `dbt run` can create or replace relations in the warehouse. Enable it only for trusted local use:

```bash
ALLOW_DBT_RUN=true
```
