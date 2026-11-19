import { createDoctorTemplate, setDoctorAppearance, setChibiAppearance, setWeddingAppearance, setOriginalAppearance, setOriginalWhiteAppearance } from "./doctorTemplate.js";
import { createChibiTemplate } from "./chibiTemplate.js";
import { createWeddingTemplate } from "./weddingTemplate.js";
import { createWedding2Template } from "./wedding2Template.js";
import { loadViniTemplate, siteDocumentSchema, siteTemplateSnapshotSchema, type SiteDocument } from "./sites.js";

export type TemplateKey = "original" | "original-white" | "doctor" | "chibi" | "wedding" | "wedding2";

export type TemplateInfo = {
  id: TemplateKey;
  name: string;
  category: string;
  description: string;
  demo: string;
  headline: string;
  subtitle: string;
  palette: { background: string; accent: string; text: string };
  menus: readonly [string, string, string, string, string];
};

/** Available templates are shared by administrator and partner Studio. */
export const templateCatalog: readonly TemplateInfo[] = [
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
  switch (id) {
    case "doctor": return createDoctorTemplate(slug);
    case "chibi": return createChibiTemplate(slug);
    case "wedding": return createWeddingTemplate(slug);
    case "wedding2": return createWedding2Template(slug);
    case "original": return setOriginalAppearance(await loadViniTemplate(slug));
    case "original-white": return setOriginalWhiteAppearance(await loadViniTemplate(slug));
  }
}

/** Changing a client's appearance preserves their copy, photo, video, and gallery. */
export function applySiteAppearance(site: SiteDocument, id: TemplateKey): SiteDocument {
  switch (id) {
    case "doctor": return setDoctorAppearance(site);
    case "chibi": return setChibiAppearance(site);
    case "wedding": return setWeddingAppearance(site);
    case "wedding2": return siteDocumentSchema.parse({ ...setWeddingAppearance(site), presentation: "wedding2" });
    case "original": return setOriginalAppearance(site);
    case "original-white": return setOriginalWhiteAppearance(site);
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
  if (current === id) return siteDocumentSchema.parse(structuredClone(site));
  const snapshot = (source: SiteDocument) => siteTemplateSnapshotSchema.parse({
    presentation: source.presentation,
    content: structuredClone(source.content),
    media: structuredClone(source.media),
    ...(source.weddingDesign ? { weddingDesign: structuredClone(source.weddingDesign) } : {}),
  });
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
  if (site.presentation && site.presentation !== "original") return site.presentation;
  return site.content.original?.style?.backgroundColor?.toLowerCase() === "#ffffff"
    ? "original-white" : "original";
}
