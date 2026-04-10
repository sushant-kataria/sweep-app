import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Node, Connection, Canvas } from "../types.js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    client = createClient(url, key);
  }
  return client;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function ensureSession(sessionId: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("sessions")
    .upsert({ id: sessionId }, { onConflict: "id" });
  if (error) throw new Error(`Session error: ${error.message}`);
}

// ── Canvas ────────────────────────────────────────────────────────────────────

export async function getCanvas(sessionId: string): Promise<Canvas> {
  const sb = getSupabase();
  await ensureSession(sessionId);

  const [nodesRes, connsRes] = await Promise.all([
    sb.from("nodes").select("*").eq("session_id", sessionId).order("created_at"),
    sb.from("connections").select("*").eq("session_id", sessionId).order("created_at"),
  ]);

  if (nodesRes.error) throw new Error(nodesRes.error.message);
  if (connsRes.error) throw new Error(connsRes.error.message);

  return {
    session_id: sessionId,
    nodes: nodesRes.data as Node[],
    connections: connsRes.data as Connection[],
  };
}

// ── Nodes ─────────────────────────────────────────────────────────────────────

export async function addNode(
  sessionId: string,
  text: string,
  x = 100,
  y = 100
): Promise<Node> {
  const sb = getSupabase();
  await ensureSession(sessionId);

  const { data, error } = await sb
    .from("nodes")
    .insert({ id: uid(), session_id: sessionId, text, x, y })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Node;
}

export async function editNode(
  sessionId: string,
  nodeId: string,
  text: string
): Promise<Node> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("nodes")
    .update({ text })
    .eq("id", nodeId)
    .eq("session_id", sessionId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Node;
}

export async function deleteNode(
  sessionId: string,
  nodeId: string
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("nodes")
    .delete()
    .eq("id", nodeId)
    .eq("session_id", sessionId);

  if (error) throw new Error(error.message);
}

// ── Connections ───────────────────────────────────────────────────────────────

export async function connectNodes(
  sessionId: string,
  fromNodeId: string,
  toNodeId: string
): Promise<Connection> {
  const sb = getSupabase();

  // Validate both nodes belong to this session
  const { data: nodes } = await sb
    .from("nodes")
    .select("id")
    .eq("session_id", sessionId)
    .in("id", [fromNodeId, toNodeId]);

  if (!nodes || nodes.length < 2) {
    throw new Error("One or both nodes not found in this session");
  }

  const { data, error } = await sb
    .from("connections")
    .insert({ id: uid(), session_id: sessionId, from_node_id: fromNodeId, to_node_id: toNodeId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Connection;
}

export async function disconnectNodes(
  sessionId: string,
  connectionId: string
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .eq("session_id", sessionId);

  if (error) throw new Error(error.message);
}

// ── Orchestration helpers ─────────────────────────────────────────────────────

export function buildChainOrder(canvas: Canvas): string[] {
  const { nodes, connections } = canvas;
  const inDegree: Record<string, number> = {};
  nodes.forEach((n) => { inDegree[n.id] = 0; });
  connections.forEach((c) => { inDegree[c.to_node_id] = (inDegree[c.to_node_id] || 0) + 1; });

  const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const order: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    order.push(curr);
    connections
      .filter((c) => c.from_node_id === curr)
      .forEach((c) => { if (!visited.has(c.to_node_id)) queue.push(c.to_node_id); });
  }

  // Add any isolated nodes
  nodes.forEach((n) => { if (!visited.has(n.id)) order.push(n.id); });
  return order;
}
