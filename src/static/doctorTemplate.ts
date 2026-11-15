import { siteDocumentSchema, cloneViniTemplate, type SiteDocument } from "./sites";
import { originalStyleDefaults } from "./originalStyle";

/** Appearance tokens only. The /vini layout, content and media never change. */
const medicalSkin = {
  backgroundColor: "#f4fbfc",
  textColor: "#153248",
  accentColor: "#078d91",
  buttonColor: "#058e90",
  buttonTextColor: "#ffffff",
  borderColor: "#a5dadd",
  fontFamily: "poppins",
  buttonRadius: 24,
  buttonVariant: "solid",
} as const;
const chibiSkin = {
  backgroundColor: "#fff3fc",
  textColor: "#492b5b",
  accentColor: "#ef58a9",
  buttonColor: "#fa75bb",
  buttonTextColor: "#421c4d",
  borderColor: "#edb9e4",
  fontFamily: "fredoka",
  buttonRadius: 32,
  buttonVariant: "solid",
} as const;

const weddingSkin = {
  backgroundColor: "#f8f2e8",
  textColor: "#6b5139",
  accentColor: "#b48a4f",
  buttonColor: "#aa824c",
  buttonTextColor: "#ffffff",
  borderColor: "#d4bd93",
  fontFamily: "cormorant",
  buttonRadius: 28,
  buttonVariant: "solid",
} as const;

/** Exact light preset previously available in Design, now a persistent template. */
const originalWhiteSkin = {
  backgroundColor: "#ffffff",
  textColor: "#191919",
  accentColor: "#d52e3c",
  buttonColor: "#c62836",
  buttonTextColor: "#ffffff",
  borderColor: "#d8d8de",
  fontFamily: "montserrat",
  buttonRadius: 15,
  buttonVariant: "solid",
} as const;

const originalSkin = {
  backgroundColor: originalStyleDefaults.backgroundColor,
  textColor: originalStyleDefaults.textColor,
  accentColor: originalStyleDefaults.accentColor,
  buttonColor: originalStyleDefaults.buttonColor,
  buttonTextColor: originalStyleDefaults.buttonTextColor,
  borderColor: originalStyleDefaults.borderColor,
  fontFamily: originalStyleDefaults.fontFamily,
  buttonRadius: originalStyleDefaults.buttonRadius,
  buttonVariant: originalStyleDefaults.buttonVariant,
};
const weddingLabels = {
  nama: "Mempelai", karir: "Acara", skill: "Kisah", karya: "Amplop", produk: "Love Story",
} as const;
const historicalWeddingLabels = [
  { nama: "Mempelai", karir: "Acara", skill: "Kisah", karya: "Galeri", produk: "RSVP" },
  { nama: "Mempelai", karir: "Acara", skill: "Kisah", karya: "Amplop", produk: "Ucapan" },
  { nama: "Mempelai", karir: "Acara", skill: "Kisah", karya: "Ucapan", produk: "Amplop" },
] as const;
const originalLabels = {
  nama: "Nama", karir: "Karir", skill: "Skill", karya: "Karya", produk: "Produk",
} as const;
const sectionNames = ["nama", "karir", "skill", "karya", "produk"] as const;

function changeSkin(document: SiteDocument, presentation: "original" | "original-white" | "doctor" | "chibi" | "wedding"): SiteDocument {
  const next = structuredClone(document);
  next.presentation = presentation;
  if (next.content.original) {
    const section = next.content.original;
    const previousLabels = section.menuTitles ?? {};
    if (presentation === "wedding" && sectionNames.every(key =>
      !previousLabels[key] || previousLabels[key] === originalLabels[key] ||
      previousLabels[key] === weddingLabels[key] ||
      historicalWeddingLabels.some(old => old[key] === previousLabels[key]))) {
      section.menuTitles = { ...previousLabels, ...weddingLabels };
    } else if (presentation !== "wedding" && document.presentation === "wedding" && sectionNames.every(key =>
      previousLabels[key] === weddingLabels[key] ||
      historicalWeddingLabels.some(old => old[key] === previousLabels[key]))) {
      section.menuTitles = { ...previousLabels, ...originalLabels };
    }
    next.content.original.style = {
      ...originalStyleDefaults,
      ...next.content.original.style,
      ...(presentation === "doctor" ? medicalSkin : presentation === "chibi" ? chibiSkin : presentation === "wedding" ? weddingSkin : presentation === "original-white" ? originalWhiteSkin : originalSkin),
    };
  }
  return siteDocumentSchema.parse(next);
}
export const setDoctorAppearance = (document: SiteDocument): SiteDocument => changeSkin(document, "doctor");
export const setChibiAppearance = (document: SiteDocument): SiteDocument => changeSkin(document, "chibi");
export const setWeddingAppearance = (document: SiteDocument): SiteDocument => changeSkin(document, "wedding");
export const setOriginalAppearance = (document: SiteDocument): SiteDocument => changeSkin(document, "original");
export const setOriginalWhiteAppearance = (document: SiteDocument): SiteDocument => changeSkin(document, "original-white");

