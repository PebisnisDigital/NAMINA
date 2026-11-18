import type { IncomingMessage,ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { MCP_ISSUER,MCP_RESOURCE,oauthMetadata,resourceMetadata,registerClient,decodeClient,validateClientSecret,validChallenge,validVerifier,parseRequestedScope,pkce,sha256 } from "../server/mcp-oauth.js";
type Request=IncomingMessage & {body?:unknown};
function parameters(raw:unknown):URLSearchParams {
  if(typeof raw==="string")return new URLSearchParams(raw);
  if(raw&&typeof raw==="object"&&!Array.isArray(raw))return new URLSearchParams(Object.entries(raw).map(([k,v])=>{if(typeof v!=="string")throw Error("Invalid parameter");return [k,v];}));
  throw Error("Invalid body");
}
export default async function handler(req:Request,res:ServerResponse){
  res.setHeader("Cache-Control","no-store");res.setHeader("Content-Type","application/json");res.setHeader("X-Content-Type-Options","nosniff");
  const send=(status:number,body:unknown)=>{res.statusCode=status;res.end(JSON.stringify(body));};
  const fail=(error:string,status=400)=>send(status,{error});
  if(process.env.NAMINA_MCP_ENABLED!=="true"||process.env.NAMINA_MCP_OAUTH_ENABLED!=="true")return fail("temporarily_unavailable",503);
  const key=process.env.NAMINA_MCP_OAUTH_SECRET||"";
  if(Buffer.byteLength(key)<32)return fail("temporarily_unavailable",503);
  const url=new URL(req.url||"/",MCP_ISSUER), action=url.searchParams.get("action");
  if(action==="metadata"&&req.method==="GET")return send(200,oauthMetadata());
  if(action==="resource"&&req.method==="GET")return send(200,resourceMetadata());
  if(action==="authorize"&&req.method==="GET"){
    const q=url.searchParams,c=decodeClient(key,q.get("client_id")||"");
    const scope=parseRequestedScope(q.get("scope"));
    if(!c||q.get("redirect_uri")!==c.redirect||q.get("response_type")!=="code"||q.get("resource")!==MCP_RESOURCE||q.get("code_challenge_method")!=="S256"||!validChallenge(q.get("code_challenge")||"")||!scope||q.getAll("resource").length!==1)return fail("invalid_request");
    const consent=new URL("/studio/oauth",MCP_ISSUER);
    for(const field of ["client_id","redirect_uri","resource","code_challenge","code_challenge_method","response_type","state","scope"]){const v=q.get(field);if(v!==null)consent.searchParams.set(field,v);}
    res.statusCode=302;res.setHeader("Location",consent.toString());res.end();return;
  }
  if(req.method!=="POST")return fail("invalid_request",405);
  try{
    let raw=req.body;
    if(raw===undefined){const chunks:Buffer[]=[];let n=0;for await(const chunk of req){const b=Buffer.from(chunk);n+=b.length;if(n>12000)return fail("invalid_request",413);chunks.push(b);}raw=Buffer.concat(chunks).toString("utf8");}
    if(Buffer.byteLength(typeof raw==="string"?raw:JSON.stringify(raw))>12000)return fail("invalid_request",413);
    if(action==="register"){
      const data=typeof raw==="string"?JSON.parse(raw):raw;
      if(!data||!Array.isArray(data.redirect_uris)||data.redirect_uris.length!==1||typeof data.redirect_uris[0]!=="string")return fail("invalid_redirect_uri");
      const method=data.token_endpoint_auth_method||"client_secret_basic";
      if(!["none","client_secret_post","client_secret_basic"].includes(method))return fail("invalid_client_metadata");
      try{return send(201,registerClient(key,data.redirect_uris[0],method));}catch{return fail("invalid_client_metadata");}
    }
    const dbUrl=process.env.VITE_SUPABASE_URL,anon=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!dbUrl||!anon||!service||(process.env.SUPABASE_URL&&process.env.SUPABASE_URL!==dbUrl))return fail("temporarily_unavailable",503);
    const db=createClient(dbUrl,service,{auth:{persistSession:false,autoRefreshToken:false}});
    if(action==="consent"){
      if(req.headers.origin!==MCP_ISSUER)return fail("access_denied",403);
      const q=parameters(raw),id=q.get("client_id")||"",c=decodeClient(key,id),scope=parseRequestedScope(q.get("scope"));
      if(!c||q.get("redirect_uri")!==c.redirect||q.get("resource")!==MCP_RESOURCE||q.get("response_type")!=="code"||q.get("code_challenge_method")!=="S256"||!validChallenge(q.get("code_challenge")||"")||!scope)return fail("invalid_request");
      const bearer=req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
      if(!bearer)return fail("access_denied",401);
      const userDb=createClient(dbUrl,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+bearer}}});
      const user=await userDb.auth.getUser(bearer);if(user.error||!user.data.user)return fail("access_denied",401);
      const owner=user.data.user.id;
      const w=await userDb.from("namina_business_workspaces").select("id").eq("owner_id",owner).maybeSingle();
      if(w.error||!w.data)return fail("access_denied",403);
      const generation=await db.from("namina_business_access_keys").select("rotated_at").eq("workspace_id",w.data.id).is("revoked_at",null).maybeSingle();
      const valid=await userDb.rpc("namina_business_session_valid",{p_workspace_id:w.data.id});
      if(generation.error||!generation.data||valid.error||valid.data!==true)return fail("access_denied",403);
      const redirect=new URL(c.redirect);if(q.has("state"))redirect.searchParams.set("state",q.get("state")!);
      if(q.get("decision")==="deny"){redirect.searchParams.set("error","access_denied");return send(200,{redirect:redirect.toString()});}
      if(q.get("decision")!=="approve")return fail("invalid_request");
      const code=randomBytes(32).toString("base64url");
      const issue=await db.rpc("namina_mcp_issue_code",{p_owner:owner,p_workspace:w.data.id,p_generation:generation.data.rotated_at,p_code_hash:sha256(code),p_client:id,p_redirect:c.redirect,p_resource:MCP_RESOURCE,p_challenge:q.get("code_challenge"),p_scope:scope==="namina:draft"?"draft":"read",p_label:c.redirect.startsWith("https://claude.ai/")?"Claude OAuth":"ChatGPT OAuth"});
      if(issue.error||issue.data!==true)return fail("temporarily_unavailable",503);
      redirect.searchParams.set("code",code);return send(200,{redirect:redirect.toString()});
    }
    if(action==="token"){
      const q=parameters(raw);let id=q.get("client_id")||"",secret=q.get("client_secret")??undefined,method:"none"|"client_secret_post"|"client_secret_basic"=secret===undefined?"none":"client_secret_post";
      if(req.headers.authorization?.startsWith("Basic ")){
        if(secret!==undefined)return fail("invalid_client",401);
        const decoded=Buffer.from(req.headers.authorization.slice(6),"base64").toString("utf8"),i=decoded.indexOf(":");if(i<1)return fail("invalid_client",401);
        const basicId=decodeURIComponent(decoded.slice(0,i));if(id&&id!==basicId)return fail("invalid_client",401);
        id=basicId;secret=decodeURIComponent(decoded.slice(i+1));method="client_secret_basic";
      }
      const c=decodeClient(key,id);if(!c||!validateClientSecret(key,id,c,secret,method))return fail("invalid_client",401);
      const code=q.get("code")||"",verifier=q.get("code_verifier")||"";
      if(q.get("grant_type")!=="authorization_code")return fail("unsupported_grant_type");
      if(q.get("redirect_uri")!==c.redirect||q.get("resource")!==MCP_RESOURCE||!validVerifier(verifier)||!/^[A-Za-z0-9_-]{43}$/.test(code))return fail("invalid_grant");
      const access="nmn_"+randomBytes(32).toString("base64url");
      const r=await db.rpc("namina_mcp_exchange_code",{p_code_hash:sha256(code),p_client:id,p_redirect:c.redirect,p_resource:MCP_RESOURCE,p_challenge:pkce(verifier),p_token_hash:sha256(access)});
      if(r.error)return fail("temporarily_unavailable",503);
      if(!["read","draft"].includes(r.data?.scope))return fail("invalid_grant");
      return send(200,{access_token:access,token_type:"Bearer",expires_in:2592000,scope:"namina:"+r.data.scope});
    }
    return fail("invalid_request");
  }catch{return fail("invalid_request");}
}
