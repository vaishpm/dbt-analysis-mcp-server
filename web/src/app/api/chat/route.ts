import { NextRequest } from "next/server";
import { Agent, CursorAgentError, type McpServerConfig, type SDKMessage } from "@cursor/sdk";
import path from "path";

// Path to the repo root where AGENTS.md lives
const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(process.cwd(), "..");

function buildMcpServers(): Record<string, McpServerConfig> {
  const servers: Record<string, McpServerConfig> = {};

  if (process.env.DBT_MCP_URL) {
    servers.dbt = {
      type: "http",
      url: process.env.DBT_MCP_URL,
      headers: {
        Authorization: process.env.DBT_AUTH_HEADER ?? "",
        ...(process.env.DBT_PROD_ENV_ID
          ? { "x-dbt-prod-environment-id": process.env.DBT_PROD_ENV_ID }
          : {}),
      },
    };
  }

  if (process.env.REDASH_URL && process.env.REDASH_API_KEY) {
    servers.redash = {
      type: "stdio",
      command: "npx",
      args: ["-y", "@suthio/redash-mcp"],
      env: {
        REDASH_URL: process.env.REDASH_URL,
        REDASH_API_KEY: process.env.REDASH_API_KEY,
      },
    };
  }

  return servers;
}

function encode(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function streamRun(
  run: Awaited<ReturnType<Awaited<ReturnType<typeof Agent.create>>["send"]>>,
  writer: WritableStreamDefaultWriter<string>
) {
  const send = (data: object) => writer.write(encode(data));

  for await (const event of run.stream() as AsyncIterable<SDKMessage>) {
    if (event.type === "assistant") {
      for (const block of event.message.content) {
        if (block.type === "text" && block.text) {
          await send({ type: "text", text: block.text });
        }
      }
    } else if (event.type === "tool_call" && event.status === "running") {
      await send({ type: "tool_use", toolName: event.name });
    }
  }

  const result = await run.wait();
  await send({ type: "done", status: result.status });
}

export async function POST(req: NextRequest) {
  const { message, agentId } = (await req.json()) as {
    message: string;
    agentId?: string;
  };

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), { status: 400 });
  }

  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "CURSOR_API_KEY not configured" }), { status: 500 });
  }

  const stream = new TransformStream<string, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(new TextEncoder().encode(chunk));
    },
  });
  const writer = stream.writable.getWriter();

  const send = (data: object) => writer.write(encode(data));

  // Run agent async — stream result back via SSE
  (async () => {
    try {
      const mcpServers = buildMcpServers();

      if (agentId) {
        await using agent = await Agent.resume(agentId, { apiKey, mcpServers });
        await send({ type: "agent_id", agentId });
        const run = await agent.send(message);
        await streamRun(run, writer);
      } else {
        await using agent = await Agent.create({
          apiKey,
          model: { id: "composer-2.5" },
          local: { cwd: REPO_ROOT, settingSources: [] },
          mcpServers,
        });
        await send({ type: "agent_id", agentId: agent.agentId });
        const run = await agent.send(message);
        await streamRun(run, writer);
      }
    } catch (err) {
      if (err instanceof CursorAgentError) {
        await send({ type: "error", message: err.message, retryable: err.isRetryable });
      } else {
        await send({ type: "error", message: String(err) });
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
