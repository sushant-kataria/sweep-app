import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { connectNodes, disconnectNodes } from "../db/supabase.js";

export function registerConnectTools(server: McpServer) {
  // ── connect_nodes ──────────────────────────────────────────────────────────
  server.tool(
    "connect_nodes",
    "Connect two nodes. The 'from' node's port 2 (output) feeds into the 'to' node's port 1 (input). This defines the reasoning order: from-node context comes BEFORE to-node context.",
    {
      session_id: z.string(),
      from_node_id: z.string().describe("The source node ID (port 2 / output side)"),
      to_node_id: z.string().describe("The target node ID (port 1 / input side)"),
    },
    async ({ session_id, from_node_id, to_node_id }) => {
      const conn = await connectNodes(session_id, from_node_id, to_node_id);
      return {
        content: [{
          type: "text",
          text: `Connected: ${from_node_id} → ${to_node_id}\nConnection ID: ${conn.id}\nMeaning: "${from_node_id}" provides context that flows into "${to_node_id}"`,
        }],
      };
    }
  );

  // ── disconnect_nodes ───────────────────────────────────────────────────────
  server.tool(
    "disconnect_nodes",
    "Remove a connection between two nodes using the connection ID.",
    {
      session_id: z.string(),
      connection_id: z.string().describe("The connection ID to remove (get from get_canvas)"),
    },
    async ({ session_id, connection_id }) => {
      await disconnectNodes(session_id, connection_id);
      return {
        content: [{ type: "text", text: `Connection ${connection_id} removed.` }],
      };
    }
  );
}
