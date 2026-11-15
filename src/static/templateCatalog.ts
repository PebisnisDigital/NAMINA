import { createDoctorTemplate, setDoctorAppearance, setChibiAppearance, setWeddingAppearance, setOriginalAppearance } from "./doctorTemplate";
import { createChibiTemplate } from "./chibiTemplate";
import { createWeddingTemplate } from "./weddingTemplate";
import { loadViniTemplate, type SiteDocument } from "./sites";

export type TemplateKey = "original" | "doctor" | "chibi" | "wedding";

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

/** One catalog shared by administrator and partner Studio. */
export const templateCatalog: readonly TemplateInfo[] = [
  {
    id: "original", name: "Original NAMINA", category: "Personal Branding",
    description: "Hitam-merah sinematik untuk profil profesional, bisnis, dan kreator.",
    demo: "/vini", headline: "TEH VINI", subtitle: "PEBISNIS DIGITAL",
    palette: { background: "#100c12", accent: "#d63b46", text: "#fff0e6" },
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
    case "original": return loadViniTemplate(slug);
  }
}

/** Changing a client's appearance preserves their copy, photo, video, and gallery. */
export function applySiteAppearance(site: SiteDocument, id: TemplateKey): SiteDocument {
  switch (id) {
    case "doctor": return setDoctorAppearance(site);
    case "chibi": return setChibiAppearance(site);
    case "wedding": return setWeddingAppearance(site);
    case "original": return setOriginalAppearance(site);
  }
}
