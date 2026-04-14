const BASE_URL = process.env.MODUSOP_API_URL || "https://modusop.app/api/v1";
const TOKEN = process.env.MODUSOP_API_TOKEN;

export async function api<T = any>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  if (!TOKEN) {
    throw new Error(
      "MODUSOP_API_TOKEN not set. Add it to your MCP server config env."
    );
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    throw new Error("API token is invalid or expired.");
  }
  if (res.status === 403) {
    throw new Error("Insufficient permissions for this action.");
  }

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 500)}`);
  }

  if (!res.ok && !json.success) {
    // Laravel validation errors come as json.message + json.errors
    const message = json.message || json.error || `API error: ${res.status}`;
    const details = json.errors
      ? ": " + Object.values(json.errors).flat().join(", ")
      : "";
    throw new Error(message + details);
  }

  return (json.data ?? json) as T;
}
