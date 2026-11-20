import {z} from "zod";
import {slugSchema,originalStyleSchema} from "../domain/content.js";
import {siteDocumentSchema,type SiteDocument} from "./sites.js";
export const factorySlug=z.string().regex(/^[a-z0-9][a-z0-9-]{2,38}[a-z0-9]$/);
export const factoryKeySchema=z.string().regex(/^factory:[a-z0-9][a-z0-9-]{2,38}[a-z0-9]:[1-9][0-9]{0,5}$/);
export type FactoryKey=`factory:${string}`;
export const isFactoryKey=(value:string):value is FactoryKey=>factoryKeySchema.safeParse(value).success;
export const factoryDocumentSchema=siteDocumentSchema.refine(d=>d.presentation==="original"&&!!d.content.original?.style&&!d.templateSnapshots&&!d.factoryTemplate&&!d.weddingDesign&&!d.familyDesign,"Factory v1 requires a plain Original editor document with explicit style");
export const factorySpecSchema=z.object({
 slug:factorySlug,name:z.string().trim().min(3).max(80),category:z.string().trim().min(2).max(60),
 description:z.string().trim().min(10).max(300),document:factoryDocumentSchema,
}).strict().refine(v=>v.slug===v.document.slug,"Document slug must equal template slug");
export const factoryCatalogEntrySchema=z.object({
 id:factoryKeySchema,name:z.string(),category:z.string(),description:z.string(),demo:z.string(),
 headline:z.string(),subtitle:z.string(),palette:z.object({background:z.string(),accent:z.string(),text:z.string()}),
 menus:z.array(z.string()),style:originalStyleSchema,
});
export type FactoryEntry=z.infer<typeof factoryCatalogEntrySchema>;
export function factoryEntry(spec:z.infer<typeof factorySpecSchema>,version:number):FactoryEntry{
 const o=spec.document.content.original!,style=o.style!;
 return factoryCatalogEntrySchema.parse({id:"factory:"+spec.slug+":"+version,name:spec.name,category:spec.category,description:spec.description,demo:"/template-demo/"+spec.slug+"/"+version,headline:spec.document.content.identity.displayName,subtitle:spec.document.content.identity.profession,palette:{background:style.backgroundColor,accent:style.accentColor,text:style.textColor},menus:["nama","karir","skill","karya","produk"].map(k=>o.menuTitles?.[k as keyof NonNullable<typeof o.menuTitles>]||k),style});
}
export function instantiateFactory(document:SiteDocument,slug:string,key:FactoryKey):SiteDocument{
 return siteDocumentSchema.parse({...structuredClone(document),slug:slugSchema.parse(slug),factoryTemplate:factoryKeySchema.parse(key)});
}
