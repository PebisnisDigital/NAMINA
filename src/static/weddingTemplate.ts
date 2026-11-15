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
    karya: "Amplop",
    produk: "Love Story",
  };
  profile.menuSettings = {
    ...profile.menuSettings,
    nama: { icon: "heart", slideSpeed: 60 },
    karir: { icon: "award", slideSpeed: 60 },
    skill: { icon: "book", slideSpeed: 60 },
    karya: { icon: "shopping", slideSpeed: 65 },
    produk: { icon: "image", slideSpeed: 65 },
  };
  profile.contactUrl = "";
  profile.contactLabel = "Love Story";
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
    intro: "OUR JOURNEY",
    subtitle: "Timeline Cinta",
    description: "Dari pertemuan pertama hingga memilih berjalan berdua selamanya.",
    items: [
      fact("Awal Cerita", "Pertemuan pertama"),
      fact("Bab Berikutnya", "Hari lamaran", 8121270),
      fact("Selamanya", "Hari pernikahan", 8121299),
    ],
  };
  profile.karya = {
    intro: "WEDDING GIFT",
    subtitle: "Amplop Digital",
    description: "",
    items: [
      card("Amplop Digital", "Tempat untuk menampilkan gambar rekening tujuan hadiah pernikahan. Unggah gambar rekening asli melalui Studio."),
      card("Rekening Mempelai", "Ganti kartu ini dengan gambar informasi bank dan nomor rekening yang telah disetujui pasangan."),
      card("Hadiah Pernikahan", "Informasi alternatif pengiriman hadiah. Jangan menampilkan data rekening sebelum diverifikasi."),
    ],
  };
  profile.produk = {
    intro: "OUR LOVE STORY",
    subtitle: "Galeri Perjalanan Cinta",
    description: "",
    items: [
      card("Pertama Bertemu", "Unggah foto awal pertemuan dan ceritakan bagaimana perjalanan cinta dimulai."),
      card("Hari Lamaran", "Unggah foto momen lamaran dan kenangan menuju hari bahagia."),
      card("Foto Prewedding", "Unggah foto prewedding pasangan untuk ditampilkan sebagai galeri foto sinematik."),
      card("Menuju Selamanya", "Unggah foto favorit yang melengkapi kisah perjalanan cinta."),
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
