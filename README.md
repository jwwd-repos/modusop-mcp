# ModusOp MCP Server

MCP server for [ModusOp](https://modusop.app) — gives AI assistants access to your client context, tasks, time tracking, and retainer budgets.

## Tools

| Tool | Description |
|------|-------------|
| `search_projects` | Search projects by name |
| `search_clients` | Search clients by name |
| `get_client_context` | Get project, client, and retainer info |
| `get_tasks` | List tasks for a project (filter by status) |
| `create_task` | Create a new task |
| `start_timer` | Start a timer on a task |
| `stop_timer` | Stop the running timer |
| `get_retainer_status` | Check retainer hours used/remaining |

## Required Token Scopes

When you create an API token in ModusOp → Settings → API Tokens, grant these scopes:

- **`read`** — needed for `search_projects`, `search_clients`, `get_client_context`, `get_tasks`, `get_retainer_status`, and the current-timer check used by `stop_timer`.
- **`write`** — needed for `create_task`, `start_timer`, and `stop_timer`.

A token missing the required scope returns HTTP 403 with `Insufficient permissions for this action.`. Most setups want both scopes.

## Setup

### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "modusop": {
      "command": "npx",
      "args": ["@modusop/mcp-server"],
      "env": {
        "MODUSOP_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "modusop": {
      "command": "npx",
      "args": ["@modusop/mcp-server"],
      "env": {
        "MODUSOP_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add modusop -- npx @modusop/mcp-server
```

Set `MODUSOP_API_TOKEN` in your environment.

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `MODUSOP_API_TOKEN` | (required) | Your ModusOp API token |
| `MODUSOP_API_URL` | `https://modusop.app/api/v1` | API base URL |

## Requirements

- A [ModusOp](https://modusop.app) account with an API token
- Node.js 18+
