import { cloneViniTemplate, type SiteDocument } from "./sites";
import { setChibiAppearance } from "./doctorTemplate";

/** Fictional, editable sample; media uses NAMINA's temporary repo video. */
export function createChibiTemplate(slug: string): SiteDocument {
  const site = cloneViniTemplate(slug);
  const o = site.content.original!;
  site.content.identity.displayName = "NINA CHIBI";
  site.content.identity.profession = "KREATOR KARAKTER 3D";
  site.content.identity.bio = "Ini adalah profil karakter demo NAMINA. Cerita, karya, dan produknya hanya contoh.";
  const fact = (label: string, value: string, icon = 8121295) => ({ id: crypto.randomUUID(), label, value, icon });
  const card = (title: string, description: string, color: string) => ({
    id: crypto.randomUUID(), title, description, color, motif: "monogram" as const,
    link: "", imageAssetId: null,
  });
  o.contactUrl = "";
  o.contactLabel = "Hubungi Saya";
  o.contactMessage = "";
  o.nama = {
    intro: "HALO! KENALAN YUK!",
    subtitle: "Kenalan",
    description: "Bikin dunia mini penuh warna, karakter lucu, dan kreasi digital!",
    items: [
      fact("Nama", "Nina Chibi"),
      fact("Karakter", "Kreator Chibi", 8121299),
      fact("Domisili", "Dunia Imajinasi", 8121270),
      fact("Kesukaan", "Warna Pastel", 8121272),
    ],
  };
  o.karir = {
    intro: "PETUALANGAN KREATIFKU!",
    subtitle: "Cerita Kreatif",
    description: "Perjalanan kreatif karakter contoh. Ganti semua data dengan pengalaman klien.",
    items: [
      fact("Fokus Kreatif", "Desain Karakter"),
      fact("Proyek Contoh", "Ilustrasi 3D"),
      fact("Aktivitas", "Konten Digital"),
    ],
  };
  o.skill = {
    intro: "INI KEAHLIANKU!",
    subtitle: "Skill Kreatif",
    description: "Contoh keahlian untuk memperkenalkan karya dalam gaya Chibi.",
    items: [
      fact("Visual", "Chibi 3D"),
      fact("Kreasi", "Ilustrasi Digital"),
      fact("Konten", "Storytelling"),
    ],
  };
  o.karya = {
    intro: "KARYA-KARYA GEMASKU!",
    subtitle: "Portofolio Chibi",
    description: "",
    items: [
      card("Karakter Mini", "Contoh konsep karakter chibi 3D.", "#f5a4d2"),
      card("Dunia Pastel", "Contoh karya ilustrasi lucu.", "#c4b5fd"),
      card("Sticker Ceria", "Contoh desain stiker karakter.", "#96d5e9"),
    ],
  };
  o.produk = {
    intro: "KREASI MINI PILIHANKU!",
    subtitle: "Produk Kreatif",
    description: "",
    items: [
      card("Paket Stiker", "Contoh produk desain stiker.", "#ffc0db"),
      card("Avatar Chibi", "Contoh jasa karakter digital.", "#e0befc"),
      card("Mini Character", "Contoh produk karakter 3D.", "#b8e6e1"),
    ],
  };
  site.content.cards = site.content.cards.slice(0, 3).map((item, i) => ({
    ...item,
    title: ["Karakter Mini", "Dunia Pastel", "Sticker Ceria"][i],
    subtitle: ["Chibi 3D", "Ilustrasi", "Koleksi"][i],
    description: "Contoh konten demo NAMINA Chibi",
    link: "",
    imageAssetId: null,
  }));
  site.media = {
    desktopVideo: "/videos/hero.mp4",
    mobileVideo: "/videos/hero.mp4",
    poster: "", portrait: "", enterKey: "", cards: {},
  };
  return setChibiAppearance(site);
}
