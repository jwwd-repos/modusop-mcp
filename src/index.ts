#!/usr/bin/env node
/**
 * ModusOp MCP — stdio→HTTP proxy for Modus Brain.
 *
 * v1.0.0 retired the in-package tool implementations and turned this
 * package into a transparent proxy: every JSON-RPC message coming in
 * over stdio is forwarded to https://brain.modusop.app/mcp (or whatever
 * MODUSOP_BRAIN_URL points at) with the Brain token in the
 * Authorization header. The HTTP response is then written back to
 * stdout as a JSON-RPC reply.
 *
 * The point: tools live in one place (the Laravel app). Adding a new
 * tool there means every npm install of this package picks it up on
 * the very next request — no version bump, no re-publish, no user
 * action needed.
 *
 * For IDE clients that don't yet speak remote HTTP MCP (older Claude
 * Desktop, some Cursor / Cline builds), keep your existing
 * `npx @modusop/mcp-server` config — it'll proxy the same set of
 * tools your remote-HTTP-aware clients see, just via a stdio bridge.
 *
 * Env vars:
 *   MODUSOP_BRAIN_URL   (optional) — defaults to https://brain.modusop.app/mcp
 *   MODUSOP_API_TOKEN   (required) — Brain token from brain.modusop.app
 */

import * as readline from 'node:readline';

const BRAIN_URL = process.env.MODUSOP_BRAIN_URL || 'https://brain.modusop.app/mcp';
const TOKEN = process.env.MODUSOP_API_TOKEN;

function die(message: string, code = 1): never {
  process.stderr.write(`[modusop-mcp] ${message}\n`);
  process.exit(code);
}

if (!TOKEN) {
  die('MODUSOP_API_TOKEN is required. Generate one at https://brain.modusop.app/brain');
}

interface JsonRpcMessage {
  jsonrpc?: '2.0';
  id?: string | number | null;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

async function forward(line: string): Promise<void> {
  let msg: JsonRpcMessage;
  try {
    msg = JSON.parse(line);
  } catch {
    // Malformed input — emit a parse-error reply with id=null per JSON-RPC spec.
    writeOut({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: invalid JSON' },
    });
    return;
  }

  // Notifications (no id) are fire-and-forget — no reply expected.
  const isNotification = msg.id === undefined || msg.id === null;

  try {
    const res = await fetch(BRAIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: line,
    });

    // 202 No Content for notifications — nothing to relay.
    if (res.status === 202) return;

    const text = await res.text();
    if (!text) {
      if (!isNotification) {
        writeOut({
          jsonrpc: '2.0',
          id: msg.id ?? null,
          error: { code: -32603, message: `Empty response from Brain (HTTP ${res.status})` },
        });
      }
      return;
    }

    // Pass the upstream response through verbatim — keeps any structured
    // error codes, content arrays, etc., exactly as Brain emitted them.
    process.stdout.write(text + '\n');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isNotification) {
      writeOut({
        jsonrpc: '2.0',
        id: msg.id ?? null,
        error: { code: -32603, message: `Brain fetch failed: ${message}` },
      });
    }
  }
}

function writeOut(msg: JsonRpcMessage): void {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

// Track in-flight forwards so we don't exit on stdin EOF before they
// finish — readline's 'close' fires the instant the parent closes its
// write end, which can be before fetch() resolves.
const pending = new Set<Promise<void>>();
let stdinClosed = false;

const rl = readline.createInterface({
  input: process.stdin,
  // Don't pipe to stdout — we manage stdout manually to avoid echo loops.
  terminal: false,
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (trimmed === '') return;
  const p = forward(trimmed).finally(() => pending.delete(p));
  pending.add(p);
});

rl.on('close', () => {
  stdinClosed = true;
  drainAndExit();
});

async function drainAndExit(): Promise<void> {
  if (pending.size > 0) {
    await Promise.allSettled(pending);
  }
  process.exit(0);
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
