import { test } from "node:test";
import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import handler from "../api/mcp.js";

test("MCP preview fails closed and requires authentication", async () => {
  const saved = { ...process.env };
  const request = { method: "POST", headers: {}, body: { jsonrpc: "2.0", id: 1, method: "tools/list" } } as unknown as IncomingMessage;
  let status = 0;
  const response = { setHeader() {}, set statusCode(value: number) { status = value; }, end() {} } as unknown as ServerResponse;
  try {
    delete process.env.NAMINA_MCP_ENABLED;
    await handler(request, response);
    assert.equal(status, 503);
    process.env.NAMINA_MCP_ENABLED = "true";
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-key";
    await handler(request, response);
    assert.equal(status, 401);
  } finally {
    for (const name of ["NAMINA_MCP_ENABLED", "VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"]) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  }
});
