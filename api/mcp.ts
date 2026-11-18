import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { MCP_METADATA } from "../server/mcp-oauth.js";
import { siteDocumentSchema, prepareSite } from "../src/static/sites.js";

type Request = IncomingMessage & { body?: unknown };
const versions = ["2025-11-25", "2025-06-18", "2025-03-26"];
const tools = [
  { name: "create_website", description: "Create a private website draft from a complete validated NAMINA document. Does not publish.", inputSchema: { type: "object", properties: { document: { type: "object" } }, required: ["document"], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: false } },
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
  const challenge = process.env.NAMINA_MCP_OAUTH_ENABLED === "true" ? `Bearer resource_metadata="${MCP_METADATA}"` : "Bearer";
  const bearer = req.headers.authorization?.match(/^Bearer (nmn_[A-Za-z0-9_-]{43})$/)?.[1];
  if (!bearer) { res.setHeader("WWW-Authenticate", challenge); return send(401, { error: "NAMINA agent key required" }); }
  const url = process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service || (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== url)) return send(503, { error: "MCP unavailable" });
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const hash=createHash("sha256").update(bearer).digest("hex");
  async function operation(action: string, siteId: string|null=null, document: unknown=null, updatedAt: string|null=null) {
    return db.rpc("namina_mcp_operation",{p_hash:hash,p_action:action,p_id:siteId,p_document:document,p_updated_at:updatedAt});
  }
  try {
    const auth=await operation("authorize");
    if (auth.error) return send(503,{error:"MCP unavailable"});
    if (auth.data?.error==="rate_limit") { res.setHeader("Retry-After","60"); return send(429,{error:"Rate limit"}); }
    if (!["read","draft"].includes(auth.data?.scope)) { res.setHeader("WWW-Authenticate",challenge); return send(401,{error:"Invalid or expired key"}); }
    const scope=auth.data.scope;
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
    if (method === "tools/list") return result({ tools: scope === "read" ? tools.filter(tool => tool.annotations.readOnlyHint) : tools });
    if (method !== "tools/call") return fail(-32601, "Method not found");
    async function respond(action: string, siteId: string|null=null, document: unknown=null, updatedAt: string|null=null) {
      const response=await operation(action,siteId,document,updatedAt);
      if (response.error) return content({error:"Operation failed"},true);
      if (response.data?.error) return content({error:response.data.error},true);
      return content(response.data?.data);
    }
    if (params?.name === "list_websites") {
      if (!z.object({}).strict().safeParse(params.arguments ?? {}).success) return fail(-32602, "Invalid arguments");
      return respond("list");
    }
    if (params?.name === "get_website") {
      const args=idArgs.safeParse(params.arguments);
      if (!args.success) return fail(-32602, "Invalid arguments");
      return respond("get",args.data.id);
    }
    if (params?.name === "update_draft") {
      if (scope!=="draft") return content({error:"Draft editing is not permitted"},true);
      const args=updateArgs.safeParse(params.arguments);
      if (!args.success) return fail(-32602,"Invalid arguments or site document");
      const document=siteDocumentSchema.parse(prepareSite(args.data.document));
      if (Buffer.byteLength(JSON.stringify(document))>245000) return content({error:"Document too large"},true);
      return respond("update",args.data.id,document,args.data.updated_at);
    }
    if (params?.name === "create_website") {
      if (scope!=="draft") return content({error:"Draft creation is not permitted"},true);
      const args=z.object({document:siteDocumentSchema}).strict().safeParse(params.arguments);
      if (!args.success) return fail(-32602,"Invalid site document");
      const document=siteDocumentSchema.parse(prepareSite(args.data.document));
      if (Buffer.byteLength(JSON.stringify(document))>245000) return content({error:"Document too large"},true);
      return respond("create",null,document);
    }
    return fail(-32602, "Unknown tool");
  } catch {
    return send(503, { error: "MCP request failed" });
  }
}
