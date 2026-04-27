#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { api } from "./api.js";

const server = new McpServer({
  name: "modusop",
  version: "0.2.0",
});

// ── Search Projects ────────────────────────────────────────────

server.tool(
  "search_projects",
  "Search for ModusOp projects by name. Returns matching projects with their IDs, client names, and retainer status.",
  {
    query: z.string().optional().describe("Search term to filter projects by name"),
  },
  async ({ query }) => {
    const params = query
      ? `?search=${encodeURIComponent(query)}&per_page=50`
      : "?per_page=50";
    const data = await api("GET", `/projects${params}`);
    const projects = data?.items ?? data;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  }
);

// ── Search Clients ─────────────────────────────────────────────

server.tool(
  "search_clients",
  "Search for ModusOp clients by name. Returns matching clients with their IDs and contact details.",
  {
    query: z.string().optional().describe("Search term to filter clients by name"),
  },
  async ({ query }) => {
    const params = query
      ? `?search=${encodeURIComponent(query)}&per_page=50`
      : "?per_page=50";
    const data = await api("GET", `/clients${params}`);
    const clients = data?.items ?? data;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(clients, null, 2),
        },
      ],
    };
  }
);

// ── Get Client Context ─────────────────────────────────────────
// Returns linked project, client, and retainer info for a workspace

server.tool(
  "get_client_context",
  "Get the client and project context for a workspace. Returns client details, project info, and retainer status if applicable.",
  {
    project_id: z.number().describe("ModusOp project ID"),
  },
  async ({ project_id }) => {
    const project = await api("GET", `/projects/${project_id}`);

    let client = null;
    if (project.client_id) {
      client = await api("GET", `/clients/${project.client_id}`);
    }

    let retainer = null;
    if (project.client_id) {
      try {
        retainer = await api("GET", `/clients/${project.client_id}/retainer`);
      } catch {
        // No retainer — that's fine
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ project, client, retainer }, null, 2),
        },
      ],
    };
  }
);

// ── Get Tasks ──────────────────────────────────────────────────

server.tool(
  "get_tasks",
  "List tasks for a ModusOp project. Optionally filter by status (open, completed, all).",
  {
    project_id: z.number().describe("ModusOp project ID"),
    status: z
      .enum(["open", "completed", "all"])
      .optional()
      .describe("Filter by task status (default: open)"),
  },
  async ({ project_id, status }) => {
    const effective = status ?? "open";
    const params = effective !== "all" ? `?status=${effective}&per_page=50` : "?per_page=50";
    const data = await api("GET", `/projects/${project_id}/tasks${params}`);
    const tasks = data?.items ?? data;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(tasks, null, 2),
        },
      ],
    };
  }
);

// ── Create Task ────────────────────────────────────────────────

server.tool(
  "create_task",
  "Create a new task in a ModusOp project.",
  {
    project_id: z.number().describe("ModusOp project ID"),
    title: z.string().describe("Task title"),
    priority: z
      .enum(["low", "normal", "high", "urgent"])
      .optional()
      .describe("Task priority (default: normal)"),
  },
  async ({ project_id, title, priority }) => {
    const task = await api("POST", "/tasks", {
      project_id,
      title,
      priority: priority || "normal",
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  }
);

// ── Start Timer ────────────────────────────────────────────────

server.tool(
  "start_timer",
  "Start a time-tracking timer on a specific task.",
  {
    task_id: z.number().describe("Task ID to start timing"),
  },
  async ({ task_id }) => {
    await api("POST", "/time/start", { task_id });

    return {
      content: [
        {
          type: "text" as const,
          text: `Timer started on task ${task_id}.`,
        },
      ],
    };
  }
);

// ── Stop Timer ─────────────────────────────────────────────────

server.tool(
  "stop_timer",
  "Stop the currently running time-tracking timer. Returns the time entry details.",
  {},
  async () => {
    // Check if a timer is running first
    const current = await api("GET", "/time/current");
    if (!current?.is_running) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No timer is currently running.",
          },
        ],
      };
    }

    await api("POST", "/time/stop");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              message: "Timer stopped.",
              task_id: current.task_id,
              project_name: current.project_name,
              started_at: current.started_at,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── Get Retainer Status ────────────────────────────────────────

server.tool(
  "get_retainer_status",
  "Get the retainer budget status for a client — hours used, remaining, and period dates.",
  {
    client_id: z.number().describe("ModusOp client ID"),
  },
  async ({ client_id }) => {
    const retainer = await api("GET", `/clients/${client_id}/retainer`);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(retainer, null, 2),
        },
      ],
    };
  }
);

// ── Start ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
