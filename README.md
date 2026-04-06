# ModusOp MCP Server

MCP server for [ModusOp](https://modusop.app) — gives AI assistants access to your client context, tasks, time tracking, and retainer budgets.

## Tools

| Tool | Description |
|------|-------------|
| `get_client_context` | Get project, client, and retainer info |
| `get_tasks` | List tasks for a project (filter by status) |
| `create_task` | Create a new task |
| `start_timer` | Start a timer on a task |
| `stop_timer` | Stop the running timer |
| `get_retainer_status` | Check retainer hours used/remaining |

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
