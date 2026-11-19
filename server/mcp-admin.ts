import {z} from "zod";
import {slugSchema} from "../src/domain/content.js";
import {siteDocumentSchema} from "../src/static/sites.js";
export const scopes=z.enum(["websites","partners","both"]);
export type AdminScope=z.infer<typeof scopes>;
export const uuid=z.uuid();
const phone=z.string().trim().regex(/^62[0-9]{8,14}$/);
const name=z.string().trim().min(2).max(100);
export const operationSchemas={
 publish:z.object({slug:slugSchema,updated_at:z.iso.datetime({offset:true})}).strict(),
 create_partner:z.object({name,email:z.email().max(254),whatsapp:phone}).strict(),
 edit_partner:z.object({workspace_id:uuid,name,whatsapp:phone}).strict(),
 extend_partner:z.object({workspace_id:uuid,days:z.number().int().min(1).max(365).default(365)}).strict(),
 rotate_link:z.object({workspace_id:uuid}).strict(),
 revoke_link:z.object({workspace_id:uuid}).strict(),
 revoke_partner_mcp:z.object({workspace_id:uuid}).strict(),
 set_partner_quota:z.object({workspace_id:uuid,max_sites:z.number().int().min(1).max(100)}).strict(),
};
export type Operation=keyof typeof operationSchemas;
export const allowed=(scope:AdminScope,category:"websites"|"partners")=>scope==="both"||scope===category;
export const operationCategory=(op:Operation)=>op==="publish"?"websites":"partners";
export const isOperation=(value:unknown):value is Operation=>typeof value==="string"&&Object.hasOwn(operationSchemas,value);
export const saveDraftSchema=z.object({document:siteDocumentSchema,base_sha:z.string().max(100).nullable(),updated_at:z.iso.datetime({offset:true}).nullable()}).strict();
export const keySchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("list")}).strict(),
 z.object({action:z.literal("create"),label:z.string().trim().min(1).max(80),scope:scopes}).strict(),
 z.object({action:z.literal("revoke"),id:uuid}).strict(),
 z.object({action:z.literal("requests")}).strict(),
 z.object({action:z.enum(["approve","reject"]),id:uuid}).strict(),
]);
export const adminTools=[
 {name:"list_websites",category:"websites",read:true,description:"List central and partner websites and AI drafts.",schema:z.object({limit:z.number().int().min(1).max(100).default(50),offset:z.number().int().min(0).default(0)}).strict()},
 {name:"get_website",category:"websites",read:true,description:"Get central private draft or a published website by slug.",schema:z.object({slug:slugSchema}).strict()},
 {name:"save_draft",category:"websites",read:false,description:"Save central private draft. Use base_sha from published source or null for new site; use updated_at from existing draft or null for first save.",schema:saveDraftSchema},
 {name:"list_partners",category:"partners",read:true,description:"List partner workspaces and subscription metadata.",schema:z.object({limit:z.number().int().min(1).max(100).default(50),offset:z.number().int().min(0).default(0)}).strict()},
 ...Object.entries(operationSchemas).map(([name,schema])=>({name,category:operationCategory(name as Operation),read:false,description:"Request "+name.replaceAll("_"," ")+"; requires explicit human approval in Studio Admin before execution.",schema})),
 {name:"get_request",category:"both",read:true,description:"Check status of a request created by this agent. Private access links are never returned.",schema:z.object({id:uuid}).strict()},
] as const;
