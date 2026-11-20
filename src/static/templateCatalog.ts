import { createDoctorTemplate, setDoctorAppearance, setChibiAppearance, setWeddingAppearance, setOriginalAppearance, setOriginalWhiteAppearance } from "./doctorTemplate.js";
import { createChibiTemplate } from "./chibiTemplate.js";
import { createWeddingTemplate } from "./weddingTemplate.js";
import { createWedding2Template } from "./wedding2Template.js";
import { createFamilyTemplate } from "./familyTemplate.js";
import { defaultFamilyDesign } from "./familyDesign.js";
import { createFamilySample } from "./familySample.js";
import { blankSite, loadViniTemplate, siteDocumentSchema, siteTemplateSnapshotSchema, type SiteDocument } from "./sites.js";

import {factoryCatalogEntrySchema,factorySpecSchema,isFactoryKey,instantiateFactory,type FactoryKey,type FactoryEntry} from "./factoryTemplates.js";
import {z} from "zod";
export type BuiltInTemplateKey = "original" | "original-white" | "doctor" | "chibi" | "wedding" | "wedding2" | "hari-anak-sedunia";
export type TemplateKey = BuiltInTemplateKey | FactoryKey;

export type TemplateInfo = {
  id: TemplateKey;
  name: string;
  category: string;
  description: string;
  demo: string;
  headline: string;
  subtitle: string;
  palette: { background: string; accent: string; text: string };
  menus: readonly string[];
};

const factoryRegistry=new Map<FactoryKey,FactoryEntry>();
export const templateName=(id:TemplateKey)=>templateCatalog.find(t=>t.id===id)?.name||(isFactoryKey(id)?factoryRegistry.get(id)?.name:undefined)||id;
export async function loadFactoryCatalog():Promise<TemplateInfo[]>{
 const response=await fetch("/api/mcp-templates?action=catalog",{cache:"no-store"});
 if(!response.ok)throw Error("Factory catalog unavailable");
 const data=z.object({templates:z.array(factoryCatalogEntrySchema)}).parse(await response.json());
 return data.templates.filter(t=>isFactoryKey(t.id)).map(t=>{const id=t.id as FactoryKey;factoryRegistry.set(id,t);return {...t,id};});
}

/** Available templates are shared by administrator and partner Studio. */
export const templateCatalog: readonly TemplateInfo[] = [
  {id:"hari-anak-sedunia",name:"HARI ANAK SEDUNIA",category:"Family Legacy",description:"Intro video keluarga, dua profil sinematik, doa dan galeri foto looping.",demo:"/anaksedunia",headline:"HARI ANAK SEDUNIA",subtitle:"LOVE LEGACY",palette:{background:"#10151e",accent:"#f3d495",text:"#fff8ea"},menus:["Anak 1","Anak 2","Doa","Kenangan"]},
  {
    id: "original", name: "Original · Gelap", category: "Personal Branding",
    description: "Hitam-merah sinematik untuk profil profesional, bisnis, dan kreator.",
    demo: "/vini", headline: "TEH VINI", subtitle: "PEBISNIS DIGITAL",
    palette: { background: "#100c12", accent: "#d63b46", text: "#fff0e6" },
    menus: ["Nama", "Karir", "Skill", "Karya", "Produk"],
  },
  {
    id: "original-white", name: "Original · Putih", category: "Personal Branding",
    description: "Putih bersih dengan aksen merah, memakai layout /vini yang sama.",
    demo: "", headline: "TEH VINI", subtitle: "PEBISNIS DIGITAL",
    palette: { background: "#ffffff", accent: "#d52e3c", text: "#191919" },
    menus: ["Nama", "Karir", "Skill", "Karya", "Produk"],
  },
  {
    id: "doctor", name: "Dokter · Medical Teal", category: "Profil Dokter",
    description: "Putih klinis dan teal, mengikuti layout NAMINA original.",
    demo: "/dokter", headline: "dr. Arif Pratama", subtitle: "DOKTER UMUM",
    palette: { background: "#effcfd", accent: "#078e8d", text: "#16374a" },
    menus: ["Nama", "Karir", "Skill", "Karya", "Produk"],
  },
  {
    id: "chibi", name: "Chibi · Candy Pastel", category: "Karakter & Kreator",
    description: "Pastel ceria, font playful, dan tombol membulat.",
    demo: "/chibi", headline: "NINA CHIBI", subtitle: "KREATOR KARAKTER 3D",
    palette: { background: "#fff0fa", accent: "#f077ba", text: "#553357" },
    menus: ["Nama", "Karir", "Skill", "Karya", "Produk"],
  },
  {
    id: "wedding2", name: "Wedding · Living Paper", category: "Undangan Pernikahan",
    description: "Amplop 3D, intro video, bunga SVG, animasi kertas, dan undangan scroll khusus mobile.",
    demo: "/wedding2", headline: "Hizqil & Icaa", subtitle: "SAGE BLOOM",
    palette: { background: "#e7eade", accent: "#47654e", text: "#284432" },
    menus: ["Mempelai", "Acara", "Kisah", "Galeri", "Hadiah"],
  },
  {
    id: "wedding", name: "Wedding · Royal Ivory", category: "Undangan Pernikahan",
    description: "Ivory-emas dengan Love Story dan Amplop digital.",
    demo: "/wedding", headline: "Alya & Raka", subtitle: "OUR WEDDING DAY",
    palette: { background: "#f6ecdc", accent: "#b48a4f", text: "#664b34" },
    menus: ["Mempelai", "Acara", "Kisah", "Amplop", "Love Story"],
  },
];

