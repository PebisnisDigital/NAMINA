import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
test("admin key auth fails closed for non-admin, suspended, expired and revoked owners",async()=>{
 const db=new PGlite();
 const admin="11111111-1111-4111-8111-111111111111",partner="22222222-2222-4222-8222-222222222222";
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key);
  create table public.namana_roles(user_id uuid primary key,role text);
  create table public.namana_profiles(user_id uuid primary key,status text);
  grant select on public.namana_roles,public.namana_profiles to service_role;
  insert into auth.users values ('${admin}'),('${partner}');
  insert into public.namana_roles values ('${admin}','superadmin'),('${partner}','partner');
  insert into public.namana_profiles values ('${admin}','active'),('${partner}','active');`);
  await db.exec(await readFile("supabase/mcp-admin-preview.sql","utf8"));
  const good="a".repeat(64),bad="b".repeat(64);
  await db.query("insert into public.namina_admin_mcp_keys(owner_id,label,token_hash,scope) values($1,'Admin',$2,'both'),($3,'Partner',$4,'both')",[admin,good,partner,bad]);
  await db.exec("set role service_role");
  const auth=async(hash:string)=>(await db.query<{result:Record<string,unknown>}>("select public.namina_admin_mcp_auth($1) result",[hash])).rows[0].result;
  assert.equal((await auth(good)).scope,"both");
  assert.equal((await auth(bad)).error,"unauthorized");
  assert.equal((await auth("c".repeat(64))).error,"unauthorized");
  await db.exec("reset role; set role authenticated");
  await assert.rejects(db.query("select * from public.namina_admin_mcp_keys"));
  await assert.rejects(db.query("select public.namina_admin_mcp_auth($1)",[good]));
  await db.exec("reset role");
  await db.query("update public.namana_profiles set status='suspended' where user_id=$1",[admin]);
  await db.exec("set role service_role");assert.equal((await auth(good)).error,"unauthorized");
  await db.exec("reset role");await db.query("update public.namana_profiles set status='active' where user_id=$1",[admin]);
  await db.query("update public.namina_admin_mcp_keys set expires_at=now()-interval '1 day' where owner_id=$1",[admin]);
  await db.exec("set role service_role");assert.equal((await auth(good)).error,"unauthorized");
  await db.exec("reset role");await db.query("update public.namina_admin_mcp_keys set expires_at=now()+interval '1 day',revoked_at=now() where owner_id=$1",[admin]);
  await db.exec("set role service_role");assert.equal((await auth(good)).error,"unauthorized");
 }finally{await db.close();}
});
