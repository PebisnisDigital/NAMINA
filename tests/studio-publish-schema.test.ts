import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import test from "node:test";
import handler from "../api/studio.ts";
import { viniSeed } from "../src/static/sites.ts";

async function invoke(action: string, body: unknown, cookie = "") {
  const state = { statusCode: 200, body: "", headers: {} as Record<string, string> };
  const response = {
    setHeader(name: string, value: string) { state.headers[name] = value; return response; },
    end(value: string) { state.body = value; return response; },
    get statusCode() { return state.statusCode; },
    set statusCode(value: number) { state.statusCode = value; },
  } as unknown as ServerResponse;
  await handler({
    method: "POST", url: `/api/studio?action=${action}`, body,
    headers: { origin: "https://namina.example", host: "namina.example", cookie },
  } as unknown as IncomingMessage, response);
  return { ...state, body: JSON.parse(state.body) };
}

test("admin publishes every Studio presentation, preserves it, and rejects invalid document fields", async () => {
  const config = {
    NAMANA_ADMIN_PASSWORD: "test-only-admin-password",
    NAMANA_SESSION_SECRET: "test-only-session-secret-with-32-characters",
    NAMANA_GITHUB_TOKEN: "test-only-github-token",
    NAMANA_GITHUB_BRANCH: "main",
    VITE_SUPABASE_URL: "https://database.example",
    SUPABASE_SERVICE_ROLE_KEY: "test-only-service-role-key",
  };
  const originalEnv = Object.fromEntries(Object.keys(config).map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const stored: unknown[] = [];
  let calls = 0;
  Object.assign(process.env, config);
  globalThis.fetch = async (input, init) => {
    calls++;
    const url = new URL(String(input));
    if (url.hostname === "api.github.com") {
      assert.equal(init?.method || "GET", "GET");
      return Response.json({ message: "Not Found" }, { status: 404 });
    }
    assert.equal(url.origin, config.VITE_SUPABASE_URL);
    if (init?.method === "POST") {
      assert.equal(url.pathname, "/rest/v1/namina_published_sites");
      stored.push(JSON.parse(String(init.body)).document);
      return Response.json({ revision: 1 }, { status: 201 });
    }
    assert.ok(["/rest/v1/namina_published_sites", "/rest/v1/namina_business_sites"].includes(url.pathname));
    return Response.json(null);
  };
  try {
    const login = await invoke("login", { password: config.NAMANA_ADMIN_PASSWORD });
    assert.equal(login.statusCode, 200);
    const cookie = login.headers["Set-Cookie"].split(";")[0];
    for (const presentation of [undefined, "original", "original-white", "doctor", "chibi", "wedding"] as const) {
      const document = { ...structuredClone(viniSeed), slug: "publish-schema-test", ...(presentation ? { presentation } : {}) };
      const result = await invoke("publish", { document, sha: null }, cookie);
      assert.equal(result.statusCode, 200, JSON.stringify(result.body));
      assert.equal(result.body.mode, "database");
      assert.equal(result.body.sha, "db:1");
      assert.deepEqual(stored.at(-1), JSON.parse(JSON.stringify(document)));
    }
    for (const invalid of [
      { ...structuredClone(viniSeed), presentation: "unknown-template" },
      { ...structuredClone(viniSeed), unexpected: true },
      { ...structuredClone(viniSeed), media: { ...viniSeed.media, portrait: "javascript:alert(1)" } },
    ]) {
      const previousCalls = calls;
      const result = await invoke("publish", { document: invalid, sha: null }, cookie);
      assert.equal(result.statusCode, 400);
      assert.equal(calls, previousCalls, "invalid documents must fail before persistence");
    }
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
