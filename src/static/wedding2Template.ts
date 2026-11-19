import { createWeddingTemplate } from "./weddingTemplate.js";
import { siteDocumentSchema, type SiteDocument } from "./sites.js";
import { defaultWeddingDesign } from "./weddingDesign.js";

/** Independent Living Paper wedding sample. All personal data and venues are fictional. */
export function createWedding2Template(slug: string): SiteDocument {
  const site = createWeddingTemplate(slug);
  const o = site.content.original!;
  site.presentation = "wedding2";
  site.weddingDesign = defaultWeddingDesign();
  site.content.identity.displayName = "Hizqil & Icaa";
  site.content.identity.profession = "The Wedding of Hizqil & Icaa";
  site.content.identity.bio = "Dalam setiap pertemuan, ada cerita indah yang ditulis oleh takdir.";
  o.menuTitles = { nama:"Mempelai", karir:"Acara", skill:"Kisah", karya:"Galeri", produk:"Hadiah" };
  o.nama.intro = "THE WEDDING OF";
  o.nama.subtitle = "Mempelai Berbahagia";
  o.nama.description = "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara pernikahan kami.";
  o.nama.items = [
    {id:crypto.randomUUID(),label:"Orang tua mempelai pria",value:"Putra dari Bapak Ahmad & Ibu Siti",icon:8121295},
    {id:crypto.randomUUID(),label:"Orang tua mempelai wanita",value:"Putri dari Bapak Burhan & Ibu Rani",icon:8121295},
  ];
  o.karir.intro = "SAVE THE DATE";
  o.karir.subtitle = "Akad & Resepsi";
  o.karir.description = "Ganti jadwal, lokasi, serta alamat demo ini dengan data acara yang benar.";
  o.karir.items = [
    {id:crypto.randomUUID(),label:"Tanggal acara (ISO)",value:"2027-02-20T08:00:00+07:00",icon:8121312},
    {id:crypto.randomUUID(),label:"Akad Nikah",value:"08.00 WIB - Selesai · Masjid Al-Hikmah",icon:8121312},
    {id:crypto.randomUUID(),label:"Resepsi",value:"11.00 - 14.00 WIB · Gedung Graha Sakinah",icon:8121312},
    {id:crypto.randomUUID(),label:"Alamat",value:"Jl. Anggrek No. 25, Bandung (contoh)",icon:8121270},
  ];
  o.skill.intro = "OUR LOVE STORY";
  o.skill.subtitle = "Jejak Cerita Cinta";
  o.skill.description = "Cerita pertemuan, lamaran, dan perjalanan menuju pernikahan.";
  o.skill.items = [
    {id:crypto.randomUUID(),label:"Pertemuan",value:"Januari 2022 · Pertama kali berkenalan.",icon:8121295},
    {id:crypto.randomUUID(),label:"Berkomitmen",value:"Juli 2023 · Memutuskan berjalan bersama.",icon:8121295},
    {id:crypto.randomUUID(),label:"Lamaran",value:"Oktober 2024 · Melangkah menuju pernikahan.",icon:8121295},
  ];
  const gallery = (title:string,description:string) => ({
    id:crypto.randomUUID(),title,description,color:"#869879",
    motif:"monogram" as const,link:"",imageAssetId:null,
  });
  o.karya = {intro:"OUR MOMENTS",subtitle:"Galeri Cinta",description:"Isi dengan foto prewedding pasangan.",
    items:[gallery("Cerita Dimulai","Momen pertama kami"),gallery("Bersamamu","Perjalanan cinta"),gallery("Hari Bahagia","Kenangan yang abadi")]};
  o.produk = {intro:"WEDDING GIFT",subtitle:"Amplop Digital",description:"Rekening hanya boleh dipublikasikan atas izin pemiliknya.",
    items:[gallery("Hadiah Digital","Isi rekening sesuai izin pasangan."),gallery("Doa & Restu","Terima kasih atas doa yang tulus.")]};
  o.contactUrl = "";
  site.media = { desktopVideo:"",mobileVideo:"",poster:"",portrait:"",enterKey:"",cards:{} };
  return siteDocumentSchema.parse(site);
}
