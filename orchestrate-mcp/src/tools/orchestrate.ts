import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Anthropic from "@anthropic-ai/sdk";
import { getCanvas, buildChainOrder } from "../db/supabase.js";
import { OrchestrationResult } from "../types.js";

export function registerOrchestrateTools(server: McpServer) {
  server.tool(
    "run_orchestration",
    "Synthesize all nodes in the canvas into a coherent result. Follows the connection chain order so earlier nodes provide context for later ones. Returns a full synthesis.",
    {
      session_id: z.string(),
      focus: z.string().optional().describe("Optional: specific question or goal to focus the synthesis on"),
    },
    async ({ session_id, focus }) => {
      const canvas = await getCanvas(session_id);

      if (canvas.nodes.length === 0) {
        return { content: [{ type: "text", text: "Canvas is empty. Add some nodes first." }] };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

      const client = new Anthropic({ apiKey });

      // Build ordered chain
      const order = buildChainOrder(canvas);
      const nodeMap = Object.fromEntries(canvas.nodes.map((n) => [n.id, n]));

      const chainText = order
        .map((id, i) => {
          const node = nodeMap[id];
          return node ? `Step ${i + 1}: ${node.text || "(empty)"}` : null;
        })
        .filter(Boolean)
        .join("\n");

      const connectionText = canvas.connections
        .map((c) => {
          const f = nodeMap[c.from_node_id]?.text?.slice(0, 30) || c.from_node_id;
          const t = nodeMap[c.to_node_id]?.text?.slice(0, 30) || c.to_node_id;
          return `  "${f}" → "${t}"`;
        })
        .join("\n");

      const prompt = [
        "You are an AI orchestrator synthesizing a reasoning canvas.",
        focus ? `\nUser focus: ${focus}\n` : "",
        "\nNode chain (in reasoning order):",
        chainText,
        "\nConnections (showing flow direction):",
        connectionText || "  None — all nodes are isolated",
        "\nInstructions: Synthesize all nodes into a coherent, insightful response.",
        "Treat the chain order as the reasoning flow. Earlier nodes provide premises/context for later ones.",
        "Identify key themes, answer implied questions, surface conclusions, and note any gaps or contradictions.",
      ].join("\n");

      const message = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const synthesis = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");

      const result: OrchestrationResult = {
        synthesis,
        chain_order: order,
        node_count: canvas.nodes.length,
        connection_count: canvas.connections.length,
      };

      return {
        content: [{
          type: "text",
          text: [
            `Orchestration complete. ${result.node_count} nodes, ${result.connection_count} connections.`,
            `Chain order: ${result.chain_order.join(" → ")}`,
            "",
            "─── Synthesis ───────────────────────────────",
            result.synthesis,
          ].join("\n"),
        }],
      };
    }
  );
}
