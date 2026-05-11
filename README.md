# @modusop/mcp-server

Stdio→HTTP proxy for **[Modus Brain](https://brain.modusop.app)** — gives any MCP-aware AI client (Claude Desktop, Cursor, Cline, Continue.dev, etc.) access to your ModusOp organisation's knowledge base.

## What it does

This package is a thin proxy. It speaks the MCP stdio transport on one end and forwards every JSON-RPC request to Modus Brain's HTTP MCP endpoint on the other.

**All tool implementations live in Modus Brain itself** — when ModusOp ships a new Brain tool, every install of this package picks it up automatically on the next request. No re-publish, no version bump, no user action needed.

If your AI client speaks remote HTTP MCP natively, you don't need this package at all — point it directly at `https://brain.modusop.app/mcp`. This package exists for clients that only speak stdio.

## Setup

### 1. Get a Brain token

Sign in at [brain.modusop.app](https://brain.modusop.app), generate a token labelled for the device or person who'll use it, copy the plaintext value (you only see it once).

### 2. Add to your AI client's MCP config

**Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "modusop-brain": {
      "command": "npx",
      "args": ["-y", "@modusop/mcp-server"],
      "env": {
        "MODUSOP_API_TOKEN": "mo_brain_..."
      }
    }
  }
}
```

**Cursor / Cline / Continue.dev** — `.cursor/mcp.json` (or the equivalent):

```json
{
  "mcpServers": {
    "modusop-brain": {
      "command": "npx",
      "args": ["-y", "@modusop/mcp-server"],
      "env": {
        "MODUSOP_API_TOKEN": "mo_brain_..."
      }
    }
  }
}
```

### 3. Restart your client

Quit and reopen. The Modus Brain tools should appear in the MCP indicator within a few seconds.

## Env vars

| Variable | Required | Default | Notes |
|---|---|---|---|
| `MODUSOP_API_TOKEN` | yes | — | Brain token from brain.modusop.app |
| `MODUSOP_BRAIN_URL` | no | `https://brain.modusop.app/mcp` | Override only for local Brain development |

## Available tools

Whatever Brain exposes — `tools/list` reflects the current set. As of v1.0.0:

- `whoami` — identify the user + org this token is scoped to
- `search_knowledge` — semantic search over the org KB
- `get_chunk` — deep-dive on a specific search result
- `list_recent` — recently indexed KB items
- `get_client_brief` — synthesised client one-pager
- `add_observation` — append a note
- `add_decision` — record context + decision + rationale
- `link_observation` — typed link between two chunks
- `request_delete` — admin-gated removal

## Migrating from 0.x

Versions 0.x of this package implemented tools in-package and talked to ModusOp's older `/api/mcp` endpoint with an MO API token from `/settings/api-tokens`. v1.0.0 retires that path:

- Generate a new **Brain** token at [brain.modusop.app](https://brain.modusop.app), not an MO API token
- Replace the value of `MODUSOP_API_TOKEN` with the new token
- No other config change needed — same `command`, same `args`, same env var name

Old tools (`search_projects`, `search_clients`, `get_client_context`, `start_timer`, etc.) are no longer present in this package's catalogue. They've been retired in favour of Brain's tools, which cover the same surface plus knowledge-base search and append-writes. If you need the old tool set, pin to `@modusop/mcp-server@0.2.5` — it still works but won't receive updates.

## Local development

```bash
git clone https://github.com/jwwd-repos/modusop-mcp.git
cd modusop-mcp
npm install
MODUSOP_API_TOKEN=... npm run dev
```

The proxy reads JSON-RPC on stdin and writes responses on stdout, so test it manually with:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"whoami"}}' \
  | MODUSOP_API_TOKEN=... npm run dev
```

## Licence

See `LICENSE.md`.