export async function createSiteFromTemplate(slug: string, id: TemplateKey): Promise<SiteDocument> {
  if(isFactoryKey(id)){
    const [,key,version]=id.split(":");
    const response=await fetch("/api/mcp-templates?action=demo&slug="+encodeURIComponent(key)+"&version="+encodeURIComponent(version),{cache:"no-store"});
    if(!response.ok)throw Error("Template Factory tidak tersedia.");
    const spec=z.object({spec:factorySpecSchema}).parse(await response.json()).spec;
    return instantiateFactory(spec.document,slug,id);
  }
  switch (id) {
    case "doctor": return createDoctorTemplate(slug);
    case "chibi": return createChibiTemplate(slug);
    case "wedding": return createWeddingTemplate(slug);
    case "wedding2": return createWedding2Template(slug);
    case "hari-anak-sedunia": return createFamilyTemplate(slug);
    case "original": return setOriginalAppearance(await loadViniTemplate(slug));
    case "original-white": return setOriginalWhiteAppearance(await loadViniTemplate(slug));
    default: throw Error("Unknown template");
  }
}

/** Changing a client's appearance preserves their copy, photo, video, and gallery. */
export function applySiteAppearance(site: SiteDocument, id: TemplateKey): SiteDocument {
  if(isFactoryKey(id)){
    const entry=factoryRegistry.get(id);
    if(!entry)throw Error("Muat ulang katalog Template Factory terlebih dahulu.");
    const next=setOriginalAppearance(site);if(!next.content.original)throw Error("Original editor required");
    next.content.original.style=structuredClone(entry.style);next.factoryTemplate=id;
    return siteDocumentSchema.parse(next);
  }
  site=structuredClone(site);delete site.factoryTemplate;
  switch (id) {
    case "doctor": return setDoctorAppearance(site);
    case "chibi": return setChibiAppearance(site);
    case "wedding": return setWeddingAppearance(site);
    case "wedding2": return siteDocumentSchema.parse({ ...setWeddingAppearance(site), presentation: "wedding2" });
    case "hari-anak-sedunia": return siteDocumentSchema.parse({...site,presentation:id,familyDesign:site.familyDesign||createFamilySample()});
    case "original": return setOriginalAppearance(site);
    case "original-white": return setOriginalWhiteAppearance(site);
    default: throw Error("Unknown template");
  }
}


/**
 * Switch the design of the CURRENT slug (including /vini). Unlike creation,
 * this operation never allocates a new URL or publishes to the database.
 * Separate personal/wedding snapshots keep both categories editable, even
 * after an intentional publish of the newly selected template.
 */
export function switchSiteTemplate(site: SiteDocument, id: TemplateKey): SiteDocument {
  const current = selectedTemplate(site);
  if (current === id) {
    const copy=structuredClone(site);
    if(id==="hari-anak-sedunia"&&(!copy.familyDesign||JSON.stringify(copy.familyDesign)===JSON.stringify(defaultFamilyDesign())))copy.familyDesign=createFamilySample();
    return siteDocumentSchema.parse(copy);
  }
  const snapshot = (source: SiteDocument) => siteTemplateSnapshotSchema.parse({
    presentation: source.presentation,
    ...(source.factoryTemplate ? {factoryTemplate:source.factoryTemplate}:{}),
    content: structuredClone(source.content),
    media: structuredClone(source.media),
    ...(source.weddingDesign ? { weddingDesign: structuredClone(source.weddingDesign) } : {}),
    ...(source.familyDesign ? { familyDesign: structuredClone(source.familyDesign) } : {}),
  });
  if(id==="hari-anak-sedunia"||current==="hari-anak-sedunia") {
    const category=(key:TemplateKey)=>key==="hari-anak-sedunia"?"family":key==="wedding2"?"wedding":"personal";
    const archives={...site.templateSnapshots,[category(current)]:snapshot(site)};
    const stored=archives[category(id)];
    const target=stored?siteDocumentSchema.parse({...structuredClone(stored),slug:site.slug}):id==="hari-anak-sedunia"?createFamilyTemplate(site.slug):id==="wedding2"?createWedding2Template(site.slug):blankSite(site.slug);
    if(id==="hari-anak-sedunia"&&(!target.familyDesign||JSON.stringify(target.familyDesign)===JSON.stringify(defaultFamilyDesign())))target.familyDesign=createFamilySample();
    const next=id==="hari-anak-sedunia"||id==="wedding2"?target:applySiteAppearance(target,id);
    return siteDocumentSchema.parse({...next,templateSnapshots:archives});
  }
  if (id === "wedding2") {
    const archives = {
      ...site.templateSnapshots,
      personal: snapshot(site),
    };
    const wedding = archives.wedding
      ? { ...structuredClone(archives.wedding), slug: site.slug }
      : createWedding2Template(site.slug);
    return siteDocumentSchema.parse({
      ...wedding, slug: site.slug, presentation: "wedding2",
      templateSnapshots: archives,
    });
  }
  if (current === "wedding2") {
    const archives = { ...site.templateSnapshots, wedding: snapshot(site) };
    const restored = archives.personal
      ? { ...structuredClone(archives.personal), slug: site.slug }
      : siteDocumentSchema.parse(structuredClone(site));
    const updated = applySiteAppearance(siteDocumentSchema.parse(restored), id);
    return siteDocumentSchema.parse({ ...updated, templateSnapshots: archives });
  }
  return siteDocumentSchema.parse(applySiteAppearance(site, id));
}

/** Old manual white-mode sites should show the matching template selection. */
export function selectedTemplate(site: SiteDocument): TemplateKey {
  if (site.factoryTemplate && isFactoryKey(site.factoryTemplate) && site.presentation==="original") return site.factoryTemplate;
  if (site.presentation && site.presentation !== "original") return site.presentation;
  return site.content.original?.style?.backgroundColor?.toLowerCase() === "#ffffff"
    ? "original-white" : "original";
}
