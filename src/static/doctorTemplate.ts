import { siteDocumentSchema, cloneViniTemplate, type SiteDocument } from "./sites";

const medicalPalette = {
  backgroundColor: "#ffffff", textColor: "#0b233d", accentColor: "#078e8d",
  buttonColor: "#078e8d", buttonTextColor: "#ffffff", borderColor: "#c9e7e8",
} as const;

/** Layout-only switch: preserve all client copy, video, gallery and contact information. */
export function setDoctorAppearance(document: SiteDocument): SiteDocument {
  const next = structuredClone(document);
  next.presentation = "doctor";
  const original = next.content.original;
  if (original) original.style = {
    fontFamily: "poppins", titleScale: 1, bodyScale: 1, roleScale: 1,
    menuScale: 1, layoutPreset: "original", contentMargin: 72,
    topSpacing: 20, factColumns: 3, galleryColumns: 3, cardGap: 18,
    buttonRadius: 24, borderWidth: 1, buttonVariant: "solid", shadow: "soft",
    ...original.style, ...medicalPalette,
  };
  return siteDocumentSchema.parse(next);
}

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
