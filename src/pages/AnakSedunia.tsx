import { useEffect, useRef, useState } from "react";
import { NaminaLogo } from "../components/NaminaLogo";
import "./anakSedunia.css";

type Menu = "anak1" | "anak2" | "kenangan" | "doa";
const photo = "/clients/anaksedunia/mama.webp";
// Set these to the approved family media URLs when available.
const family = {
  welcomeVideo: "https://www.dropbox.com/scl/fi/qv98rguh4by66dwmze5wz/Family_embracing_in_golden_light_f6b10c09_1080p.mp4?rlkey=a03r5a4s8cwo6hw0nbrmdzfuv&raw=1",
  doaVideo: "",
  doaPoster: photo,
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
  {id:"doa", title: "Doa", sub:"Hari ini dan selamanya", icon:"♡"},
  {id:"kenangan", title: "Kenangan", sub:"Galeri perjalanan keluarga", icon:"▧"}
] as const;
const prayers = [
  ["Sehat & bahagia","Semoga Allah menjaga tubuh, hati, dan pikiran kalian."],
  ["Sukses dalam karier","Semoga setiap usaha dan cita-cita dimudahkan."],
  ["Rezeki penuh berkah","Semoga rezeki halal, luas, dan bermanfaat selalu menyertai."],
  ["Anak yang saleh","Semoga selalu dekat dengan Allah, rendah hati, dan membawa kebaikan."]
];
function galleryImageUrl(value:string){
  try{
    const url=new URL(value);
    if(url.protocol==="https:"&&["www.dropbox.com","dropbox.com"].includes(url.hostname)){
      url.searchParams.delete("dl");url.searchParams.delete("st");url.searchParams.set("raw","1");
      return url.toString();
    }
  }catch{/* Local image path. */}
  return value;
}
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
 const [stage,setStage]=useState<"loading"|"welcome"|"site">("loading");
 const [menu,setMenu]=useState<Menu>("anak1");
 const [zoom,setZoom]=useState<string|null>(null);
 const [page,setPage]=useState(0);
 const [pageSize,setPageSize]=useState(viewportPageSize);
 const [galleryPaused,setGalleryPaused]=useState(false);
 useEffect(()=>{const resize=()=>{setPageSize(viewportPageSize());setPage(0);};window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize);},[]);
 const welcomeRef=useRef<HTMLVideoElement|null>(null);
 const [welcomeSound,setWelcomeSound]=useState(false);
 const [welcomeFailed,setWelcomeFailed]=useState(false);
 const anak1Ref=useRef<HTMLVideoElement|null>(null);
 const anak2Ref=useRef<HTMLVideoElement|null>(null);
 const doaRef=useRef<HTMLVideoElement|null>(null);
 const [progress,setProgress]=useState(0);
 const [loadNotice,setLoadNotice]=useState(false);
 function warmVideos(){
   for(const video of [welcomeRef.current,anak1Ref.current,anak2Ref.current,doaRef.current]){
     if(!video)continue;
     video.muted=true;
     if(video.paused)void video.play().catch(()=>{});
   }
 }
 useEffect(()=>{
   if(stage!=="loading")return;
   const started=performance.now();
   let finish:number|undefined;
   let settled=false;
   const sample=()=>{
     if(settled)return;
     const videos=[welcomeRef.current,anak1Ref.current,anak2Ref.current,...(family.doaVideo?[doaRef.current]:[])];
     const values=videos.map(video=>{
       if(!video||video.error)return 0;
       const t=video.currentTime;
       let ahead=0;
       for(let i=0;i<video.buffered.length;i++){
         if(video.buffered.start(i)<=t+.1&&video.buffered.end(i)>=t)ahead=Math.max(ahead,video.buffered.end(i)-t);
       }
       const target=Number.isFinite(video.duration)?Math.max(.25,Math.min(3,video.duration-t)):3;
       const playable=video.readyState>=4||(video.readyState>=3&&ahead>=Math.min(1.5,target));
       return playable?1:Math.min(.96,Math.max(video.readyState>=2?.35:video.readyState>=1?.12:0,.9*ahead/target));
     });
     const all=values.every(value=>value===1);
     const elapsed=performance.now()-started;
     setProgress(Math.round(values.reduce((x,y)=>x+y,0)/values.length*100));
     setLoadNotice(elapsed>=10000);
     if(all){
       settled=true;
       finish=window.setTimeout(()=>setStage("welcome"),Math.max(350,700-elapsed));
     }else if(elapsed>=25000){
       settled=true;
       setStage("welcome");
     }
   };
   warmVideos();sample();
   const timer=window.setInterval(sample,200);
   return ()=>{window.clearInterval(timer);window.clearTimeout(finish);};
 },[stage]);
 useEffect(()=>{
   if(stage!=="welcome")return;
   const video=welcomeRef.current;
   if(!video)return;
   video.muted=true;
   if(video.readyState>=1)video.currentTime=0;
   void video.play().catch(()=>{});
 },[stage]);
 function enterFamily(){
   welcomeRef.current?.pause();
   if(welcomeRef.current)welcomeRef.current.muted=true;
   setWelcomeSound(false);
   const video=anak1Ref.current;
   if(video){video.muted=true;void video.play().catch(()=>{});}
   setMenu("anak1");setPage(0);setStage("site");
 }
 function toggleWelcomeSound(){
   const video=welcomeRef.current;
   if(!video)return;
   video.muted=!video.muted;
   setWelcomeSound(!video.muted);
   void video.play().catch(()=>{video.muted=true;setWelcomeSound(false);});
 }
 useEffect(()=>{
   if(stage!=="site")return;
   const video=menu==="anak1"?anak1Ref.current:menu==="anak2"?anak2Ref.current:menu==="doa"?doaRef.current:null;
   if(video){video.muted=true;void video.play().catch(()=>{});}
 },[stage,menu]);
 useEffect(()=>{if(!zoom)return;const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setZoom(null);};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[zoom]);
 function navigate(target:Menu){
   const video=target==="anak1"?anak1Ref.current:target==="anak2"?anak2Ref.current:target==="doa"?doaRef.current:null;
   if(video){video.muted=true;void video.play().catch(()=>{});}
   setMenu(target);setPage(0);window.scrollTo({top:0,behavior:"auto"});
 }
 function replayIntro(){
   setProgress(0);setLoadNotice(false);setWelcomeSound(false);setWelcomeFailed(false);setStage("loading");setMenu("anak1");setPage(0);
 }
 const child=menu==="anak1"?family.anak1:menu==="anak2"?family.anak2:null;
 const label=menus.find(item=>item.id===menu)?.title||"Anak 1";
 const cinematic=Boolean(child)||menu==="doa";
 const pageTotal=Math.ceil(4/pageSize);

 return <main className={"family-cinema family-site"+(stage!=="site"||cinematic?" family-fullscreen":" family-gallery-site")+(child?" family-child-site":"")}>
  <div className="family-preloaded-scene" aria-hidden="true" data-visible={stage==="site"&&Boolean(child||menu==="doa")}>
    <video ref={anak1Ref} src={family.anak1.video} preload="auto" autoPlay muted loop playsInline disablePictureInPicture data-active={menu==="anak1"}/>
    <video ref={anak2Ref} src={family.anak2.video} preload="auto" autoPlay muted loop playsInline disablePictureInPicture data-active={menu==="anak2"}/>
    {family.doaVideo?<video ref={doaRef} src={family.doaVideo} preload="auto" autoPlay muted loop playsInline disablePictureInPicture data-active={menu==="doa"}/>:<img className="family-doa-poster" src={family.doaPoster} alt="" data-active={menu==="doa"}/>}
    <div className="family-scene-shade"/>
  </div>
  <div className="family-welcome" data-visible={stage==="welcome"} aria-hidden={stage!=="welcome"}>
    <video ref={welcomeRef} src={family.welcomeVideo} preload="auto" autoPlay muted={!welcomeSound} loop playsInline disablePictureInPicture onError={()=>setWelcomeFailed(true)} aria-label="Video kenangan keluarga"/>
    {stage==="welcome"&&<>
      <div className="family-welcome-shade"/>
      <button type="button" className="family-welcome-button" onClick={enterFamily}>Selamat Hari Anak Sedunia</button>
      {!welcomeFailed&&<button type="button" className="family-welcome-audio" onClick={toggleWelcomeSound}>{welcomeSound?"♫ Matikan suara":"♫ Aktifkan suara"}</button>}
    </>}
  </div>
  {stage==="loading"?<div className="family-liquid-intro" role="progressbar" aria-label="Memuat video NAMINA" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
    <span className="namina-liquid-loader family-media-meter" aria-hidden="true">
      <span className="namina-liquid-loader__base"><NaminaLogo variant="hero"/></span>
      <span className="namina-liquid-loader__fill" style={{clipPath:"polygon(0 "+(100-progress)+"%,20% "+Math.max(0,100-progress-(progress===100?0:2))+"%,40% "+Math.min(100,100-progress+(progress===100?0:2))+"%,60% "+Math.max(0,100-progress-(progress===100?0:1))+"%,80% "+Math.min(100,100-progress+(progress===100?0:2))+"%,100% "+(100-progress)+"%,100% 100%,0 100%)"}}><NaminaLogo variant="hero"/></span>
    </span>
    {loadNotice&&<span className="family-loading-hint">Menyiapkan video kenangan…</span>}
  </div>:stage==="site"?<>
  <header className="family-header"><button className="family-brand" onClick={()=>navigate("anak1")}>NAMINA</button><nav aria-label="Menu keluarga">{menus.map(item=><button key={item.id} aria-current={menu===item.id?"page":undefined} onClick={()=>navigate(item.id)}><span className="family-nav-icon" aria-hidden="true">{item.id==="kenangan"?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5"/></svg>:item.id==="doa"?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.9c-2.4-2.3-6.2-1.8-8.8 1.6C9.4 3.1 5.6 2.6 3.2 4.9c-2.8 2.7-2.3 6.9 1 10.2L12 22l7.8-6.9c3.3-3.3 3.8-7.5 1-10.2Z"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-2.5a7 7 0 0 1 14 0V20"/></svg>}</span><span>{item.title}</span></button>)}</nav></header>
  <section className={"family-stage family-"+menu} key={menu} aria-label={label}>
   {child?<div className="family-scene-content"><div className="family-copy"><span className="family-kicker">UNTUK PUTRA TERCINTA</span><h1>{child.name}</h1>{child.job&&<h2 className="family-profession">{child.job}</h2>}<p>Di setiap langkahmu, ada doa Papa dan Mama.</p><div className="family-points">{child.prayers.slice(page*pageSize,(page+1)*pageSize).map(([title,detail])=><article key={title}><span>✦</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><PageControls page={page} total={pageTotal} onChange={setPage}/></div></div>
   :menu==="kenangan"?<div className="family-editorial-gallery">
      <div className="family-editorial-heading"><span className="family-kicker">ALBUM KELUARGA · LOVE LEGACY</span><h1>Kenangan</h1><p>Waktu berlalu, cinta tidak.</p></div>
      <div className="family-magazine-window" data-single={family.gallery.length===1} data-paused={galleryPaused||Boolean(zoom)}>
        <div className="family-magazine-track" style={{animationDuration:Math.max(24,family.gallery.length*6)+"s"}}>
          {(family.gallery.length>1?[0,1]:[0]).map(copy=><div className="family-magazine-group" key={copy} aria-hidden={copy===1}>
            {family.gallery.map((item,i)=><button type="button" className="family-magazine-card" key={i} tabIndex={copy===1?-1:0} onClick={()=>setZoom(galleryImageUrl(item.src))}>
              <div className="family-magazine-top"><span>LOVE LEGACY</span><span>{String(i+1).padStart(2,"0")}</span></div>
              <div className="family-magazine-photo"><img src={galleryImageUrl(item.src)} alt={copy===1?"":item.title} decoding="async"/></div>
              <div className="family-magazine-copy"><span className="family-magazine-tag">FAMILY MEMORIES</span><strong>{item.title}</strong><p>{item.detail}</p></div>
            </button>)}
          </div>)}
        </div>
      </div>
      <div className="family-editorial-controls"><button type="button" className="family-gallery-motion" onClick={()=>setGalleryPaused(v=>!v)} aria-pressed={galleryPaused}>{galleryPaused?"▶ Lanjutkan animasi":"Ⅱ Jeda animasi"}</button><span>Ketuk foto untuk memperbesar</span></div>
    </div>
   :<div className="family-scene-content"><div className="family-copy"><span className="family-kicker">HARI INI DAN SELAMANYA</span><h1>Doa &amp; Harapan</h1><p>Semoga Allah senantiasa menyertai setiap perjalanan kalian.</p><div className="family-points">{prayers.slice(page*pageSize,(page+1)*pageSize).map(([title,detail])=><article key={title}><span>♡</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><PageControls page={page} total={pageTotal} onChange={setPage}/><span className="family-sign">Aamiin ya Rabbal Alamin.</span></div></div>}
  </section>
  {!cinematic&&<footer className="family-footer"><span>LOVE LEGACY · NAMINA</span><button className="family-quiet" onClick={replayIntro}>Putar ulang intro</button></footer>}
  {zoom&&<div role="dialog" aria-modal="true" aria-label="Foto kenangan" className="family-lightbox" onClick={()=>setZoom(null)}><button aria-label="Tutup foto" onClick={()=>setZoom(null)}>×</button><img src={zoom} alt="Kenangan keluarga" onClick={e=>e.stopPropagation()}/></div>}
 </>:null}
 </main>;
}
