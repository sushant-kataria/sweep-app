-- Run this in your Supabase SQL editor

create table if not exists sessions (
  id text primary key,
  created_at timestamptz default now()
);

create table if not exists nodes (
  id text primary key,
  session_id text references sessions(id) on delete cascade,
  text text not null default '',
  x float8 not null default 100,
  y float8 not null default 100,
  created_at timestamptz default now()
);

create table if not exists connections (
  id text primary key,
  session_id text references sessions(id) on delete cascade,
  from_node_id text references nodes(id) on delete cascade,
  to_node_id text references nodes(id) on delete cascade,
  created_at timestamptz default now(),
  unique(from_node_id, to_node_id)
);

create index if not exists nodes_session_idx on nodes(session_id);
create index if not exists connections_session_idx on connections(session_id);
