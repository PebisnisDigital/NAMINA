import {test} from "node:test";
import assert from "node:assert/strict";
import type {IncomingMessage,ServerResponse} from "node:http";
import handler from "../api/mcp-admin.js";
import control from "../api/mcp-admin-control.js";
import {allowed,operationSchemas,adminTools} from "../server/mcp-admin.js";
import {z} from "zod";

test("admin MCP rejects partner credentials and cannot self-approve",async()=>{
 const saved=process.env.NAMINA_ADMIN_MCP_ENABLED;
 let status=0;
 const res={setHeader(){},set statusCode(v:number){status=v;},end(){}} as unknown as ServerResponse;
 const req={method:"POST",headers:{authorization:"Bearer nmn_"+"a".repeat(43)},body:{jsonrpc:"2.0",id:1,method:"tools/list"}} as unknown as IncomingMessage;
 try{
  delete process.env.NAMINA_ADMIN_MCP_ENABLED;await handler(req,res);assert.equal(status,503);
  process.env.NAMINA_ADMIN_MCP_ENABLED="true";await handler(req,res);assert.equal(status,401);
  await control({method:"POST",headers:{origin:"https://namina.biz.id"},body:{action:"approve"}} as unknown as IncomingMessage,res);assert.equal(status,401);
 }finally{if(saved===undefined)delete process.env.NAMINA_ADMIN_MCP_ENABLED;else process.env.NAMINA_ADMIN_MCP_ENABLED=saved;}
});
test("admin scope and partner actions are bounded",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 assert.equal(allowed("websites","partners"),false);assert.equal(allowed("partners","websites"),false);assert.equal(allowed("both","partners"),true);
 assert.equal(operationSchemas.extend_partner.safeParse({workspace_id:id,days:366}).success,false);
 assert.equal(operationSchemas.extend_partner.parse({workspace_id:id}).days,365);
 assert.equal(operationSchemas.set_partner_quota.safeParse({workspace_id:id,max_sites:101}).success,false);
 assert.equal(operationSchemas.edit_partner.safeParse({workspace_id:id,name:"Test",whatsapp:"628123456789",role:"superadmin"}).success,false);
 assert.equal(adminTools.some(t=>t.name==="approve"||t.name==="grant_admin"),false);
 for(const t of adminTools)assert.equal(z.toJSONSchema(t.schema).type,"object");
});
