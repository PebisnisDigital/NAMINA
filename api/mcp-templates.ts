import type {IncomingMessage,ServerResponse} from "node:http";
import {createHash,randomBytes} from "node:crypto";
import {z} from "zod";
import {adminDb,userDb,checked} from "../server/mcp-admin-db.js";
import {factorySpecSchema,factorySlug,factoryEntry,instantiateFactory,factoryKeySchema,type FactoryKey} from "../src/static/factoryTemplates.js";
import {defaultContent,slugSchema} from "../src/domain/content.js";
import {blankOriginal} from "../src/static/originalSeed.js";
import {originalStyleDefaults} from "../src/static/originalStyle.js";
import {prepareSite} from "../src/static/sites.js";
type Req=IncomingMessage&{body?:unknown};
const identity=z.object({slug:factorySlug,version:z.number().int().min(1).max(999999)}).strict();
const tools=[
 {name:"list_templates",description:"List your own factory drafts and releases",schema:z.object({}).strict(),read:true},
 {name:"get_template",description:"Read your factory template version",schema:identity,read:true},
 {name:"get_seed",description:"Get a safe fictional Original-layout seed with editable style tokens",schema:z.object({slug:factorySlug}).strict(),read:true},
 {name:"create_template",description:"Create a new immutable-numbered draft from a complete template specification. Each release needs human review.",schema:z.object({spec:factorySpecSchema}).strict(),read:false},
 {name:"update_template",description:"Update only a draft version, using its current updated_at to prevent stale edits.",schema:identity.extend({spec:factorySpecSchema,updated_at:z.iso.datetime({offset:true})}).strict(),read:false},
 {name:"validate_template",description:"Validate template schema only. This is not a browser or visual test.",schema:z.object({spec:factorySpecSchema}).strict(),read:true},
 {name:"create_demo",description:"Return the private review URL for the current draft. Admin login required; no public demo before approval.",schema:identity,read:true},
 {name:"request_publish",description:"Send a draft for human approval. Does not publish.",schema:identity.extend({updated_at:z.iso.datetime({offset:true})}).strict(),read:false},
] as const;
const control=z.discriminatedUnion("action",[
 z.object({action:z.literal("list")}).strict(),
 z.object({action:z.literal("create_key"),label:z.string().trim().min(1).max(80)}).strict(),
 z.object({action:z.literal("revoke_key"),id:z.uuid()}).strict(),
 z.object({action:z.literal("review")}).merge(identity),
 z.object({action:z.literal("approve"),updated_at:z.iso.datetime({offset:true})}).merge(identity),
 z.object({action:z.literal("reject"),updated_at:z.iso.datetime({offset:true})}).merge(identity),
 z.object({action:z.literal("archive"),updated_at:z.iso.datetime({offset:true})}).merge(identity),
]);
const hash=(v:string)=>createHash("sha256").update(v).digest("hex");
export default async function handler(req:Req,res:ServerResponse){
 res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","private, no-store");res.setHeader("X-Content-Type-Options","nosniff");
 const send=(status:number,body?:unknown)=>{res.statusCode=status;res.end(body===undefined?undefined:JSON.stringify(body));};
 const url=new URL(req.url||"/","https://namina.biz.id"),action=url.searchParams.get("action")||"mcp";
 const enabled=process.env.NAMINA_TEMPLATE_MCP_ENABLED==="true";
 if(!enabled)return send(action==="catalog"?200:503,action==="catalog"?{templates:[]}:{error:"Template Factory disabled"});
 try{
 const db=adminDb();
 if(req.method==="GET"&&(action==="catalog"||action==="demo")){
  if(action==="catalog"){
   const rows=checked(await db.from("namina_factory_templates").select("slug,version,spec").eq("status","published").order("version",{ascending:false}).limit(500))||[];
   const latest=new Map<string,ReturnType<typeof factoryEntry>>();
   for(const row of rows){const spec=factorySpecSchema.safeParse(row.spec);if(spec.success&&!latest.has(row.slug))latest.set(row.slug,factoryEntry(spec.data,row.version));}
   return send(200,{templates:[...latest.values()]});
  }
  const id=identity.safeParse({slug:url.searchParams.get("slug"),version:Number(url.searchParams.get("version"))});
  if(!id.success)return send(400,{error:"Invalid template"});
  const row=checked(await db.from("namina_factory_templates").select("spec").eq("slug",id.data.slug).eq("version",id.data.version).eq("status","published").maybeSingle());
  return row?send(200,{spec:factorySpecSchema.parse(row.spec)}):send(404,{error:"Template not published"});
 }
 if(req.headers.origin&&req.headers.origin!=="https://namina.biz.id")return send(403,{error:"Origin denied"});
 const bearer=req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
 if(!bearer){res.setHeader("WWW-Authenticate","Bearer");return send(401,{error:"Authentication required"});}
 if(req.method!=="POST"){res.setHeader("Allow","POST");return send(405);}
 let body:unknown;try{let raw:string;if(req.body!==undefined)raw=typeof req.body==="string"?req.body:JSON.stringify(req.body);else{let n=0;const chunks:Buffer[]=[];for await(const c of req){const b=Buffer.from(c);n+=b.length;if(n>300000)return send(413);chunks.push(b);}raw=Buffer.concat(chunks).toString("utf8");}if(Buffer.byteLength(raw)>300000)return send(413);body=JSON.parse(raw);}catch{return send(400,{error:"Invalid JSON"});}
 if(action==="control"){
  if(req.headers.origin!=="https://namina.biz.id")return send(403,{error:"Origin denied"});
  const user=userDb(bearer),u=await user.auth.getUser(bearer),role=await user.rpc("namana_is_admin");
  if(u.error||!u.data.user||role.error||role.data!==true)return send(403,{error:"Superadmin required"});
  const owner=u.data.user.id,p=control.safeParse(body);if(!p.success)return send(400,{error:"Invalid action"});
  const a=p.data;
  if(a.action==="list"){
   const [k,t]=await Promise.all([db.from("namina_template_agent_keys").select("id,label,expires_at,revoked_at,last_used_at").eq("owner_id",owner).limit(100),db.from("namina_factory_templates").select("slug,version,status,updated_at").eq("owner_id",owner).order("updated_at",{ascending:false}).limit(200)]);
   return send(200,{keys:checked(k),templates:checked(t)});
  }
  if(a.action==="create_key"){
   const count=await db.from("namina_template_agent_keys").select("id",{count:"exact",head:true}).eq("owner_id",owner).is("revoked_at",null).gt("expires_at",new Date().toISOString());
   if(count.error||(count.count??0)>=10)return send(409,{error:"Key limit"});
   const token="nmt_"+randomBytes(32).toString("base64url");
   checked(await db.from("namina_template_agent_keys").insert({owner_id:owner,label:a.label,token_hash:hash(token)}));return send(200,{token});
  }
  if(a.action==="revoke_key"){
   const r=checked(await db.from("namina_template_agent_keys").update({revoked_at:new Date().toISOString()}).eq("owner_id",owner).eq("id",a.id).select("id").maybeSingle());return send(r?200:404,r?{revoked:true}:{error:"Key not found"});
  }
  const row=checked(await db.from("namina_factory_templates").select("spec,status,updated_at").eq("owner_id",owner).eq("slug",a.slug).eq("version",a.version).maybeSingle());
  if(!row)return send(404,{error:"Version not found"});
  if(a.action==="review")return send(200,{...row,spec:factorySpecSchema.parse(row.spec)});
  const status=a.action==="approve"?"published":a.action==="archive"?"archived":"rejected",from=a.action==="archive"?"published":"review";
  if(row.status!==from||row.updated_at!==a.updated_at)return send(409,{error:"Version changed; review again"});
  factorySpecSchema.parse(row.spec);
  const updated=checked(await db.from("namina_factory_templates").update({status,reviewed_by:owner,updated_at:new Date().toISOString(),...(status==="published"?{published_at:new Date().toISOString()}:{})}).eq("owner_id",owner).eq("slug",a.slug).eq("version",a.version).eq("status",from).eq("updated_at",a.updated_at).select("status").maybeSingle());
  return updated?send(200,updated):send(409,{error:"Version changed"});
 }
 if(action!=="mcp"||!/^nmt_[A-Za-z0-9_-]{43}$/.test(bearer))return send(401,{error:"Template agent key required"});
 const auth=checked(await db.rpc("namina_template_agent_auth",{p_hash:hash(bearer)}));
 if(auth?.error==="rate_limit")return send(429,{error:"Rate limit"});
 if(!auth?.owner_id)return send(401,{error:"Invalid template key"});
 const owner=auth.owner_id;
 const envelope=z.object({jsonrpc:z.literal("2.0"),id:z.union([z.string(),z.number()]).optional(),method:z.string(),params:z.record(z.string(),z.unknown()).optional()}).safeParse(body);
 if(!envelope.success)return send(400,{jsonrpc:"2.0",id:null,error:{code:-32600,message:"Invalid request"}});
 const {id,method,params}=envelope.data;if(id===undefined)return send(202);
 const result=(r:unknown)=>send(200,{jsonrpc:"2.0",id,result:r}),fail=(code:number,message:string)=>send(200,{jsonrpc:"2.0",id,error:{code,message}}),content=(v:unknown,isError=false)=>result({content:[{type:"text",text:JSON.stringify(v)}],isError});
 if(method==="initialize")return result({protocolVersion:["2025-11-25","2025-06-18","2025-03-26"].includes(String(params?.protocolVersion))?params?.protocolVersion:"2025-11-25",capabilities:{tools:{}},serverInfo:{name:"namina-template-factory",version:"0.1.0"}});
 if(method==="ping")return result({});
 if(method==="tools/list")return result({tools:tools.map(t=>({name:t.name,description:t.description,inputSchema:z.toJSONSchema(t.schema),annotations:{readOnlyHint:t.read,destructiveHint:!t.read}}))});
 if(method!=="tools/call")return fail(-32601,"Method not found");
 const tool=tools.find(t=>t.name===params?.name);if(!tool)return fail(-32602,"Unknown tool");
 const args=tool.schema.safeParse(params?.arguments??{});if(!args.success)return fail(-32602,"Invalid arguments: "+args.error.issues[0]?.message);
 const input=args.data as Record<string,unknown>;
 if(tool.name==="get_seed"){
  const doc=prepareSite({slug:slugSchema.parse(input.slug),presentation:"original",content:{...structuredClone(defaultContent),original:{...blankOriginal("Profil Demo"),style:{...originalStyleDefaults}}},media:{desktopVideo:"",mobileVideo:"",poster:"",portrait:"",cards:{}}});
  return content({document:doc,warning:"Use fictional sample data and licensed media only. No customer data or secrets."});
 }
 if(tool.name==="list_templates")return content(checked(await db.from("namina_factory_templates").select("slug,version,status,updated_at").eq("owner_id",owner).order("updated_at",{ascending:false}).limit(200)));
 if(tool.name==="validate_template")return content({valid:true,check:"schema only; browser testing still required"});
 if(tool.name==="create_template"){
  const spec=factorySpecSchema.parse(input.spec);
  const previous=checked(await db.from("namina_factory_templates").select("version,owner_id").eq("slug",spec.slug).order("version",{ascending:false}).limit(1));
  if(previous?.length&&previous[0].owner_id!==owner)return content({error:"Template slug unavailable"},true);
  const version=(previous?.[0]?.version??0)+1;
  if(Buffer.byteLength(JSON.stringify(spec))>240000)return content({error:"Spec too large"},true);
  const r=checked(await db.from("namina_factory_templates").insert({slug:spec.slug,version,owner_id:owner,spec}).select("slug,version,status,updated_at").single());return content(r);
 }
 const a=identity.parse({slug:input.slug,version:input.version}),row=checked(await db.from("namina_factory_templates").select("spec,status,updated_at").eq("owner_id",owner).eq("slug",a.slug).eq("version",a.version).maybeSingle());
 if(!row)return content({error:"Template not found"},true);
 if(tool.name==="get_template")return content({...a,...row});
 if(tool.name==="create_demo")return content({url:"https://namina.biz.id/studio/templates?slug="+a.slug+"&version="+a.version,private:true,public_url:row.status==="published"?"https://namina.biz.id/template-demo/"+a.slug+"/"+a.version:null});
 if(row.status!=="draft"||row.updated_at!==input.updated_at)return content({error:"Draft changed or frozen; reload"},true);
 const patch:Record<string,unknown>={updated_at:new Date().toISOString()};
 if(tool.name==="update_template"){const spec=factorySpecSchema.parse(input.spec);if(spec.slug!==a.slug||Buffer.byteLength(JSON.stringify(spec))>240000)return content({error:"Invalid spec"},true);patch.spec=spec;}
 else if(tool.name==="request_publish"){factorySpecSchema.parse(row.spec);patch.status="review";}
 else return fail(-32602,"Unknown tool");
 const changed=checked(await db.from("namina_factory_templates").update(patch).eq("owner_id",owner).eq("slug",a.slug).eq("version",a.version).eq("status","draft").eq("updated_at",input.updated_at).select("slug,version,status,updated_at").maybeSingle());
 return changed?content(changed):content({error:"Draft changed"},true);
 }catch{return send(503,{error:"Template Factory request failed"});}
}
