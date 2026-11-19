import { z } from "zod";
const txt=z.string().max(1200);
const url=z.string().max(2000).refine(v=>{if(!v)return true;try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false;}}, "Gunakan URL HTTPS publik.");
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/);
const point=z.array(txt).length(2);
const child=z.object({name:txt,menu:txt,job:txt,kicker:txt,intro:txt,video:url,poster:url,prayers:z.array(point).max(30)});
export const familyDesignSchema=z.object({
 brand:txt,brandLogo:url,welcomeVideo:url,welcomePoster:url,welcomeButton:txt,loadingText:txt,
 anak1:child,anak2:child,doaVideo:url,doaPoster:url,doaMenu:txt,doaKicker:txt,doaTitle:txt,doaIntro:txt,doaClosing:txt,prayers:z.array(point).max(30),
 galleryMenu:txt,galleryKicker:txt,galleryTitle:txt,galleryIntro:txt,galleryBrand:txt,galleryTag:txt,galleryHint:txt,footer:txt,replayLabel:txt,
 gallery:z.array(z.object({src:url,title:txt,detail:txt,portrait:z.boolean()})).max(50),
 style:z.object({background:color,accent:color,text:color,muted:color,card:color,cardInk:color,font:z.enum(["classic","modern"]),overlay:z.number().min(0).max(1),speed:z.number().min(15).max(150),headingScale:z.number().min(.7).max(1.4)})
});
export type FamilyDesign=z.infer<typeof familyDesignSchema>;
export type FamilyView="welcome"|"anak1"|"anak2"|"doa"|"kenangan";
const points=()=>[["Kesehatan","Semoga sehat dan selalu dalam lindungan Allah."],["Karier","Semoga setiap usaha dan cita-cita dimudahkan."],["Rezeki","Semoga rezeki halal dan berkah menyertai setiap langkah."],["Akhlak","Semoga tumbuh menjadi pribadi yang baik dan bermanfaat."]];
const childSeed=(name:string)=>({name,menu:name,job:"",kicker:"UNTUK PUTRA TERCINTA",intro:"Di setiap langkahmu, ada doa Papa dan Mama.",video:"",poster:"",prayers:points()});
export function defaultFamilyDesign():FamilyDesign{return {
 brand:"NAMINA",brandLogo:"",welcomeVideo:"",welcomePoster:"",welcomeButton:"Selamat Hari Anak Sedunia",loadingText:"Menyiapkan video kenangan…",
 anak1:childSeed("Anak 1"),anak2:childSeed("Anak 2"),doaVideo:"",doaPoster:"",doaMenu:"Doa",doaKicker:"HARI INI DAN SELAMANYA",doaTitle:"Doa & Harapan",doaIntro:"Anak-anakku, doa Papa dan Mama selalu menyertai setiap langkah kalian.",doaClosing:"Aamiin ya Rabbal Alamin. — Papa & Mama",prayers:points(),
 galleryMenu:"Kenangan",galleryKicker:"ALBUM KELUARGA · LOVE LEGACY",galleryTitle:"Kenangan",galleryIntro:"Waktu berlalu, cinta tidak.",galleryBrand:"LOVE LEGACY",galleryTag:"FAMILY MEMORIES",galleryHint:"Geser atau ketuk foto untuk memperbesar",footer:"LOVE LEGACY · NAMINA",replayLabel:"Putar ulang intro",
 gallery:["Papa","Mama","Anak Pertama","Anak Kedua","Keluarga"].map(title=>({src:"",title,detail:"",portrait:true})),
 style:{background:"#10151e",accent:"#f3d495",text:"#fff8ea",muted:"#ddd1bc",card:"#f3e7d3",cardInk:"#33271c",font:"classic",overlay:.72,speed:58,headingScale:1}
};}
