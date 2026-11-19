import { useEffect, useRef, useState } from "react";
import "./anakSedunia.css";

type Menu = "anak1" | "anak2" | "kenangan" | "doa" | "pesan";
const photo = "/clients/anaksedunia/mama.webp";
// Set these to the approved family media URLs when available.
const family = {
  introVideo: "https://www.dropbox.com/scl/fi/qv98rguh4by66dwmze5wz/Family_embracing_in_golden_light_f6b10c09_1080p.mp4?rlkey=a03r5a4s8cwo6hw0nbrmdzfuv&raw=1",
  doaVideo: "",
  pesanVideo: "",
  doaPoster: photo,
  pesanPoster: photo,
  anak1: { name: "Anak Pertama", job: "", video: "https://www.dropbox.com/scl/fi/ttprcuzss21fqbn5xxc6m/Man_walking_toward_camera_48834515_1080p.mp4?rlkey=nubc6859t0oacsdw8rfsmi7yw&raw=1", poster: "", prayers: [
    ["Kesehatan", "Semoga Allah menjaga kesehatan dan memberi kekuatan di setiap langkahmu."],
    ["Karier", "Semoga pekerjaanmu dimudahkan, ilmu dan kemampuanmu terus berkembang."],
    ["Rezeki", "Semoga setiap ikhtiar membuahkan rezeki halal, luas, dan berkah."],
    ["Akhlak", "Tetap rendah hati, saleh, dan membawa manfaat bagi orang di sekitarmu."]
  ] },
  anak2: { name: "Anak Kedua", job: "", video: "https://www.dropbox.com/scl/fi/7phcb70wixrl9hq8blxwp/Man_walking_forward_5f8cf8ab_1080p.mp4?rlkey=vwxgme7rm30hoi181tbpm8yzw&raw=1", poster: "", prayers: [
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
  {id:"doa", title: "Doa", sub:"Hari ini dan selamanya", icon:"♡"},
  {id:"pesan", title: "Pesan Cinta", sub:"Dari Papa & Mama", icon:"✉"}
] as const;
const prayers = [
  ["Sehat & bahagia","Semoga Allah menjaga tubuh, hati, dan pikiran kalian."],
  ["Sukses dalam karier","Semoga setiap usaha dan cita-cita dimudahkan."],
  ["Rezeki penuh berkah","Semoga rezeki halal, luas, dan bermanfaat selalu menyertai."],
  ["Anak yang saleh","Semoga selalu dekat dengan Allah, rendah hati, dan membawa kebaikan."]
];
const letter = [
 "Usia kalian mungkin sudah dewasa. Namun di mata Papa dan Mama, kalian tetap anak-anak kecil yang selalu kami peluk dalam setiap doa.",
 "Semoga Allah menjaga kesehatan kalian, melancarkan karier, melimpahkan rezeki yang halal dan berkah, serta menjadikan kalian anak-anak saleh yang membawa kebaikan bagi sesama.",
 "Sejauh apa pun kalian melangkah, doa Papa dan Mama selalu menyertai.",
 "Kalian adalah anugerah terindah dalam hidup kami. Selamat Hari Anak Sedunia."
];
function viewportPageSize(){
 if(window.innerHeight<440) return 1;
 if(window.innerWidth<=760 || window.innerHeight<690) return 2;
 return 4;
}
function PageControls({page,total,onChange}:{page:number;total:number;onChange:(n:number)=>void}){
 if(total<=1)return null;
 return <div className="family-pagination" aria-label="Halaman isi"><button aria-label="Sebelumnya" disabled={page===0} onClick={()=>onChange(page-1)}>‹</button><span aria-live="polite">{page+1} / {total}</span><button aria-label="Berikutnya" disabled={page>=total-1} onClick={()=>onChange(page+1)}>›</button></div>;
}
export function AnakSedunia(){
 const [stage,setStage]=useState<"intro"|"ready"|"site">("intro");
 const [menu,setMenu]=useState<Menu>("anak1");
 const [sound,setSound]=useState(false);
 const [zoom,setZoom]=useState<string|null>(null);
 const [videoFailed,setVideoFailed]=useState(false);
 const [page,setPage]=useState(0);
 const [pageSize,setPageSize]=useState(viewportPageSize);
 const [galleryPage,setGalleryPage]=useState(0);
 const touchStart=useRef<number|null>(null);
 useEffect(()=>{const resize=()=>{setPageSize(viewportPageSize());setPage(0);};window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize);},[]);
 const audio=useRef<AudioContext|null>(null);
 const introRef=useRef<HTMLVideoElement|null>(null);
 const hasIntro=Boolean(family.introVideo);
 const [introPlaying,setIntroPlaying]=useState(false);
 const [introFailed,setIntroFailed]=useState(false);
 useEffect(()=>{
   if(stage!=="intro"|| (hasIntro&&introPlaying)) return;
   const timer=window.setTimeout(()=>{if(hasIntro){setIntroFailed(true);introRef.current?.pause();}setStage("ready");},hasIntro?20000:8500);
   return ()=>window.clearTimeout(timer);
 },[stage,hasIntro,introPlaying]);
 useEffect(()=>()=>{void audio.current?.close().catch(()=>{});},[]);
 useEffect(()=>{if(!zoom)return;const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setZoom(null);};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[zoom]);
 function toggleMusic(){
   if(sound){if(audio.current)void audio.current.suspend();if(introRef.current)introRef.current.muted=true;setSound(false);return;}
   try {
    if(hasIntro&&introRef.current){const video=introRef.current;video.muted=false;setSound(true);if(!video.ended)void video.play().catch(()=>{video.muted=true;setSound(false);});return;}
    if(audio.current){void audio.current.resume();setSound(true);return;}
    const ctx=new AudioContext();audio.current=ctx;void ctx.resume();
    const melody=[261.63,329.63,392,523.25,440,392,329.63,293.66,349.23,440,587.33,523.25,440,392,329.63,261.63];
    melody.forEach((hz,i)=>{const t=ctx.currentTime+i*.55;const o=ctx.createOscillator();const g=ctx.createGain();o.type="sine";o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.075,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+1.4);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+1.45);});
    setSound(true);
   }catch{setSound(false);}
 }
 function enter(target:Menu="anak1"){if(audio.current)void audio.current.close().catch(()=>{});audio.current=null;setSound(false);setMenu(target);setPage(0);setVideoFailed(false);setStage("site");}
 function navigate(target:Menu){setMenu(target);setPage(0);setVideoFailed(false);window.scrollTo({top:0,behavior:"auto"});}
 const child=menu==="anak1"?family.anak1:menu==="anak2"?family.anak2:null;
 const label=menus.find(item=>item.id===menu)?.title||"Anak 1";
 const cinematic=Boolean(child)||menu==="doa"||menu==="pesan";
 const sceneVideo=child?.video||(menu==="doa"?family.doaVideo:menu==="pesan"?family.pesanVideo:"");
 const scenePoster=child?.poster||(menu==="doa"?family.doaPoster:menu==="pesan"?family.pesanPoster:"");
 const pageTotal=Math.ceil(4/pageSize);
 const galleryItem=family.gallery[galleryPage]||family.gallery[0];
 if(stage!=="site") return <main className="family-cinema family-intro" style={{height:"100dvh",minHeight:0,width:"100%",overflow:"hidden"}}><div className="family-intro-bg" style={{background:"#080d17"}}>{hasIntro&&<video ref={introRef} src={family.introVideo} preload="auto" autoPlay muted={!sound} playsInline disablePictureInPicture onPlaying={()=>setIntroPlaying(true)} onEnded={()=>{setSound(false);setStage("ready");}} onError={()=>{setIntroFailed(true);setSound(false);setStage("ready");}} style={{opacity:introFailed||!introPlaying?0:1,objectFit:"cover",objectPosition:"center",maxWidth:"none",maxHeight:"none",width:"100%",height:"100%"}}/>}</div><div className="family-intro-shade"/><header className="family-intro-controls"><span className="family-brand">NAMINA</span>{stage==="intro"&&!introFailed&&<button className="family-quiet" onClick={toggleMusic}>{sound?"♫ Matikan musik":"♫ Aktifkan musik"}</button>}</header><div className="family-intro-copy">{stage==="intro"&&!introPlaying&&<p role="status" style={{fontSize:14}}>Memuat video kenangan…</p>}{introFailed&&<p role="status" style={{fontSize:14}}>Video belum dapat diputar. Silakan lanjut atau muat ulang.</p>}<span className="family-kicker">20 NOVEMBER 2026</span><h1><i>Selamat</i>Hari Anak Sedunia</h1><p>Untuk dua anugerah terindah dalam hidup kami.</p><span className="family-sign">Papa & Mama</span>{stage==="ready"?<button className="family-gold" onClick={()=>enter()}>♡ Pesan Cinta <span>›</span></button>:<button className="family-quiet family-skip" onClick={()=>{introRef.current?.pause();setSound(false);setStage("ready");}}>Lewati intro ›</button>}</div></main>;
 return <main className={"family-cinema"+(cinematic?" family-fullscreen":"")}>
  <header className="family-header"><button className="family-brand" onClick={()=>navigate("anak1")}>NAMINA</button><nav aria-label="Menu keluarga">{menus.map(item=><button key={item.id} aria-current={menu===item.id?"page":undefined} onClick={()=>navigate(item.id)}>{item.icon} {item.title}</button>)}</nav></header>
  <section className={"family-stage family-"+menu} key={menu} aria-label={label}>
   {cinematic&&<div className="family-scene" aria-hidden="true">{scenePoster&&<img src={scenePoster} alt=""/>}{sceneVideo&&!videoFailed&&<video key={sceneVideo} src={sceneVideo} poster={scenePoster||undefined} style={child?{height:"100%",width:"100%",objectFit:"cover",objectPosition:"75% center"}:undefined} autoPlay muted loop playsInline disablePictureInPicture onError={()=>setVideoFailed(true)}/>}<div className="family-scene-shade"/></div>}
   {child?<div className="family-scene-content"><div className="family-copy"><span className="family-kicker">UNTUK PUTRA TERCINTA</span><h1>{child.name}</h1>{child.job&&<h2 className="family-profession">{child.job}</h2>}<p>Di setiap langkahmu, ada doa Papa dan Mama.</p><div className="family-points">{child.prayers.slice(page*pageSize,(page+1)*pageSize).map(([title,detail])=><article key={title}><span>✦</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><PageControls page={page} total={pageTotal} onChange={setPage}/></div></div>
   :menu==="kenangan"?<div className="family-gallery"><span className="family-kicker">ALBUM KELUARGA</span><h1>Kenangan</h1><p>Waktu berlalu, cinta tidak.</p><div className="family-gallery-grid" onTouchStart={e=>{touchStart.current=e.touches[0]?.clientX??null;}} onTouchEnd={e=>{const x=touchStart.current;touchStart.current=null;if(x===null)return;const delta=(e.changedTouches[0]?.clientX??x)-x;if(Math.abs(delta)>45)setGalleryPage(i=>Math.max(0,Math.min(family.gallery.length-1,i+(delta<0?1:-1))));}}><button className="family-gallery-card" onClick={()=>setZoom(galleryItem.src)}><img src={galleryItem.src} alt={galleryItem.title}/><strong>{galleryItem.title}</strong><span>{galleryItem.detail}</span></button></div><PageControls page={galleryPage} total={family.gallery.length} onChange={setGalleryPage}/></div>
   :menu==="doa"?<div className="family-scene-content"><div className="family-copy"><span className="family-kicker">HARI INI DAN SELAMANYA</span><h1>Doa &amp; Harapan</h1><p>Semoga Allah senantiasa menyertai setiap perjalanan kalian.</p><div className="family-points">{prayers.slice(page*pageSize,(page+1)*pageSize).map(([title,detail])=><article key={title}><span>♡</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><PageControls page={page} total={pageTotal} onChange={setPage}/><span className="family-sign">Aamiin ya Rabbal Alamin.</span></div></div>
   :<div className="family-scene-content"><div className="family-copy family-letter-scene"><span className="family-kicker">SURAT CINTA · 20 NOVEMBER 2026</span><h1>Anak-anakku tercinta,</h1>{letter.slice(page*pageSize,(page+1)*pageSize).map(text=><p key={text}>{text}</p>)}<PageControls page={page} total={pageTotal} onChange={setPage}/>{page===pageTotal-1&&<span className="family-sign">Dengan cinta yang tidak pernah menua,<br/>Papa &amp; Mama.</span>}</div></div>}
  </section>
  {!cinematic&&<footer className="family-footer"><span>LOVE LEGACY · NAMINA</span><button className="family-quiet" onClick={()=>{setIntroPlaying(false);setIntroFailed(false);setStage("intro");setSound(false);}}>Putar ulang intro</button></footer>}
  {zoom&&<div role="dialog" aria-modal="true" aria-label="Foto kenangan" className="family-lightbox" onClick={()=>setZoom(null)}><button aria-label="Tutup foto" onClick={()=>setZoom(null)}>×</button><img src={zoom} alt="Kenangan keluarga" onClick={e=>e.stopPropagation()}/></div>}
 </main>;
}
