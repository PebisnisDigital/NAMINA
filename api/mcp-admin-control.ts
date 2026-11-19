import type {IncomingMessage,ServerResponse} from "node:http";
import {createHash,randomBytes} from "node:crypto";
import {adminDb,userDb,checked,legacySite} from "../server/mcp-admin-db.js";
import {keySchema,isOperation,operationSchemas,operationCategory,allowed,scopes} from "../server/mcp-admin.js";
import {siteDocumentSchema} from "../src/static/sites.js";
import {publishAdminToDatabase} from "./_supabase-publisher.js";
type Req=IncomingMessage&{body?:unknown};
export default async function handler(req:Req,res:ServerResponse){
 res.setHeader("Cache-Control","private, no-store");res.setHeader("Content-Type","application/json");res.setHeader("X-Content-Type-Options","nosniff");
 const send=(status:number,value:unknown)=>{res.statusCode=status;res.end(JSON.stringify(value));};
 if(process.env.NAMINA_ADMIN_MCP_ENABLED!=="true")return send(503,{error:"Admin AI Connect belum diaktifkan."});
 if(req.method!=="POST"||req.headers.origin!=="https://namina.biz.id")return send(403,{error:"Permintaan ditolak."});
 const bearer=req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
 if(!bearer)return send(401,{error:"Login superadmin diperlukan."});
 try{
  const raw=typeof req.body==="string"?req.body:JSON.stringify(req.body??{});if(Buffer.byteLength(raw)>4096)return send(413,{error:"Permintaan terlalu besar."});
  const parsed=keySchema.safeParse(JSON.parse(raw));if(!parsed.success)return send(400,{error:"Data tidak valid."});
  const a=parsed.data,auth=userDb(bearer),db=adminDb();
  const user=await auth.auth.getUser(bearer);if(user.error||!user.data.user)return send(401,{error:"Sesi tidak valid."});
  const owner=user.data.user.id,role=await auth.rpc("namana_is_admin");
  if(role.error||role.data!==true)return send(403,{error:"Khusus superadmin."});
  if(a.action==="list")return send(200,{keys:checked(await db.from("namina_admin_mcp_keys").select("id,label,scope,created_at,expires_at,revoked_at,last_used_at").eq("owner_id",owner).order("created_at",{ascending:false}).limit(100))});
  if(a.action==="create"){
   const cur=await db.from("namina_admin_mcp_keys").select("id",{head:true,count:"exact"}).eq("owner_id",owner).is("revoked_at",null).gt("expires_at",new Date().toISOString());
   if(cur.error||(cur.count??0)>=10)return send(409,{error:"Maksimal 10 kunci aktif."});
   const token="nma_"+randomBytes(32).toString("base64url");
   const key=checked(await db.from("namina_admin_mcp_keys").insert({owner_id:owner,label:a.label,scope:a.scope,token_hash:createHash("sha256").update(token).digest("hex")}).select("id,label,scope,expires_at").single());
   return send(200,{key,token});
  }
  if(a.action==="revoke"){
   const key=checked(await db.from("namina_admin_mcp_keys").update({revoked_at:new Date().toISOString()}).eq("owner_id",owner).eq("id",a.id).select("id").maybeSingle());
   return send(key?200:404,key?{revoked:true}:{error:"Kunci tidak ditemukan."});
  }
  if(a.action==="requests"){
   const rows=checked(await db.from("namina_admin_mcp_requests").select("id,operation,payload,status,created_at,decision_at,result").eq("owner_id",owner).order("created_at",{ascending:false}).limit(100));
   return send(200,{requests:rows});
  }
  if(a.action==="review"){
   const q=checked(await db.from("namina_admin_mcp_requests").select("operation,payload").eq("owner_id",owner).eq("id",a.id).eq("status","pending").maybeSingle());
   if(!q)return send(404,{error:"Permintaan tidak tersedia."});
   if(q.operation==="publish"){
    const p=operationSchemas.publish.parse(q.payload);
    const draft=checked(await db.from("namina_admin_mcp_drafts").select("document,base_sha").eq("slug",p.slug).eq("updated_at",p.updated_at).maybeSingle());
    return send(draft?200:409,draft?{review:draft}:{error:"Draft berubah. Minta agent mengajukan ulang."});
   }
   if(q.operation!=="create_partner"){
    const p=operationSchemas.rotate_link.safeParse({workspace_id:q.payload.workspace_id});
    if(!p.success)return send(400,{error:"ID mitra tidak valid."});
    const w=checked(await db.from("namina_business_workspaces").select("id,display_name,whatsapp_number,subscription_status,max_sites,current_period_end").eq("id",p.data.workspace_id).maybeSingle());
    return send(w?200:404,w?{review:w}:{error:"Mitra tidak ditemukan."});
   }
   return send(200,{review:q.payload});
  }
  const request=checked(await db.from("namina_admin_mcp_requests").select("*").eq("id",a.id).eq("owner_id",owner).eq("status","pending").maybeSingle());
  if(!request)return send(409,{error:"Permintaan tidak tersedia atau sudah diproses."});
  if(a.action==="reject"){
   const rejected=checked(await db.from("namina_admin_mcp_requests").update({status:"rejected",decision_at:new Date().toISOString(),approved_by:owner}).eq("id",a.id).eq("owner_id",owner).eq("status","pending").select("id").maybeSingle());
   return send(rejected?200:409,rejected?{status:"rejected"}:{error:"Permintaan sudah diproses."});
  }
  if(a.action!=="approve"||!isOperation(request.operation))return send(400,{error:"Aksi tidak valid."});
  if(Date.now()-new Date(request.created_at).getTime()>86400000)return send(409,{error:"Permintaan kedaluwarsa. Minta agent membuat permintaan baru."});
  const agent=checked(await db.from("namina_admin_mcp_keys").select("scope").eq("id",request.key_id).eq("owner_id",owner).is("revoked_at",null).gt("expires_at",new Date().toISOString()).maybeSingle());
  const scope=scopes.safeParse(agent?.scope);
  if(!scope.success||!allowed(scope.data,operationCategory(request.operation)))return send(403,{error:"Akses agent sudah tidak berlaku."});
  const payload=operationSchemas[request.operation].safeParse(request.payload);
  if(!payload.success)return send(400,{error:"Isi permintaan tidak valid."});
  const claim=checked(await db.from("namina_admin_mcp_requests").update({status:"running",decision_at:new Date().toISOString(),approved_by:owner}).eq("id",a.id).eq("owner_id",owner).eq("status","pending").select("id").maybeSingle());
  if(!claim)return send(409,{error:"Permintaan sudah diproses."});
  const finish=async(status:"completed"|"failed",result:object)=>checked(await db.from("namina_admin_mcp_requests").update({status,result}).eq("id",a.id).eq("owner_id",owner).eq("status","running"));
  try{
   let result:Record<string,unknown>,privateLink:unknown;
   if(request.operation==="publish"){
    const p=operationSchemas.publish.parse(payload.data);
    const draft=checked(await db.from("namina_admin_mcp_drafts").select("document,base_sha").eq("slug",p.slug).eq("updated_at",p.updated_at).maybeSingle());
    if(!draft)throw Error("Draft changed");
    const document=siteDocumentSchema.parse(draft.document);
    const sha=await publishAdminToDatabase(document,draft.base_sha,async()=>(await legacySite(p.slug))?.sha??null);
    result={sha,url:"https://namina.biz.id/"+p.slug};
   }else if(request.operation==="create_partner"||request.operation==="rotate_link"||request.operation==="revoke_link"){
    const body=request.operation==="create_partner"?{action:"create",...operationSchemas.create_partner.parse(payload.data)}:{action:request.operation==="rotate_link"?"rotate":"revoke",workspaceId:operationSchemas.rotate_link.parse(payload.data).workspace_id};
    const url=process.env.VITE_SUPABASE_URL!;
    const response=await fetch(url+"/functions/v1/namina-business-magic-link",{method:"POST",headers:{Authorization:"Bearer "+bearer,apikey:process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY||"",Origin:"https://namina.biz.id","Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok||data.error||!data.workspaceId)throw Error("Partner operation failed");
    if(request.operation==="revoke_link"&&data.revoked!==true)throw Error("Revoke not confirmed");
    if(request.operation!=="revoke_link"&&typeof data.link!=="string")throw Error("Link not issued");
    result={workspace_id:data.workspaceId,operation:request.operation};
    if(typeof data.link==="string")privateLink=data.link;
   }else if(request.operation==="extend_partner"){
    const p=operationSchemas.extend_partner.parse(payload.data);
    const end=checked(await auth.rpc("namina_business_admin_extend",{p_workspace_id:p.workspace_id,p_days:p.days}));
    result={workspace_id:p.workspace_id,current_period_end:end};
   }else if(request.operation==="edit_partner"||request.operation==="set_partner_quota"){
    const p=request.operation==="edit_partner"?operationSchemas.edit_partner.parse(payload.data):operationSchemas.set_partner_quota.parse(payload.data);
    const values="name" in p?{display_name:p.name,whatsapp_number:p.whatsapp,updated_at:new Date().toISOString()}:{max_sites:p.max_sites,updated_at:new Date().toISOString()};
    const changed=checked(await db.from("namina_business_workspaces").update(values).eq("id",p.workspace_id).select("id").maybeSingle());
    if(!changed)throw Error("Partner missing");
    result={workspace_id:p.workspace_id};
   }else if(request.operation==="revoke_partner_mcp"){
    const p=operationSchemas.revoke_partner_mcp.parse(payload.data);
    const w=checked(await db.from("namina_business_workspaces").select("id").eq("id",p.workspace_id).maybeSingle());if(!w)throw Error("Partner missing");
    const rows=checked(await db.from("namina_mcp_keys").update({revoked_at:new Date().toISOString()}).eq("workspace_id",p.workspace_id).is("revoked_at",null).select("id"));
    result={workspace_id:p.workspace_id,revoked_count:rows?.length??0};
   }else throw Error("Unknown operation");
   await finish("completed",result);
   // Private login links are returned once to the approving human, never stored or returned to the agent.
   return send(200,{status:"completed",result,...(privateLink?{private_link:privateLink}:{})});
  }catch{await finish("failed",{error:"Operation failed or could not be confirmed; inspect Studio before retrying."});return send(409,{error:"Aksi gagal atau belum terkonfirmasi. Periksa Studio sebelum mencoba lagi."});}
 }catch{return send(503,{error:"Layanan Admin AI Connect gagal."});}
}
