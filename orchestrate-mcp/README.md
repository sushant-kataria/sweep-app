# Orchestrate MCP

An MCP server that gives Claude a visual reasoning canvas — add nodes, connect them into reasoning chains, and synthesize the result.

## Tools exposed to Claude

| Tool | Description |
|------|-------------|
| `get_canvas` | View all nodes and connections |
| `add_node` | Add a text node to the canvas |
| `edit_node` | Edit a node's content |
| `delete_node` | Remove a node and its connections |
| `connect_nodes` | Link port 2 (output) of one node to port 1 (input) of another |
| `disconnect_nodes` | Remove a connection by ID |
| `run_orchestration` | Synthesize the full canvas into a coherent result |

## Setup

### 1. Clone and install
```bash
git clone https://github.com/sushant-kataria/orchestrate-mcp
cd orchestrate-mcp
npm install
```

### 2. Supabase
1. Create a project at supabase.com
2. Run `supabase/schema.sql` in the SQL editor
3. Copy your project URL and service role key

### 3. Environment
```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
```

### 4. Local test with Claude Desktop
```bash
npm run dev
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "orchestrate": {
      "command": "node",
      "args": ["/absolute/path/to/orchestrate-mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_SERVICE_KEY": "...",
        "ANTHROPIC_API_KEY": "..."
      }
    }
  }
}
```

### 5. Deploy to Cloudflare Workers
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put ANTHROPIC_API_KEY
npm run deploy
```

### 6. Add to Claude.ai
Settings → Integrations → Add MCP Server
URL: `https://orchestrate-mcp.YOUR_SUBDOMAIN.workers.dev/sse`

## How connections work

- **Port 1** (input, left side): receives context from the previous node
- **Port 2** (output, right side): sends context forward to the next node
- Connecting B→A means A's content is the **premise**, B's content is the **conclusion**
- `run_orchestration` walks this chain in topological order and synthesizes everything

## Session IDs

Every tool call requires a `session_id` — use any string (e.g. `"my-project"`, `"research-jan-2025"`). Each session has its own isolated canvas. Share the same session_id across calls to work on the same canvas.
