import {defaultFamilyDesign,familyDesignSchema,type FamilyDesign} from "./familyDesign.js";
const photo = "https://namina.biz.id/clients/anaksedunia/mama.webp";
// Set these to the approved family media URLs when available.
const demoFamily = {
  welcomeVideo: "https://www.dropbox.com/scl/fi/qv98rguh4by66dwmze5wz/Family_embracing_in_golden_light_f6b10c09_1080p.mp4?rlkey=a03r5a4s8cwo6hw0nbrmdzfuv&raw=1",
  doaVideo: "https://www.dropbox.com/scl/fi/0thyx9dydjilp2lnb78zj/Family_portrait_video_creation_49f27e46_1080p.mp4?rlkey=fns406p8c0ixjm3nr372jsm3f&raw=1",
  doaPoster: photo,
  anak1: { name: "Edo", job: "Auditor di Direktorat Jenderal Pajak", video: "https://www.dropbox.com/scl/fi/ttprcuzss21fqbn5xxc6m/Man_walking_toward_camera_48834515_1080p.mp4?rlkey=nubc6859t0oacsdw8rfsmi7yw&raw=1", poster: "", prayers: [
    ["Kesehatan", "Semoga Allah menjaga kesehatan dan memberi kekuatan di setiap langkahmu."],
    ["Karier", "Semoga Allah memudahkan tugasmu sebagai auditor, menjaga integritasmu, dan memberkahi setiap pengabdianmu."],
    ["Rezeki", "Semoga setiap ikhtiar membuahkan rezeki halal, luas, dan berkah."],
    ["Akhlak", "Tetap rendah hati, saleh, dan membawa manfaat bagi orang di sekitarmu."]
  ] },
  anak2: { name: "Yuda", job: "TNI", video: "https://www.dropbox.com/scl/fi/7phcb70wixrl9hq8blxwp/Man_walking_forward_5f8cf8ab_1080p.mp4?rlkey=vwxgme7rm30hoi181tbpm8yzw&raw=1", poster: "", prayers: [
    ["Kesehatan", "Semoga selalu sehat, bahagia, dan dilindungi Allah di mana pun berada."],
    ["Karier", "Semoga Allah melindungimu dalam setiap penugasan, menguatkan keberanianmu, dan memberkahimu dalam pengabdian kepada bangsa."],
    ["Rezeki", "Semoga usaha dan kerja kerasmu berbuah rezeki yang halal serta berkah."],
    ["Akhlak", "Jadilah pribadi saleh, jujur, penyayang, dan bermanfaat bagi sesama."]
  ] },
  gallery: [
    {"src":"https://www.dropbox.com/scl/fi/9ftptfd79dd4w60680pm1/Smiling-Man-in-Beige-Suit-with-Rabbit-Patterned-Tie.png?rlkey=i5gw7dgnz9zswcizkg7w3whwe&raw=1","title":"Papa","detail":"Teladan kasih dan kekuatan dalam keluarga.","portrait":true},
    {"src":"https://www.dropbox.com/scl/fi/md2f7pvlz7jdg8gm4q7s2/Elegant-Mother-with-Blush-Bouquet.png?rlkey=jsk2k1dk7qry318gjykff4k0x&raw=1","title":"Mama","detail":"Pelukan hangat dan doa yang tidak pernah putus.","portrait":true},
    {"src":"https://www.dropbox.com/scl/fi/mcv63ju006jnl1fylrz6r/Traditional-Batik-Clad-Man-Portrait.png?rlkey=5bzdf4pep9as8rxqcdi1bz23o&raw=1","title":"Edo","detail":"Putra tercinta, kebanggaan Papa dan Mama.","portrait":true},
    {"src":"https://www.dropbox.com/scl/fi/obkp3ng9f6kvwt7qtvf84/Full-Body-Teal-Uniform-Portrait.png?rlkey=wmsvtkjkmma1ek9a645enlkbs&raw=1","title":"Yuda","detail":"Putra tercinta, kebanggaan Papa dan Mama.","portrait":true},
    {src: photo, title: "Masa kecil bersama Mama", detail: "Kenangan sederhana yang selalu hangat di hati.", portrait: false}
  ]
};
const demoPrayers = [
  ["Sehat dalam lindungan-Nya","Ya Allah, jagalah kedua putra kami. Sehatkan tubuh dan hati mereka, lindungi setiap langkahnya."],
  ["Karier yang penuh berkah","Mudahkan setiap tugas dan perjuangan mereka. Jadikan keberhasilannya jalan untuk berbuat baik."],
  ["Rezeki & kebahagiaan","Limpahkan rezeki yang halal, berkah, dan cukup. Hadirkan ketenangan serta kebahagiaan dalam hidup mereka."],
  ["Putra yang saleh","Teguhkan iman mereka, lembutkan hatinya, dan jadikan mereka anak yang saleh serta bermanfaat bagi sesama."]
];
const defaultDemo:FamilyDesign={...defaultFamilyDesign(),...demoFamily,anak1:{...defaultFamilyDesign().anak1,...demoFamily.anak1,menu:"Edo",intro:"Edo, di setiap langkahmu, ada doa Papa dan Mama."},anak2:{...defaultFamilyDesign().anak2,...demoFamily.anak2,menu:"Yuda",intro:"Yuda, di setiap langkahmu, ada doa Papa dan Mama."},prayers:demoPrayers,doaIntro:"Anak-anakku, meski kalian telah dewasa, doa Papa dan Mama tak pernah berhenti menyertai setiap langkah kalian."};
export function createFamilySample():FamilyDesign{return familyDesignSchema.parse(structuredClone(defaultDemo));}
