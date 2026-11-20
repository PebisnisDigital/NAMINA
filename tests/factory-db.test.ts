import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
test("Factory keys require active superadmin owner and deny direct table access",async()=>{
 const db=new PGlite(),a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create table public.namana_roles(user_id uuid primary key,role text);create table public.namana_profiles(user_id uuid primary key,status text);grant select on public.namana_roles,public.namana_profiles to service_role;insert into auth.users values ('${a}'),('${b}');insert into public.namana_roles values ('${a}','superadmin');insert into public.namana_profiles values ('${a}','active'),('${b}','active');`);
 await db.exec(await readFile("supabase/mcp-templates-preview.sql","utf8"));
 const h="a".repeat(64),j="b".repeat(64);
 await db.query("insert into public.namina_template_agent_keys(owner_id,label,token_hash) values($1,'R&D',$2),($3,'Partner',$4)",[a,h,b,j]);
 await db.exec("set role service_role");
 const auth=async(token:string)=>(await db.query<{result:Record<string,unknown>}>("select public.namina_template_agent_auth($1) result",[token])).rows[0].result;
 assert.equal((await auth(h)).owner_id,a);assert.equal((await auth(j)).error,"unauthorized");
 await db.exec("reset role;set role authenticated");
 await assert.rejects(db.query("select * from public.namina_factory_templates"));
 await assert.rejects(db.query("select * from public.namina_template_agent_keys"));
 await assert.rejects(db.query("select public.namina_template_agent_auth($1)",[h]));
 await db.exec("reset role");
 await db.query("update public.namina_template_agent_keys set revoked_at=now() where owner_id=$1",[a]);
 await db.exec("set role service_role");assert.equal((await auth(h)).error,"unauthorized");
 }finally{await db.close();}
});
