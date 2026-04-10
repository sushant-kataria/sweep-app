import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerCanvasTools } from "../src/tools/canvas.js";
import { registerConnectTools } from "../src/tools/connect.js";
import { registerOrchestrateTools } from "../src/tools/orchestrate.js";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ANTHROPIC_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Inject env into process.env for compatibility
    process.env.SUPABASE_URL = env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
    process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", server: "orchestrate-mcp", version: "1.0.0" });
    }

    // MCP SSE endpoint
    if (url.pathname === "/sse") {
      const server = new McpServer({
        name: "orchestrate",
        version: "1.0.0",
      });

      registerCanvasTools(server);
      registerConnectTools(server);
      registerOrchestrateTools(server);

      const { readable, writable } = new TransformStream();
      const transport = new SSEServerTransport("/message", writable);
      await server.connect(transport);

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // MCP message endpoint
    if (url.pathname === "/message" && request.method === "POST") {
      // Transport handles this via the SSE connection
      return Response.json({ error: "Use /sse endpoint to establish connection first" }, { status: 400 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
