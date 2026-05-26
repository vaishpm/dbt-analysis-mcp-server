# Deploy the Data Analysis Agent Web App

## Option A — Vercel (recommended, ~5 minutes)

```bash
cd web
npx vercel
```

Set environment variables in the Vercel dashboard (Settings → Environment Variables):

| Variable | Where to get it |
|---|---|
| `CURSOR_API_KEY` | cursor.com/dashboard/integrations |
| `DBT_AUTH_HEADER` | `token <your-dbt-pat>` |
| `DBT_PROD_ENV_ID` | dbt Cloud environment ID |
| `DBT_MCP_URL` | `https://<subdomain>.eu1.dbt.com/api/ai/v1/mcp/` |
| `REDASH_URL` | `https://redash.visable.com/` |
| `REDASH_API_KEY` | Redash → Profile → API Key |
| `INTERNAL_ACCESS_TOKEN` | Choose any shared secret string |

Share `INTERNAL_ACCESS_TOKEN` with your team — they paste it once on the login page.

---

## Option B — Docker / self-hosted

```bash
cd web

# Build image
docker build -t dbt-analysis-web .

# Run with env file
cp .env.example .env.local
# edit .env.local with real values
docker run -p 3000:3000 --env-file .env.local dbt-analysis-web
```

Open http://localhost:3000 — enter your `INTERNAL_ACCESS_TOKEN` to log in.

---

## Option C — Local dev

```bash
cd web
cp .env.example .env.local
# edit .env.local with real values
npm run dev
```

App runs at http://localhost:3000. If `INTERNAL_ACCESS_TOKEN` is not set, the login page is skipped entirely (useful for local dev).

---

## Notes

- The `REPO_ROOT` env var controls where the agent looks for `AGENTS.md`. It defaults to the parent directory of `web/` (i.e. the repo root). Override it if deploying without the rest of the repo.
- The dbt MCP is HTTP — no extra process needed.
- The Redash MCP is stdio via `npx @suthio/redash-mcp` — `npx` must be available in the server environment. Vercel and Docker both include it via Node.
