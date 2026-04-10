export interface Node {
  id: string;
  session_id: string;
  text: string;
  x: number;
  y: number;
  created_at: string;
}

export interface Connection {
  id: string;
  session_id: string;
  from_node_id: string;  // port 2 (output) side
  to_node_id: string;    // port 1 (input) side
  created_at: string;
}

export interface Canvas {
  session_id: string;
  nodes: Node[];
  connections: Connection[];
}

export interface OrchestrationResult {
  synthesis: string;
  chain_order: string[];
  node_count: number;
  connection_count: number;
}
