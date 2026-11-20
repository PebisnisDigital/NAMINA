import type {IncomingMessage,ServerResponse} from "node:http";
import {createHash} from "node:crypto";
import {z} from "zod";
import {adminDb,checked,legacySite,legacySlugs} from "../server/mcp-admin-db.js";
import {adminTools,allowed,isOperation,operationSchemas,operationCategory,scopes,saveDraftSchema} from "../server/mcp-admin.js";
import {blankSite,prepareSite,siteDocumentSchema} from "../src/static/sites.js";
import {createSiteFromTemplate,templateCatalog,type TemplateKey} from "../src/static/templateCatalog.js";
import {factorySpecSchema,factoryEntry,isFactoryKey,instantiateFactory} from "../src/static/factoryTemplates.js";
import {findAdminPublication} from "./_supabase-publisher.js";

type Req=IncomingMessage&{body?:unknown};
const envelope=z.object({jsonrpc:z.literal("2.0"),id:z.union([z.string(),z.number()]).optional(),method:z.string(),params:z.record(z.string(),z.unknown()).optional()});
export default async function handler(req:Req,res:ServerResponse){
 res.setHeader("Cache-Control","private, no-store");res.setHeader("Content-Type","application/json");res.setHeader("X-Content-Type-Options","nosniff");
 const send=(status:number,value?:unknown)=>{res.statusCode=status;res.end(value===undefined?undefined:JSON.stringify(value));};
 if(process.env.NAMINA_ADMIN_MCP_ENABLED!=="true")return send(503,{error:"Admin MCP disabled"});
 if(req.headers.origin&&req.headers.origin!=="https://namina.biz.id")return send(403,{error:"Origin denied"});
 const key=req.headers.authorization?.match(/^Bearer (nma_[A-Za-z0-9_-]{43})$/)?.[1];
 if(!key){res.setHeader("WWW-Authenticate","Bearer");return send(401,{error:"Admin agent key required"});}
 try{
  const db=adminDb(),hash=createHash("sha256").update(key).digest("hex");
  const auth=checked(await db.rpc("namina_admin_mcp_auth",{p_hash:hash}));
  if(auth?.error==="rate_limit"){res.setHeader("Retry-After","60");return send(429,{error:"Rate limit"});}
  const scope=scopes.safeParse(auth?.scope);
  if(!scope.success||!auth?.id||!auth?.owner_id){res.setHeader("WWW-Authenticate","Bearer");return send(401,{error:"Invalid admin key"});}
  if(req.method!=="POST"){res.setHeader("Allow","POST");return send(405);}
  let body:unknown;
  try{if(req.body!==undefined){const raw=typeof req.body==="string"?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>300000)return send(413);body=JSON.parse(raw);}
  else{const chunks:Buffer[]=[];let n=0;for await(const chunk of req){const b=Buffer.from(chunk);n+=b.length;if(n>300000)return send(413);chunks.push(b);}body=JSON.parse(Buffer.concat(chunks).toString("utf8"));}}
  catch{return send(400,{jsonrpc:"2.0",id:null,error:{code:-32700,message:"Parse error"}});}
  const p=envelope.safeParse(body);if(!p.success)return send(400,{jsonrpc:"2.0",id:null,error:{code:-32600,message:"Invalid request"}});
  const {id,method,params}=p.data;if(id===undefined)return send(202);
  const result=(value:unknown)=>send(200,{jsonrpc:"2.0",id,result:value});
  const fail=(code:number,message:string)=>send(200,{jsonrpc:"2.0",id,error:{code,message}});
  const content=(value:unknown,isError=false)=>result({content:[{type:"text",text:JSON.stringify(value)}],isError});
  const visible=adminTools.filter(t=>t.category==="both"||allowed(scope.data,t.category as "websites"|"partners"));
  if(method==="initialize")return result({protocolVersion:["2025-11-25","2025-06-18","2025-03-26"].includes(String(params?.protocolVersion))?params?.protocolVersion:"2025-11-25",capabilities:{tools:{}},serverInfo:{name:"namina-superadmin",version:"0.1.0"}});
  if(method==="ping")return result({});
  if(method==="tools/list")return result({tools:visible.map(t=>({name:t.name,description:t.description,inputSchema:z.toJSONSchema(t.schema),annotations:{readOnlyHint:t.read,destructiveHint:!t.read}}))});
  if(method!=="tools/call")return fail(-32601,"Method not found");
  const tool=visible.find(t=>t.name===params?.name);if(!tool)return fail(-32602,"Unknown or unauthorized tool");
  const args=tool.schema.safeParse(params?.arguments??{});if(!args.success)return fail(-32602,"Invalid tool arguments");
  const input=args.data as Record<string,unknown>;
  if(tool.name==="list_websites"){
   const lo=Number(input.offset),hi=lo+Number(input.limit)-1;
   const [pub,drafts,partner,legacy]=await Promise.all([
    db.from("namina_published_sites").select("slug,source,revision,published_at").order("slug").range(lo,hi),
    db.from("namina_admin_mcp_drafts").select("slug,base_sha,updated_at").order("slug").range(lo,hi),
    db.from("namina_business_sites").select("id,workspace_id,slug,published_sha,updated_at").order("slug").range(lo,hi),legacySlugs()]);
   return content({publications:checked(pub),central_drafts:checked(drafts),partner_drafts:checked(partner),legacy:legacy.slice(lo,hi+1)});
  }
  if(tool.name==="get_website"){
   const slug=String(input.slug);
   const d=checked(await db.from("namina_admin_mcp_drafts").select("slug,document,base_sha,updated_at").eq("slug",slug).maybeSingle());
   if(d)return content({source:"central_draft",...d});
   const partner=checked(await db.from("namina_business_sites").select("id,slug,workspace_id,document,updated_at,published_sha").eq("slug",slug).maybeSingle());
   if(partner)return content({source:"partner_draft",...partner});
   const site=await findAdminPublication(slug)||await legacySite(slug);
   return site?content({source:"central_publication",...site}):content({error:"Website not found"},true);
  }
  if(tool.name==="save_draft"){
   const a=saveDraftSchema.parse(input),document=siteDocumentSchema.parse(prepareSite(a.document));
   if(Buffer.byteLength(JSON.stringify(document))>245000)return content({error:"Document too large"},true);
   const slug=document.slug;
   if(checked(await db.from("namina_business_sites").select("id").eq("slug",slug).maybeSingle()))return content({error:"Slug belongs to partner"},true);
   const publicRow=checked(await db.from("namina_published_sites").select("source,revision").eq("slug",slug).maybeSingle());
   if(publicRow&&publicRow.source!=="admin")return content({error:"Slug belongs to partner"},true);
   const actual=publicRow?"db:"+publicRow.revision:(await legacySite(slug))?.sha??null;
   if(actual!==a.base_sha)return content({error:"Published version changed; reload"},true);
   const values={document,base_sha:a.base_sha,updated_at:new Date().toISOString(),updated_by:auth.id};
   const r=a.updated_at===null?await db.from("namina_admin_mcp_drafts").insert({slug,...values}).select("slug,updated_at").maybeSingle():await db.from("namina_admin_mcp_drafts").update(values).eq("slug",slug).eq("updated_at",a.updated_at).select("slug,updated_at").maybeSingle();
   return r.error||!r.data?content({error:"Draft changed or exists; reload"},true):content(r.data);
  }
  if(tool.name==="list_templates"){
   const builtin=templateCatalog.map(({id,name,description})=>({id,name,description}));
   if(process.env.NAMINA_TEMPLATE_MCP_ENABLED!=="true")return content(builtin);
   const rows=checked(await db.from("namina_factory_templates").select("slug,version,spec,status").in("status",["published","archived"]).order("version",{ascending:false}).limit(500))||[];
   const seen=new Set<string>(),entries=[];
   for(const row of rows){if(seen.has(row.slug))continue;seen.add(row.slug);if(row.status!=="published")continue;const spec=factorySpecSchema.parse(row.spec);entries.push(factoryEntry(spec,row.version));}
   return content([...builtin,...entries.map(({id,name,description})=>({id,name,description}))]);
  }
  if(tool.name==="get_template"){
   const key=String(input.template);
   if(isFactoryKey(key)){
    if(process.env.NAMINA_TEMPLATE_MCP_ENABLED!=="true")return content({error:"Factory disabled"},true);
    const [,slug,v]=key.split(":");
    const row=checked(await db.from("namina_factory_templates").select("spec").eq("slug",slug).eq("version",Number(v)).eq("status","published").maybeSingle());
    if(!row)return content({error:"Template not available"},true);
    return content({document:instantiateFactory(factorySpecSchema.parse(row.spec).document,String(input.slug),key),warning:"Sample only. Replace identity, contacts and assets."});
   }
   return content({document:await createSiteFromTemplate(String(input.slug),key as TemplateKey),warning:"Sample data only. Replace all identity, contacts and assets."});
  }
  if(tool.name==="get_original_template")return content({document:blankSite(String(input.slug)),warning:"Sample data only. Replace all identity, contacts and assets."});
  if(tool.name==="list_partners"){
   const lo=Number(input.offset),hi=lo+Number(input.limit)-1;
   return content(checked(await db.from("namina_business_workspaces").select("id,display_name,whatsapp_number,subscription_status,max_sites,current_period_end,updated_at").order("created_at",{ascending:false}).range(lo,hi)));
  }
  if(tool.name==="get_request"){
   const row=checked(await db.from("namina_admin_mcp_requests").select("id,operation,status,created_at,decision_at,result").eq("id",input.id).eq("key_id",auth.id).maybeSingle());
   return row?content(row):content({error:"Request not found"},true);
  }
  if(isOperation(tool.name)&&allowed(scope.data,operationCategory(tool.name))){
   const payload=operationSchemas[tool.name].parse(input);
   if(Buffer.byteLength(JSON.stringify(payload))>245000)return content({error:"Payload too large"},true);
   if(tool.name==="publish"){
    const a=operationSchemas.publish.parse(payload);
    const draft=checked(await db.from("namina_admin_mcp_drafts").select("slug").eq("slug",a.slug).eq("updated_at",a.updated_at).maybeSingle());
    if(!draft)return content({error:"Draft version not found"},true);
   }
   const pending=await db.from("namina_admin_mcp_requests").select("id",{count:"exact",head:true}).eq("key_id",auth.id).eq("status","pending");
   if(pending.error||(pending.count??0)>=20)return content({error:"Too many pending requests"},true);
   const row=checked(await db.from("namina_admin_mcp_requests").insert({key_id:auth.id,owner_id:auth.owner_id,operation:tool.name,payload}).select("id,status").single());
   return content({...row,approval_url:"https://namina.biz.id/studio/admin",message:"Awaiting human approval. Do not claim action completed."});
  }
  return fail(-32602,"Unknown tool");
 }catch{return send(503,{error:"Admin MCP request failed"});}
}
