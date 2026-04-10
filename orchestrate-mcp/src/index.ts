import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCanvasTools } from "./tools/canvas.js";
import { registerConnectTools } from "./tools/connect.js";
import { registerOrchestrateTools } from "./tools/orchestrate.js";

const server = new McpServer({
  name: "orchestrate",
  version: "1.0.0",
  description: "AI orchestration canvas — manage nodes, connections, and synthesize reasoning chains",
});

registerCanvasTools(server);
registerConnectTools(server);
registerOrchestrateTools(server);

// stdio transport (for Claude Desktop and local testing)
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Orchestrate MCP server running on stdio");
