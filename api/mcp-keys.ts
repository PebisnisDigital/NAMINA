import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }).strict(),
  z.object({ action: z.literal("create"), label: z.string().trim().min(1).max(80), scope: z.enum(["read","draft"]) }).strict(),
  z.object({ action: z.literal("revoke"), id: z.uuid() }).strict(),
]);
export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const send = (status: number, body: unknown) => { res.statusCode=status; res.end(JSON.stringify(body)); };
  if (process.env.NAMINA_MCP_ENABLED !== "true") return send(503, { error: "AI Connect belum diaktifkan." });
  if (req.method !== "POST") return send(405, { error: "Metode ditolak." });
  const origin = req.headers.origin;
  try {
    if (!origin || new URL(origin).host !== req.headers.host || new URL(origin).protocol !== "https:") return send(403, { error: "Origin ditolak." });
  } catch { return send(403, { error: "Origin ditolak." }); }
  const bearer = req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!bearer) return send(401, { error: "Masuk ke Studio dahulu." });
  const url=process.env.VITE_SUPABASE_URL, anon=process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service || (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== url)) return send(503, { error: "AI Connect belum siap." });
  try {
    const raw=typeof req.body==="string"?req.body:JSON.stringify(req.body ?? {});
    if (Buffer.byteLength(raw)>4096) return send(413, { error: "Data terlalu besar." });
    const parsed=schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return send(400, { error: "Data tidak valid." });
    const data=parsed.data;
    const userDb=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+bearer}}});
    const serverDb=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
    const auth=await userDb.auth.getUser(bearer);
    if (auth.error || !auth.data.user) return send(401,{error:"Sesi tidak valid."});
    const owner=auth.data.user.id;
    const workspace=await userDb.from("namina_business_workspaces").select("id").eq("owner_id",owner).maybeSingle();
    if (workspace.error || !workspace.data) return send(403,{error:"Workspace tidak tersedia."});
    const workspaceId=workspace.data.id;
    // Capture the generation before checking the session; rotation after this point invalidates issuance.
    const generation=await serverDb.from("namina_business_access_keys").select("rotated_at").eq("workspace_id",workspaceId).is("revoked_at",null).maybeSingle();
    const valid=await userDb.rpc("namina_business_session_valid",{p_workspace_id:workspaceId});
    if (generation.error || !generation.data || valid.error || valid.data!==true) return send(403,{error:"Akses Studio tidak valid."});
    const token=data.action==="create"?"nmn_"+randomBytes(32).toString("base64url"):undefined;
    const result=await serverDb.rpc("namina_mcp_manage",{
      p_owner:owner,p_workspace:workspaceId,p_generation:generation.data.rotated_at,p_action:data.action,
      p_id:data.action==="revoke"?data.id:null,p_label:data.action==="create"?data.label:null,
      p_scope:data.action==="create"?data.scope:null,p_hash:token?createHash("sha256").update(token).digest("hex"):null,
    });
    if (result.error) return send(503,{error:"AI Connect belum siap."});
    if (result.data?.error) return send(409,{error:"Permintaan ditolak. Periksa akses atau batas 10 kunci aktif."});
    return send(200,token?{...result.data,token}:result.data);
  } catch { return send(400,{error:"Permintaan AI Connect gagal."}); }
}
