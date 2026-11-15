import { cloneViniTemplate, type SiteDocument } from "./sites";
import { setWeddingAppearance } from "./doctorTemplate";

/** Editable fictitious wedding invitation. Locations and dates are placeholders. */
export function createWeddingTemplate(slug: string): SiteDocument {
  const site = cloneViniTemplate(slug);
  const profile = site.content.original!;
  const fact = (label: string, value: string, icon = 8121295) => ({
    id: crypto.randomUUID(), label, value, icon,
  });
  const card = (title: string, description: string) => ({
    id: crypto.randomUUID(), title, description, color: "#b48a4f",
    motif: "monogram" as const, link: "", imageAssetId: null,
  });

  site.content.identity.displayName = "Alya & Raka";
  site.content.identity.profession = "Our Wedding Day";
  site.content.identity.bio = "Demo undangan pernikahan NAMINA. Semua nama, jadwal, dan lokasi merupakan contoh, bukan acara nyata.";
  profile.menuTitles = {
    nama: "Mempelai",
    karir: "Acara",
    skill: "Kisah",
    karya: "Galeri",
    produk: "RSVP",
  };
  profile.menuSettings = {
    ...profile.menuSettings,
    nama: { icon: "heart", slideSpeed: 60 },
    karir: { icon: "award", slideSpeed: 60 },
    skill: { icon: "book", slideSpeed: 60 },
    karya: { icon: "image", slideSpeed: 65 },
    produk: { icon: "heart", slideSpeed: 65 },
  };
  profile.contactUrl = "";
  profile.contactLabel = "Isi RSVP";
  profile.contactMessage = "";

  profile.nama = {
    intro: "THE WEDDING OF",
    subtitle: "Our Wedding Day",
    description: "Dengan penuh cinta, kami mengundang Anda untuk menjadi bagian dari hari bahagia kami.",
    items: [
      fact("Mempelai Wanita", "Alya (nama contoh)", 8121270),
      fact("Mempelai Pria", "Raka (nama contoh)", 8121299),
      fact("Keluarga", "Informasi menyusul", 8121272),
    ],
  };
  profile.karir = {
    intro: "SAVE THE DATE",
    subtitle: "Akad & Resepsi",
    description: "Simpan momen bahagia kami. Tanggal dan tempat pada demo belum ditentukan.",
    items: [
      fact("Akad Nikah", "Jadwal menyusul"),
      fact("Resepsi", "Jadwal menyusul", 8121299),
      fact("Lokasi", "Alamat menyusul", 8121270),
      fact("Petunjuk Arah", "Tambahkan peta di Studio", 8121272),
    ],
  };
  profile.skill = {
    intro: "OUR LOVE STORY",
    subtitle: "Cerita Kita",
    description: "Dari pertemuan pertama hingga memilih berjalan berdua selamanya.",
    items: [
      fact("Awal Cerita", "Pertemuan pertama"),
      fact("Bab Berikutnya", "Hari lamaran", 8121270),
      fact("Selamanya", "Hari pernikahan", 8121299),
    ],
  };
  profile.karya = {
    intro: "OUR MEMORIES",
    subtitle: "Momen Indah",
    description: "",
    items: [
      card("Foto Prewedding", "Ganti gambar contoh dengan foto prewedding pasangan."),
      card("Kenangan Berdua", "Galeri foto perjalanan cinta pasangan."),
      card("Cinematic Love Story", "Tambahkan video prewedding pada latar utama di Studio."),
    ],
  };
  profile.produk = {
    intro: "BE OUR GUEST",
    subtitle: "Konfirmasi Kehadiran",
    description: "",
    items: [
      card("Konfirmasi Kehadiran", "Contoh menu RSVP. Pengiriman RSVP belum terhubung ke penerima."),
      card("Ucapan & Doa", "Area contoh untuk pesan dan doa dari para tamu."),
      card("Wedding Gift", "Area contoh untuk hadiah pernikahan secara opsional."),
    ],
  };
  site.content.cards = site.content.cards.slice(0, 3).map((item, index) => ({
    ...item,
    title: ["Our Wedding Day", "Our Love Story", "Save the Date"][index],
    subtitle: ["Alya & Raka", "Kenangan Berdua", "Undangan Digital"][index],
    description: "Konten contoh NAMINA Wedding",
    link: "",
    imageAssetId: null,
  }));
  site.media = {
    desktopVideo: "/videos/hero.mp4", mobileVideo: "/videos/hero.mp4",
    poster: "", portrait: "", enterKey: "", cards: {},
  };
  return setWeddingAppearance(site);
}
