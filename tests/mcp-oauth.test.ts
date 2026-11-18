import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
import {registerClient,decodeClient,validateClientSecret,pkce,validVerifier,validRedirect,parseRequestedScope,resourceMetadata,MCP_RESOURCE,sha256} from "../server/mcp-oauth.js";

test("OAuth clients, PKCE and resource restrictions",()=>{
 const key="test-secret-".repeat(4),redirect="https://claude.ai/api/mcp/auth_callback";
 const c=registerClient(key,redirect,"client_secret_post");
 const decoded=decodeClient(key,c.client_id)!;
 assert.equal(decoded.redirect,redirect);
 assert.ok(validateClientSecret(key,c.client_id,decoded,c.client_secret,"client_secret_post"));
 assert.ok(!validateClientSecret(key,c.client_id,decoded,"wrong","client_secret_post"));
 assert.equal(decodeClient(key,c.client_id+"x"),null);
 assert.equal(validRedirect("https://claude.ai.evil.example/api/mcp/auth_callback"),false);
 assert.throws(()=>registerClient(key,"https://example.org","none"));
 assert.equal(parseRequestedScope("namina:read namina:draft"),"namina:draft");
 assert.equal(parseRequestedScope("admin"),null);
 assert.ok(validVerifier("a".repeat(43)));
 assert.equal(pkce("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),"E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
 assert.equal(resourceMetadata().resource,MCP_RESOURCE);
});
test("OAuth code is resource-bound and single-use",async()=>{
 const db=new PGlite(),w="11111111-1111-4111-8111-111111111111",owner="22222222-2222-4222-8222-222222222222",generation="2026-01-01T00:00:00Z";
 try{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
   create table public.namina_business_workspaces(id uuid primary key,owner_id uuid,subscription_status text);
   create table public.namina_business_access_keys(workspace_id uuid primary key,rotated_at timestamptz,revoked_at timestamptz);
   create table public.namina_business_sites(id uuid primary key,workspace_id uuid,slug text,document jsonb,updated_at timestamptz,published_sha text);
   grant all on public.namina_business_workspaces,public.namina_business_access_keys,public.namina_business_sites to service_role;
   insert into public.namina_business_workspaces values ('${w}','${owner}','active');
   insert into public.namina_business_access_keys values ('${w}','${generation}',null);`);
  await db.exec(await readFile("supabase/mcp-preview.sql","utf8"));
  await db.exec(await readFile("supabase/mcp-oauth-preview.sql","utf8"));
  await db.exec("set role service_role");
  const code=sha256("code"), challenge=pkce("a".repeat(43)),redirect="https://claude.ai/api/mcp/auth_callback";
  const issued=await db.query<{ok:boolean}>("select public.namina_mcp_issue_code($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ok",[owner,w,generation,code,"client",redirect,MCP_RESOURCE,challenge,"read","Claude"]);
  assert.equal(issued.rows[0].ok,true);
  const exchange=async(resource:string,proof:string,client="client")=>(await db.query<{result:Record<string,unknown>}>("select public.namina_mcp_exchange_code($1,$2,$3,$4,$5,$6) result",[code,client,redirect,resource,proof,sha256("token")])).rows[0].result;
  assert.equal((await exchange("https://other.example",challenge)).error,"invalid_grant");
  assert.equal((await exchange(MCP_RESOURCE,pkce("b".repeat(43)))).error,"invalid_grant");
  assert.equal((await exchange(MCP_RESOURCE,challenge,"other")).error,"invalid_grant");
  assert.equal((await exchange(MCP_RESOURCE,challenge)).scope,"read");
  assert.equal((await exchange(MCP_RESOURCE,challenge)).error,"invalid_grant");
 }finally{await db.close();}
});
