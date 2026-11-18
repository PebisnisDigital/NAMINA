import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("MCP key operations enforce scope and tenant boundaries", async () => {
  const db = new PGlite();
  const a="11111111-1111-4111-8111-111111111111", b="22222222-2222-4222-8222-222222222222";
  const owner="33333333-3333-4333-8333-333333333333", other="44444444-4444-4444-8444-444444444444";
  const generation="2026-01-01T00:00:00Z";
  const read="a".repeat(64), draft="b".repeat(64);
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create table public.namina_business_workspaces(id uuid primary key,owner_id uuid,subscription_status text);
      create table public.namina_business_access_keys(workspace_id uuid primary key,rotated_at timestamptz,revoked_at timestamptz);
      create table public.namina_business_sites(id uuid primary key default gen_random_uuid(),workspace_id uuid,slug text,document jsonb,updated_at timestamptz default now(),published_sha text);
      grant all on public.namina_business_workspaces,public.namina_business_access_keys,public.namina_business_sites to service_role;
      insert into public.namina_business_workspaces values ('${a}','${owner}','active'),('${b}','${other}','active');
      insert into public.namina_business_access_keys values ('${a}','${generation}',null),('${b}','${generation}',null);
      insert into public.namina_business_sites(id,workspace_id,slug,document) values ('${b}','${b}','other-site','{}');
    `);
    await db.exec(await readFile("supabase/mcp-preview.sql","utf8"));
    await db.exec("set role service_role");
    async function call(sql:string, params:unknown[]) {
      const result=await db.query<{result:Record<string,unknown>}>(sql,params);
      return result.rows[0].result;
    }
    for (const [hash,scope] of [[read,"read"],[draft,"draft"]]) {
      const created=await call("select public.namina_mcp_manage($1,$2,$3,'create',null,'Test',$4,$5) result",[owner,a,generation,scope,hash]);
      assert.ok(created.key);
    }
    const op=(hash:string,action:string,id:string|null=null,doc:object|null=null)=>call("select public.namina_mcp_operation($1,$2,$3,$4,null) result",[hash,action,id,doc?JSON.stringify(doc):null]);
    assert.deepEqual(await op(read,"list"),{data:[]});
    assert.equal((await op(read,"get",b)).error,"site_unavailable_or_changed");
    const document={slug:"my-site",content:{},media:{}};
    assert.equal((await op(read,"create",null,document)).error,"forbidden");
    assert.ok((await op(draft,"create",null,document)).data);
    assert.equal((await op(draft,"update",b,document)).error,"site_unavailable_or_changed");
    const keys=await call("select public.namina_mcp_manage($1,$2,$3,'list') result",[owner,a,generation]);
    assert.equal((keys.keys as unknown[]).length,2);
    assert.ok(!JSON.stringify(keys).includes(draft));
    const keyId=(keys.keys as {id:string;scope:string}[]).find(k=>k.scope==="draft")!.id;
    await call("select public.namina_mcp_manage($1,$2,$3,'revoke',$4) result",[owner,a,generation,keyId]);
    assert.equal((await op(draft,"authorize")).error,"unauthorized");
    await db.query("update public.namina_business_access_keys set rotated_at=now() where workspace_id=$1",[a]);
    assert.equal((await op(read,"authorize")).error,"unauthorized");
    await db.exec("reset role; set role authenticated");
    await assert.rejects(db.query("select * from public.namina_mcp_keys"));
    await assert.rejects(db.query("select public.namina_mcp_operation($1,'list')",[read]));
  } finally { await db.close(); }
});