/** Fictitious sample for /dokter and new medical client sites. */
export function createDoctorTemplate(slug: string): SiteDocument {
  const site = cloneViniTemplate(slug);
  const o = site.content.original!;
  site.content.identity.displayName = "dr. Arif Pratama";
  site.content.identity.profession = "Dokter Umum";
  site.content.identity.bio = "Dokter contoh NAMINA, berfokus pada pelayanan preventif, edukasi kesehatan, dan gaya hidup sehat. Profil ini fiktif.";
  const fact = (label: string, value: string, icon = 8121295) => ({ id: crypto.randomUUID(), label, value, icon });
  const card = (title: string, description: string) => ({
    id: crypto.randomUUID(), title, description, color: "#078e8d",
    motif: "monogram" as const, link: "", imageAssetId: null,
  });
  o.contactUrl = ""; o.contactLabel = "Hubungi Saya"; o.contactMessage = "";
  o.nama = {
    intro: "Halo, perkenalkan nama saya adalah...", subtitle: "Profil Dokter",
    description: "Pelayanan Kesehatan • Edukasi Medis • Gaya Hidup Sehat",
    items: [fact("Nama", "dr. Arif Pratama"), fact("Domisili", "Jakarta (contoh)", 8121270),
      fact("Profesi", "Dokter Umum", 8121299), fact("Status", "Profil Demo", 8121312)],
  };
  o.karir = {
    intro: "Perjalanan profesi...", subtitle: "Perjalanan Profesi",
    description: "Contoh pengalaman dokter. Verifikasi riwayat pendidikan, izin praktik, dan tempat bekerja sebelum terbit.",
    items: [fact("Contoh kegiatan", "Pelayanan Kesehatan"), fact("Contoh kegiatan", "Edukasi Masyarakat"),
      fact("Contoh kegiatan", "Pengembangan Kompetensi")],
  };
  o.skill = {
    intro: "Keahlian dan fokus...", subtitle: "Keahlian & Fokus",
    description: "Contoh fokus kompetensi medis. Ganti dengan kompetensi yang terverifikasi.",
    items: [fact("Contoh keahlian", "Edukasi Kesehatan"), fact("Contoh keahlian", "Konseling Preventif"),
      fact("Contoh keahlian", "Pelayanan Umum")],
  };
  o.karya = {
    intro: "Kegiatan dan karya...", subtitle: "Karya & Kegiatan",
    description: "Contoh portofolio kegiatan dan konten edukasi kesehatan.",
    items: [card("Edukasi Hidup Sehat", "Contoh konten edukasi kesehatan."),
      card("Seminar Kesehatan", "Contoh kegiatan seminar kesehatan."),
      card("Konten Edukasi Medis", "Contoh materi edukasi masyarakat.")],
  };
  o.produk = {
    intro: "Program dan layanan...", subtitle: "Produk & Layanan",
    description: "Kartu contoh ini bukan penawaran layanan medis nyata.",
    items: [card("Konsultasi Online", "Contoh layanan, belum tersedia."),
      card("Paket Cek Kesehatan", "Contoh layanan yang harus diverifikasi."),
      card("Program Hidup Sehat", "Contoh program edukasi kesehatan.")],
  };
  site.content.cards = site.content.cards.slice(0,3).map((c,i)=>({
    ...c, title: ["Profil Dokter","Pengalaman","Kompetensi"][i],
    subtitle: ["dr. Arif Pratama","Pelayanan","Edukasi"][i],
    description: "Konten demo dokter NAMINA", link: "", imageAssetId: null,
  }));
  site.media = { desktopVideo: "/videos/hero.mp4", mobileVideo: "/videos/hero.mp4", poster: "", portrait: "", enterKey: "", cards: {} };
  return setDoctorAppearance(site);
}
