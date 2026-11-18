import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { siteDocumentSchema, prepareSite } from "../src/static/sites.js";

type Request = IncomingMessage & { body?: unknown };
const versions = ["2025-11-25", "2025-06-18", "2025-03-26"];
const tools = [
  { name: "list_websites", description: "List websites in your own NAMINA workspace.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true } },
  { name: "get_website", description: "Read your own website draft.", inputSchema: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"], additionalProperties: false }, annotations: { readOnlyHint: true } },
  { name: "update_draft", description: "Save a complete validated website document without publishing. Use the updated_at value from get_website to avoid overwriting concurrent edits.", inputSchema: { type: "object", properties: { id: { type: "string", format: "uuid" }, updated_at: { type: "string" }, document: { type: "object" } }, required: ["id", "updated_at", "document"], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: true } },
];
const envelope = z.object({ jsonrpc: z.literal("2.0"), id: z.union([z.string(), z.number()]).optional(), method: z.string(), params: z.record(z.string(), z.unknown()).optional() });
const idArgs = z.object({ id: z.uuid() }).strict();
const updateArgs = idArgs.extend({ updated_at: z.iso.datetime({ offset: true }), document: siteDocumentSchema }).strict();

export default async function handler(req: Request, res: ServerResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  function send(status: number, body?: unknown) {
    res.statusCode = status;
    res.end(body === undefined ? undefined : JSON.stringify(body));
  }
  if (process.env.NAMINA_MCP_ENABLED !== "true") return send(503, { error: "MCP preview disabled" });
  const origin = req.headers.origin;
  if (origin && origin !== "https://namina.biz.id") return send(403, { error: "Origin denied" });
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return send(503, { error: "MCP unavailable" });
  const bearer = req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!bearer) { res.setHeader("WWW-Authenticate", "Bearer"); return send(401, { error: "Authentication required" }); }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: "Bearer " + bearer } } });
  try {
    const { data: auth, error: authError } = await db.auth.getUser(bearer);
    if (authError || !auth.user) return send(401, { error: "Invalid session" });
    const { data: workspace, error: workspaceError } = await db.from("namina_business_workspaces").select("id,subscription_status").eq("owner_id", auth.user.id).maybeSingle();
    if (workspaceError || !workspace || workspace.subscription_status === "suspended") return send(403, { error: "Workspace unavailable" });
    const session = await db.rpc("namina_business_session_valid", { p_workspace_id: workspace.id });
    if (session.error || session.data !== true) return send(403, { error: "Session revoked or invalid" });
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(405); }
    let body: unknown;
    try {
      if (req.body !== undefined) {
        const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        if (Buffer.byteLength(raw) > 300000) return send(413);
        body = JSON.parse(raw);
      } else {
        const chunks: Buffer[] = []; let length = 0;
        for await (const chunk of req) {
          const b = Buffer.from(chunk); length += b.length;
          if (length > 300000) return send(413);
          chunks.push(b);
        }
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      }
    } catch { return send(400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); }
    const parsed = envelope.safeParse(body);
    if (!parsed.success) return send(400, { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } });
    const { id, method, params } = parsed.data;
    if (id === undefined) return send(202);
    const result = (value: unknown) => send(200, { jsonrpc: "2.0", id, result: value });
    const fail = (code: number, message: string) => send(200, { jsonrpc: "2.0", id, error: { code, message } });
    const content = (value: unknown, isError = false) => result({ content: [{ type: "text", text: JSON.stringify(value) }], isError });
    if (method === "initialize") {
      const version = versions.find(v => v === params?.protocolVersion) || versions[0];
      return result({ protocolVersion: version, capabilities: { tools: {} }, serverInfo: { name: "namina-partner-preview", version: "0.1.0" } });
    }
    if (method === "ping") return result({});
    if (method === "tools/list") return result({ tools });
    if (method !== "tools/call") return fail(-32601, "Method not found");
    if (params?.name === "list_websites") {
      if (!z.object({}).strict().safeParse(params.arguments ?? {}).success) return fail(-32602, "Invalid arguments");
      const response = await db.from("namina_business_sites").select("id,slug,updated_at,published_sha").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(100);
      return response.error ? content({ error: "Unable to list websites" }, true) : content(response.data);
    }
    if (params?.name === "get_website") {
      const args = idArgs.safeParse(params.arguments);
      if (!args.success) return fail(-32602, "Invalid arguments");
      const response = await db.from("namina_business_sites").select("id,slug,document,updated_at,published_sha").eq("workspace_id", workspace.id).eq("id", args.data.id).maybeSingle();
      return response.error || !response.data ? content({ error: "Website unavailable" }, true) : content(response.data);
    }
    if (params?.name === "update_draft") {
      const args = updateArgs.safeParse(params.arguments);
      if (!args.success) return fail(-32602, "Invalid arguments or site document");
      const document = siteDocumentSchema.parse(prepareSite(args.data.document));
      if (Buffer.byteLength(JSON.stringify(document)) > 245000) return content({ error: "Document too large" }, true);
      const response = await db.from("namina_business_sites").update({ document, updated_at: new Date().toISOString() }).eq("workspace_id", workspace.id).eq("id", args.data.id).eq("slug", document.slug).eq("updated_at", args.data.updated_at).select("id,slug,updated_at").maybeSingle();
      return response.error || !response.data ? content({ error: "Draft unavailable or changed; reload before retrying" }, true) : content(response.data);
    }
    return fail(-32602, "Unknown tool");
  } catch {
    return send(503, { error: "MCP request failed" });
  }
}
