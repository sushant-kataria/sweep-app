import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { addNode, editNode, deleteNode, getCanvas } from "../db/supabase.js";

export function registerCanvasTools(server: McpServer) {
  // ── get_canvas ─────────────────────────────────────────────────────────────
  server.tool(
    "get_canvas",
    "Get the current state of the orchestration canvas — all nodes and connections.",
    { session_id: z.string().describe("Canvas session identifier") },
    async ({ session_id }) => {
      const canvas = await getCanvas(session_id);
      const summary = [
        `Canvas: ${canvas.nodes.length} nodes, ${canvas.connections.length} connections`,
        "",
        "Nodes:",
        ...canvas.nodes.map((n) => `  [${n.id}] "${n.text || "(empty)"}"`),
        "",
        "Connections (port2→port1):",
        ...canvas.connections.map((c) => `  ${c.from_node_id} → ${c.to_node_id}  (id: ${c.id})`),
      ].join("\n");

      return { content: [{ type: "text", text: summary }] };
    }
  );

  // ── add_node ───────────────────────────────────────────────────────────────
  server.tool(
    "add_node",
    "Add a new node (text box) to the canvas.",
    {
      session_id: z.string(),
      text: z.string().describe("The content of the node"),
      x: z.number().optional().describe("X position (default 100)"),
      y: z.number().optional().describe("Y position (default 100)"),
    },
    async ({ session_id, text, x, y }) => {
      const node = await addNode(session_id, text, x, y);
      return {
        content: [{
          type: "text",
          text: `Node added. ID: ${node.id}\nText: "${node.text}"\nPosition: (${node.x}, ${node.y})`,
        }],
      };
    }
  );

  // ── edit_node ──────────────────────────────────────────────────────────────
  server.tool(
    "edit_node",
    "Edit the text content of an existing node.",
    {
      session_id: z.string(),
      node_id: z.string().describe("The ID of the node to edit"),
      text: z.string().describe("New text content"),
    },
    async ({ session_id, node_id, text }) => {
      const node = await editNode(session_id, node_id, text);
      return {
        content: [{ type: "text", text: `Node ${node.id} updated. New text: "${node.text}"` }],
      };
    }
  );

  // ── delete_node ────────────────────────────────────────────────────────────
  server.tool(
    "delete_node",
    "Delete a node and all its connections from the canvas.",
    {
      session_id: z.string(),
      node_id: z.string().describe("The ID of the node to delete"),
    },
    async ({ session_id, node_id }) => {
      await deleteNode(session_id, node_id);
      return {
        content: [{ type: "text", text: `Node ${node_id} and its connections have been deleted.` }],
      };
    }
  );
}
