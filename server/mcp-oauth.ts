import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const MCP_ISSUER = "https://namina.biz.id";
export const MCP_RESOURCE = MCP_ISSUER + "/api/mcp";
export const MCP_METADATA = MCP_ISSUER + "/.well-known/oauth-protected-resource/api/mcp";
export const MCP_SCOPES = ["namina:read", "namina:draft"] as const;
export type McpScope = typeof MCP_SCOPES[number];
type AuthMethod = "none" | "client_secret_post" | "client_secret_basic";
export type RegisteredClient = { redirect: string; method: AuthMethod; nonce: string };

export function validRedirect(value: string) {
  return value === "https://claude.ai/api/mcp/auth_callback"
    || value === "https://chatgpt.com/connector_platform_oauth_redirect"
    || /^https:\/\/chatgpt\.com\/connector\/oauth\/[A-Za-z0-9_-]{1,200}$/.test(value);
}
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const pkce = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");
export const validVerifier = (value: string) => /^[A-Za-z0-9._~-]{43,128}$/.test(value);
export const validChallenge = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value);
function mac(key: string, value: string) {
  if (Buffer.byteLength(key) < 32) throw new Error("OAuth secret not configured");
  return createHmac("sha256", key).update(value).digest("base64url");
}
export function equal(a: string, b: string) {
  const aa=Buffer.from(a), bb=Buffer.from(b);
  return aa.length===bb.length && timingSafeEqual(aa,bb);
}
export function registerClient(key: string, redirect: string, method: AuthMethod) {
  if (!validRedirect(redirect) || !["none","client_secret_post","client_secret_basic"].includes(method)) throw new Error("Unsupported registration");
  const payload=Buffer.from(JSON.stringify({redirect,method,nonce:randomBytes(16).toString("hex")})).toString("base64url");
  const id=payload+"."+mac(key,"client:"+payload);
  return { client_id:id, ...(method==="none"?{}:{client_secret:mac(key,"secret:"+id)}), redirect_uris:[redirect], token_endpoint_auth_method:method, grant_types:["authorization_code"], response_types:["code"] };
}
export function decodeClient(key: string, id: string): RegisteredClient | null {
  try {
    if (id.length>1400) return null;
    const [payload,signature,...rest]=id.split(".");
    if (!payload||!signature||rest.length||!equal(signature,mac(key,"client:"+payload))) return null;
    const c=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as RegisteredClient;
    return validRedirect(c.redirect)&&["none","client_secret_post","client_secret_basic"].includes(c.method)&&/^[a-f0-9]{32}$/.test(c.nonce)?c:null;
  } catch {return null;}
}
export function validateClientSecret(key:string,id:string,client:RegisteredClient,provided:string|undefined,method:AuthMethod) {
  return client.method===method && (method==="none" ? provided===undefined : typeof provided==="string" && equal(provided,mac(key,"secret:"+id)));
}
export function parseRequestedScope(value: string | null): McpScope | null {
  const scopes=(value||"namina:read").trim().split(/\s+/);
  if (!scopes.every(s=>s==="namina:read"||s==="namina:draft")) return null;
  return scopes.includes("namina:draft")?"namina:draft":"namina:read";
}
export function oauthMetadata() {
  return { issuer:MCP_ISSUER, authorization_endpoint:MCP_ISSUER+"/api/mcp-oauth?action=authorize",
    token_endpoint:MCP_ISSUER+"/api/mcp-oauth?action=token", registration_endpoint:MCP_ISSUER+"/api/mcp-oauth?action=register",
    response_types_supported:["code"], grant_types_supported:["authorization_code"],
    token_endpoint_auth_methods_supported:["none","client_secret_post","client_secret_basic"],
    code_challenge_methods_supported:["S256"], scopes_supported:MCP_SCOPES };
}
export function resourceMetadata() {
  return {resource:MCP_RESOURCE,authorization_servers:[MCP_ISSUER],scopes_supported:MCP_SCOPES,bearer_methods_supported:["header"]};
}
