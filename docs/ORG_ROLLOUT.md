# Org Rollout Guide

This project can be shared with the org in two ways:

1. Centrally hosted HTTP server
2. Local per-user server

The recommended default is a centrally hosted HTTP server. This makes the experience closest to dbt's remote MCP server: Cursor users add a single URL and can use dbt tools without having local dbt credentials, local `profiles.yml`, or a local dbt install. The dbt project, profile, and warehouse credentials are managed on the server instead.

## Recommended: Hosted Cursor Endpoint

Use this when you want analysts and PMs to connect from Cursor without configuring dbt locally.

### Admin Setup

1. Deploy this service once in an internal environment.
2. Mount or clone the production dbt project into the container.
3. Provide a server-side `profiles.yml` or environment-based profile credentials for a service account.
4. Use a read-only or analyst-safe warehouse role where possible.
5. Keep `ALLOW_DBT_RUN=false` unless the team explicitly wants model-building tools exposed.
6. Put the endpoint behind company network/auth controls, such as VPN, reverse proxy auth, or identity-aware proxy.
7. Share only the Cursor MCP endpoint URL with users.

### Build

Choose the dbt adapter your project needs:

```bash
docker build \
  --build-arg DBT_ADAPTER_PACKAGE=dbt-redshift \
  -t dbt-analysis-mcp-server:latest .
```

Other examples:

```bash
docker build --build-arg DBT_ADAPTER_PACKAGE=dbt-snowflake -t dbt-analysis-mcp-server:latest .
docker build --build-arg DBT_ADAPTER_PACKAGE=dbt-bigquery -t dbt-analysis-mcp-server:latest .
```

### Run

Mount the dbt project and profiles directory:

```bash
docker run --rm -p 8000:8000 \
  -e DBT_PROJECT_DIR=/workspace/dbt \
  -e DBT_PATH=dbt \
  -e DBT_TARGET=prod \
  -e ALLOW_DBT_RUN=false \
  -v /absolute/path/to/dbt/project:/workspace/dbt:ro \
  -v /absolute/path/to/profiles:/root/.dbt:ro \
  dbt-analysis-mcp-server:latest
```

Cursor config for hosted deployment:

```json
{
  "mcpServers": {
    "dbt-analysis": {
      "url": "https://dbt-analysis-mcp.your-company.example/mcp"
    }
  }
}
```

### User Setup

Users do not need `DBT_TOKEN`, `DBT_PROJECT_DIR`, `DBT_PROFILES_DIR`, or warehouse credentials on their machines. In Cursor:

1. Open Cursor Settings -> MCP.
2. Add the hosted config from `config/cursor.hosted.example.json`.
3. Ask Cursor: `What dbt analysis tools are available?`
4. Ask Cursor: `List dbt models in the project.`

## Optional: Local Per-User Server

Use this only when analysts already have local access to the dbt project and warehouse credentials, or when developing this MCP server.

### Admin Setup

1. Fork or clone from [github.com/vaishpm/dbt-analysis-mcp-server](https://github.com/vaishpm/dbt-analysis-mcp-server) into an internal repository if desired, or use it directly.
2. Ensure your internal copy is accessible to all users who need it.
3. Keep `.env.example`, `config/cursor.local.example.json`, and docs committed.
4. Do not commit `.env`, profiles, tokens, or warehouse credentials.
5. Decide whether `ALLOW_DBT_RUN` should stay disabled for local users.

### User Setup

```bash
git clone git@github.com:vaishpm/dbt-analysis-mcp-server.git
cd dbt-analysis-mcp-server
scripts/install-local.sh
```

Then edit `.env`:

```bash
DBT_PROJECT_DIR=/absolute/path/to/your/dbt/project
DBT_PATH=dbt
DBT_PROFILES_DIR=/absolute/path/to/profiles/dir
DBT_TARGET=dev
```

Validate dbt:

```bash
scripts/check-dbt.sh
```

Start the MCP server:

```bash
scripts/run-local.sh
```

Add this to Cursor MCP settings:

```json
{
  "mcpServers": {
    "dbt-analysis": {
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

## Security Guidance

- Prefer read-oriented commands: `dbt ls`, `dbt compile`, `dbt show`, `dbt test`, and `dbt source freshness`.
- Keep `ALLOW_DBT_RUN=false` unless the team explicitly wants the server to execute model builds.
- Use a read-only warehouse role for hosted deployments where possible.
- Put hosted deployments behind your normal company authentication layer, such as VPN, reverse proxy auth, or identity-aware proxy.
- Do not expose a hosted MCP server publicly without authentication.
- Avoid mounting writable dbt project directories into hosted containers.
- Review tool changes like API changes. Any new tool expands what AI clients can ask the server to do.

## Release Process

Use semantic versions:

- Patch: docs, small fixes, or safer validation.
- Minor: new analysis tools.
- Major: changed tool behavior or broader warehouse permissions.

Before a release:

```bash
python3 -m py_compile src/dbt_analysis_mcp/*.py
```

Then tag the internal repo:

```bash
git tag v0.1.0
git push origin v0.1.0
```
