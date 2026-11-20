import {test} from "node:test";
import assert from "node:assert/strict";
import {defaultContent} from "../src/domain/content.js";
import {blankOriginal} from "../src/static/originalSeed.js";
import {originalStyleDefaults} from "../src/static/originalStyle.js";
import {factorySpecSchema,factoryEntry,instantiateFactory} from "../src/static/factoryTemplates.js";
import {prepareSite,siteDocumentSchema} from "../src/static/sites.js";
import {selectedTemplate,switchSiteTemplate} from "../src/static/templateCatalog.js";
import handler from "../api/mcp-templates.js";
import type {IncomingMessage,ServerResponse} from "node:http";
const fixture=()=>factorySpecSchema.parse({slug:"executive-demo",name:"Executive",category:"Professional",description:"Fictional demo for executive portfolio.",document:prepareSite({slug:"executive-demo",presentation:"original",content:{...structuredClone(defaultContent),original:{...blankOriginal("Demo"),style:{...originalStyleDefaults,layoutPreset:"center",backgroundColor:"#171717"}}},media:{desktopVideo:"",mobileVideo:"",poster:"",portrait:"",cards:{}}})});
test("factory creates independent native Studio documents with a pinned version",()=>{
 const spec=fixture(),entry=factoryEntry(spec,1),site=instantiateFactory(spec.document,"client-demo","factory:executive-demo:1");
 assert.equal(entry.demo,"/template-demo/executive-demo/1");
 assert.equal(selectedTemplate(site),"factory:executive-demo:1");
 site.content.identity.displayName="Changed";
 assert.notEqual(spec.document.content.identity.displayName,site.content.identity.displayName);
 assert.equal(siteDocumentSchema.parse(prepareSite(site)).factoryTemplate,"factory:executive-demo:1");
 const restored=switchSiteTemplate(site,"original");
 assert.equal(restored.factoryTemplate,undefined);
 assert.equal(restored.content.identity.displayName,"Changed");
});
test("factory rejects unsupported presentations and invalid CSS style values",()=>{
 const spec=fixture();
 assert.equal(factorySpecSchema.safeParse({...spec,document:{...spec.document,presentation:"wedding2"}}).success,false);
 assert.equal(factorySpecSchema.safeParse({...spec,document:{...spec.document,factoryTemplate:"factory:old-demo:1"}}).success,false);
 spec.document.content.original!.style!.backgroundColor="url(javascript:alert(1))";
 assert.equal(factorySpecSchema.safeParse(spec).success,false);
});
test("factory disabled by default and public catalog remains empty",async()=>{
 const previous=process.env.NAMINA_TEMPLATE_MCP_ENABLED;
 delete process.env.NAMINA_TEMPLATE_MCP_ENABLED;
 let status=0,body="";
 const res={setHeader(){},set statusCode(v:number){status=v;},end(v?:string){body=v||"";}} as unknown as ServerResponse;
 try{
 await handler({url:"/api/mcp-templates",method:"POST",headers:{}} as IncomingMessage,res);assert.equal(status,503);
 await handler({url:"/api/mcp-templates?action=catalog",method:"GET",headers:{}} as IncomingMessage,res);assert.equal(status,200);assert.deepEqual(JSON.parse(body),{templates:[]});
 }finally{if(previous!==undefined)process.env.NAMINA_TEMPLATE_MCP_ENABLED=previous;}
});
