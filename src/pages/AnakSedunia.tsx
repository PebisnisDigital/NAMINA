import { useEffect, useRef, useState } from "react";
import "./anakSedunia.css";

type Menu = "home" | "anak1" | "anak2" | "kenangan" | "doa" | "pesan";
const photo = "/clients/anaksedunia/mama.webp";
// Set these to the approved family media URLs when available.
const family = {
  introVideo: "",
  anak1: { name: "Anak Pertama", job: "", video: "", prayers: [
    ["Kesehatan", "Semoga Allah menjaga kesehatan dan memberi kekuatan di setiap langkahmu."],
    ["Karier", "Semoga pekerjaanmu dimudahkan, ilmu dan kemampuanmu terus berkembang."],
    ["Rezeki", "Semoga setiap ikhtiar membuahkan rezeki halal, luas, dan berkah."],
    ["Akhlak", "Tetap rendah hati, saleh, dan membawa manfaat bagi orang di sekitarmu."]
  ] },
  anak2: { name: "Anak Kedua", job: "", video: "", prayers: [
    ["Kesehatan", "Semoga selalu sehat, bahagia, dan dilindungi Allah di mana pun berada."],
    ["Karier", "Semoga setiap tanggung jawab dan cita-cita mendapat jalan terbaik."],
    ["Rezeki", "Semoga usaha dan kerja kerasmu berbuah rezeki yang halal serta berkah."],
    ["Akhlak", "Jadilah pribadi saleh, jujur, penyayang, dan bermanfaat bagi sesama."]
  ] },
  gallery: [{src: photo, title: "Masa kecil bersama Mama", detail: "Kenangan sederhana yang selalu hangat di hati."}]
};
const menus = [
  {id:"anak1", title: "Anak 1", sub:"Profil, perjalanan & doa", icon:"♙"},
  {id:"anak2", title: "Anak 2", sub:"Profil, perjalanan & doa", icon:"♙"},
  {id:"kenangan", title: "Kenangan", sub:"Galeri perjalanan keluarga", icon:"▧"},
  {id:"doa", title: "Doa & Harapan", sub:"Hari ini dan selamanya", icon:"♡"},
  {id:"pesan", title: "Pesan Cinta", sub:"Dari Papa & Mama", icon:"✉"}
] as const;
const prayers = [
  ["Sehat & bahagia","Semoga Allah menjaga tubuh, hati, dan pikiran kalian."],
  ["Sukses dalam karier","Semoga setiap usaha dan cita-cita dimudahkan."],
  ["Rezeki penuh berkah","Semoga rezeki halal, luas, dan bermanfaat selalu menyertai."],
  ["Anak yang saleh","Semoga selalu dekat dengan Allah, rendah hati, dan membawa kebaikan."]
];
export function AnakSedunia(){
 const [stage,setStage]=useState<"intro"|"ready"|"site">("intro");
 const [menu,setMenu]=useState<Menu>("home");
 const [sound,setSound]=useState(false);
 const [zoom,setZoom]=useState<string|null>(null);
 const [videoFailed,setVideoFailed]=useState(false);
 const audio=useRef<AudioContext|null>(null);
 const introRef=useRef<HTMLVideoElement|null>(null);
 const hasIntro=Boolean(family.introVideo);
 useEffect(()=>{
   if(stage!=="intro") return;
   const timer=window.setTimeout(()=>setStage("ready"),hasIntro?20000:8500);
   return ()=>window.clearTimeout(timer);
 },[stage,hasIntro]);
 useEffect(()=>()=>{void audio.current?.close().catch(()=>{});},[]);
 useEffect(()=>{if(!zoom)return;const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setZoom(null);};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[zoom]);
 function toggleMusic(){
   if(sound){if(audio.current)void audio.current.suspend();if(introRef.current)introRef.current.muted=true;setSound(false);return;}
   try {
    if(hasIntro&&introRef.current){introRef.current.muted=false;void introRef.current.play().catch(()=>{});setSound(true);return;}
    if(audio.current){void audio.current.resume();setSound(true);return;}
    const ctx=new AudioContext();audio.current=ctx;void ctx.resume();
    const melody=[261.63,329.63,392,523.25,440,392,329.63,293.66,349.23,440,587.33,523.25,440,392,329.63,261.63];
    melody.forEach((hz,i)=>{const t=ctx.currentTime+i*.55;const o=ctx.createOscillator();const g=ctx.createGain();o.type="sine";o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.075,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+1.4);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+1.45);});
    setSound(true);
   }catch{setSound(false);}
 }
 function enter(target:Menu="home"){if(audio.current)void audio.current.close().catch(()=>{});audio.current=null;setSound(false);setMenu(target);setVideoFailed(false);setStage("site");}
 function navigate(target:Menu){setMenu(target);setVideoFailed(false);window.scrollTo({top:0,behavior:"auto"});}
 const child=menu==="anak1"?family.anak1:menu==="anak2"?family.anak2:null;
 const label=menus.find(item=>item.id===menu)?.title||"Beranda";
 if(stage!=="site") return <main className="family-cinema family-intro"><div className="family-intro-bg"><img src={photo} alt=""/>{hasIntro&&<video ref={introRef} src={family.introVideo} autoPlay muted playsInline onEnded={()=>setStage("ready")} onError={()=>setStage("ready")}/>}</div><div className="family-intro-shade"/><header className="family-intro-controls"><span className="family-brand">NAMINA</span><button className="family-quiet" onClick={toggleMusic}>{sound?"♫ Matikan musik":"♫ Aktifkan musik"}</button></header><div className="family-intro-copy"><span className="family-kicker">20 NOVEMBER 2026</span><h1><i>Selamat</i>Hari Anak Sedunia</h1><p>Untuk dua anugerah terindah dalam hidup kami.</p><span className="family-sign">Papa & Mama</span>{stage==="ready"?<button className="family-gold" onClick={()=>enter()}>♡ Pesan Cinta <span>›</span></button>:<button className="family-quiet family-skip" onClick={()=>setStage("ready")}>Lewati intro ›</button>}</div></main>;
 return <main className="family-cinema">
  <header className="family-header"><button className="family-brand" onClick={()=>navigate("home")}>NAMINA</button><nav aria-label="Menu keluarga">{menus.map(item=><button key={item.id} aria-current={menu===item.id?"page":undefined} onClick={()=>navigate(item.id)}>{item.icon} {item.title}</button>)}</nav></header>
  <section className={"family-stage family-"+menu} key={menu} aria-label={label}>
   {menu==="home"?<div className="family-home-layout"><div className="family-portrait"><img src={photo} alt="Mama bersama kedua putranya waktu kecil"/><span>Masa kecil bersama Mama</span></div><div className="family-copy"><span className="family-kicker">20 NOVEMBER 2026</span><h1><i>Selamat</i>Hari Anak Sedunia</h1><h2>Untuk dua anugerah terindah dalam hidup kami...</h2><p>Terima kasih telah menjadi sumber kebahagiaan dan kebanggaan Papa dan Mama. Semoga kalian selalu sehat, sukses dalam karier, diberikan rezeki halal dan berkah, serta menjadi pribadi saleh dan bermanfaat.</p><button className="family-gold" onClick={()=>navigate("pesan")}>♡ Pesan Cinta <span>›</span></button></div></div>
   :child?<div className="family-child-layout"><div className="family-child-media">{child.video&&!videoFailed?<video key={child.video} src={child.video} playsInline muted loop autoPlay onError={()=>setVideoFailed(true)}/>:<div className="family-video-placeholder"><span>♡</span><p>Video personal {child.name}</p><small>Menunggu video keluarga</small></div>}</div><div className="family-copy"><span className="family-kicker">UNTUK PUTRA TERCINTA</span><h1>{child.name}</h1>{child.job&&<p>{child.job}</p>}<p>Di setiap langkahmu, ada doa Papa dan Mama.</p><div className="family-points">{child.prayers.map(([title,detail])=><article key={title}><span>✦</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div></div></div>
   :menu==="kenangan"?<div className="family-gallery"><span className="family-kicker">ALBUM KELUARGA</span><h1>Kenangan</h1><p>Waktu berlalu, cinta tidak.</p><div className="family-gallery-grid">{family.gallery.map(item=><button key={item.src} className="family-gallery-card" onClick={()=>setZoom(item.src)}><img src={item.src} alt={item.title}/><strong>{item.title}</strong><span>{item.detail}</span></button>)}</div></div>
   :menu==="doa"?<div className="family-letter"><span className="family-kicker">HARI INI DAN SELAMANYA</span><h1>Doa & Harapan</h1><p>Semoga Allah senantiasa menyertai setiap perjalanan kalian.</p><div className="family-points">{prayers.map(([title,detail])=><article key={title}><span>♡</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><p className="family-sign">Aamiin ya Rabbal Alamin.</p></div>
   :<div className="family-letter"><span className="family-kicker">SURAT CINTA · 20 NOVEMBER 2026</span><h1>Anak-anakku tercinta,</h1><p>Usia kalian mungkin sudah dewasa. Namun di mata Papa dan Mama, kalian tetap anak-anak kecil yang selalu kami peluk dalam setiap doa.</p><p>Semoga Allah menjaga kesehatan kalian, melancarkan karier, melimpahkan rezeki yang halal dan berkah, serta menjadikan kalian anak-anak saleh yang membawa kebaikan bagi sesama.</p><p>Sejauh apa pun kalian melangkah, doa Papa dan Mama selalu menyertai.</p><p>Kalian adalah anugerah terindah dalam hidup kami. Selamat Hari Anak Sedunia.</p><span className="family-sign">Dengan cinta yang tidak pernah menua,<br/>Papa & Mama.</span></div>}
  </section>
  <footer className="family-footer"><span>LOVE LEGACY · NAMINA</span><button className="family-quiet" onClick={()=>{setStage("intro");setSound(false);}}>Putar ulang intro</button></footer>
  {zoom&&<div role="dialog" aria-modal="true" aria-label="Foto kenangan" className="family-lightbox" onClick={()=>setZoom(null)}><button aria-label="Tutup foto" onClick={()=>setZoom(null)}>×</button><img src={zoom} alt="Kenangan keluarga" onClick={e=>e.stopPropagation()}/></div>}
 </main>;
}
