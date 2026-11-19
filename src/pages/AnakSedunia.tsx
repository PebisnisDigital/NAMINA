import { useEffect, useRef, useState } from "react";
import { NaminaLogo } from "../components/NaminaLogo";
import "../intro-landing.css";
import "./anakSedunia.css";

type Menu = "anak1" | "anak2" | "kenangan" | "doa";
const photo = "/clients/anaksedunia/mama.webp";
// Set these to the approved family media URLs when available.
const family = {
  introVideo: "https://www.dropbox.com/scl/fi/r0pk04lqyqgxvlyq6r2wp/Namina_logo_reveal_animation_9149f6a7_1080p.mp4?rlkey=oegcrx65yg2fjmi4xfpt98xf0&raw=1",
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
  {id:"kenangan", title: "Kenangan", sub:"Galeri perjalanan keluarga", icon:"▧"},
  {id:"doa", title: "Doa", sub:"Hari ini dan selamanya", icon:"♡"}
] as const;
const prayers = [
  ["Sehat & bahagia","Semoga Allah menjaga tubuh, hati, dan pikiran kalian."],
  ["Sukses dalam karier","Semoga setiap usaha dan cita-cita dimudahkan."],
  ["Rezeki penuh berkah","Semoga rezeki halal, luas, dan bermanfaat selalu menyertai."],
  ["Anak yang saleh","Semoga selalu dekat dengan Allah, rendah hati, dan membawa kebaikan."]
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
 const [stage,setStage]=useState<"idle"|"intro"|"handoff"|"site">("idle");
 const [menu,setMenu]=useState<Menu>("anak1");
 const [zoom,setZoom]=useState<string|null>(null);
 const [videoFailed,setVideoFailed]=useState(false);
 const [page,setPage]=useState(0);
 const [pageSize,setPageSize]=useState(viewportPageSize);
 const [galleryPage,setGalleryPage]=useState(0);
 const touchStart=useRef<number|null>(null);
 useEffect(()=>{const resize=()=>{setPageSize(viewportPageSize());setPage(0);};window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize);},[]);
 const introRef=useRef<HTMLVideoElement|null>(null);
 const anak1Ref=useRef<HTMLVideoElement|null>(null);
 const anak2Ref=useRef<HTMLVideoElement|null>(null);
 const [introPlaying,setIntroPlaying]=useState(false);
 const [ready,setReady]=useState({anak1:false,anak2:false});
 const [failed,setFailed]=useState({anak1:false,anak2:false});
 function warmVideos(){
   for(const video of [anak1Ref.current,anak2Ref.current]){
     if(!video)continue;
     video.muted=true;
     void video.play().catch(()=>{});
   }
 }
 function startIntro(){
   setMenu("anak1");setPage(0);setIntroPlaying(false);setStage("intro");
   warmVideos();
   const video=introRef.current;
   if(!video){setStage("handoff");return;}
   video.muted=false;video.volume=1;video.currentTime=0;
   void video.play().catch(()=>{video.muted=true;void video.play().catch(()=>setStage("handoff"));});
 }
 function finishIntro(){
   introRef.current?.pause();
   setStage(old=>old==="site"?"site":"handoff");
 }
 useEffect(()=>{
   if(stage!=="intro")return;
   const timeout=window.setTimeout(()=>{introRef.current?.pause();setStage("handoff");},introPlaying?45000:18000);
   return ()=>window.clearTimeout(timeout);
 },[stage,introPlaying]);
 useEffect(()=>{
   if(stage!=="handoff")return;
   if((ready.anak1||failed.anak1)&&(ready.anak2||failed.anak2)){setStage("site");return;}
   const timeout=window.setTimeout(()=>setStage("site"),4500);
   return ()=>window.clearTimeout(timeout);
 },[stage,ready,failed]);
 useEffect(()=>{
   if(stage!=="site")return;
   const video=menu==="anak1"?anak1Ref.current:menu==="anak2"?anak2Ref.current:null;
   if(video){video.muted=true;void video.play().catch(()=>{});}
 },[stage,menu]);
 useEffect(()=>{if(!zoom)return;const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setZoom(null);};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[zoom]);
 function navigate(target:Menu){
   const video=target==="anak1"?anak1Ref.current:target==="anak2"?anak2Ref.current:null;
   if(video){video.muted=true;void video.play().catch(()=>{});}
   setMenu(target);setPage(0);setVideoFailed(false);window.scrollTo({top:0,behavior:"auto"});
 }
 function replayIntro(){
   setIntroPlaying(false);setStage("idle");setMenu("anak1");setPage(0);
 }
 const child=menu==="anak1"?family.anak1:menu==="anak2"?family.anak2:null;
 const label=menus.find(item=>item.id===menu)?.title||"Anak 1";
 const cinematic=Boolean(child)||menu==="doa";
 const sceneVideo=menu==="doa"?family.doaVideo:"";
 const scenePoster=menu==="doa"?family.doaPoster:"";
 const pageTotal=Math.ceil(4/pageSize);
 const galleryItem=family.gallery[galleryPage]||family.gallery[0];
 return <main className={"family-cinema family-site"+(stage!=="site"||cinematic?" family-fullscreen":" family-gallery-site")+(child?" family-child-site":"")}>
  <div className="family-preloaded-scene" aria-hidden="true" data-visible={stage==="site"&&Boolean(child)}>
    <video ref={anak1Ref} src={family.anak1.video} preload="auto" autoPlay muted loop playsInline disablePictureInPicture data-active={menu==="anak1"} onCanPlay={()=>setReady(old=>old.anak1?old:{...old,anak1:true})} onPlaying={()=>setReady(old=>old.anak1?old:{...old,anak1:true})} onError={()=>setFailed(old=>({...old,anak1:true}))}/>
    <video ref={anak2Ref} src={family.anak2.video} preload="auto" autoPlay muted loop playsInline disablePictureInPicture data-active={menu==="anak2"} onCanPlay={()=>setReady(old=>old.anak2?old:{...old,anak2:true})} onPlaying={()=>setReady(old=>old.anak2?old:{...old,anak2:true})} onError={()=>setFailed(old=>({...old,anak2:true}))}/>
    <div className="family-scene-shade"/>
  </div>
  {stage!=="site"?<div className="namina-entry family-logo-intro" aria-label="Intro NAMINA">
    <video ref={introRef} src={family.introVideo} preload="auto" playsInline disablePictureInPicture className={"namina-entry__video"+(introPlaying?" namina-entry__video--visible":"")} onPlaying={()=>setIntroPlaying(true)} onEnded={finishIntro} onError={()=>{if(stage==="intro")finishIntro();}}/>
    {stage==="idle"&&<button type="button" className="namina-entry__button" onClick={startIntro}>BUKA NAMINA</button>}
    {stage==="intro"&&!introPlaying&&<div className="namina-entry__loading" role="status"><span className="namina-entry__spinner" aria-hidden="true"/><span>MEMBUKA NAMINA</span></div>}
    {stage==="handoff"&&!introPlaying&&<NaminaLogo variant="hero"/>}
    {stage!=="idle"&&<button className="family-logo-skip" type="button" onClick={()=>{warmVideos();introRef.current?.pause();setStage("site");}}>Lewati intro ›</button>}
  </div>:<>
  <header className="family-header"><button className="family-brand" onClick={()=>navigate("anak1")}>NAMINA</button><nav aria-label="Menu keluarga">{menus.map(item=><button key={item.id} aria-current={menu===item.id?"page":undefined} onClick={()=>navigate(item.id)}><span className="family-nav-icon" aria-hidden="true">{item.id==="kenangan"?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5"/></svg>:item.id==="doa"?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.9c-2.4-2.3-6.2-1.8-8.8 1.6C9.4 3.1 5.6 2.6 3.2 4.9c-2.8 2.7-2.3 6.9 1 10.2L12 22l7.8-6.9c3.3-3.3 3.8-7.5 1-10.2Z"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-2.5a7 7 0 0 1 14 0V20"/></svg>}</span><span>{item.title}</span></button>)}</nav></header>
  <section className={"family-stage family-"+menu} key={menu} aria-label={label}>
   {menu==="doa"&&<div className="family-scene" aria-hidden="true">{scenePoster&&<img src={scenePoster} alt=""/>}{sceneVideo&&!videoFailed&&<video key={sceneVideo} src={sceneVideo} poster={scenePoster||undefined} autoPlay muted loop playsInline disablePictureInPicture onError={()=>setVideoFailed(true)}/>}<div className="family-scene-shade"/></div>}
   {child?<div className="family-scene-content"><div className="family-copy"><span className="family-kicker">UNTUK PUTRA TERCINTA</span><h1>{child.name}</h1>{child.job&&<h2 className="family-profession">{child.job}</h2>}<p>Di setiap langkahmu, ada doa Papa dan Mama.</p><div className="family-points">{child.prayers.slice(page*pageSize,(page+1)*pageSize).map(([title,detail])=><article key={title}><span>✦</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><PageControls page={page} total={pageTotal} onChange={setPage}/></div></div>
   :menu==="kenangan"?<div className="family-gallery"><span className="family-kicker">ALBUM KELUARGA</span><h1>Kenangan</h1><p>Waktu berlalu, cinta tidak.</p><div className="family-gallery-grid" onTouchStart={e=>{touchStart.current=e.touches[0]?.clientX??null;}} onTouchEnd={e=>{const x=touchStart.current;touchStart.current=null;if(x===null)return;const delta=(e.changedTouches[0]?.clientX??x)-x;if(Math.abs(delta)>45)setGalleryPage(i=>Math.max(0,Math.min(family.gallery.length-1,i+(delta<0?1:-1))));}}><button className="family-gallery-card" onClick={()=>setZoom(galleryItem.src)}><img src={galleryItem.src} alt={galleryItem.title}/><strong>{galleryItem.title}</strong><span>{galleryItem.detail}</span></button></div><PageControls page={galleryPage} total={family.gallery.length} onChange={setGalleryPage}/></div>
   :<div className="family-scene-content"><div className="family-copy"><span className="family-kicker">HARI INI DAN SELAMANYA</span><h1>Doa &amp; Harapan</h1><p>Semoga Allah senantiasa menyertai setiap perjalanan kalian.</p><div className="family-points">{prayers.slice(page*pageSize,(page+1)*pageSize).map(([title,detail])=><article key={title}><span>♡</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><PageControls page={page} total={pageTotal} onChange={setPage}/><span className="family-sign">Aamiin ya Rabbal Alamin.</span></div></div>}
  </section>
  {!cinematic&&<footer className="family-footer"><span>LOVE LEGACY · NAMINA</span><button className="family-quiet" onClick={replayIntro}>Putar ulang intro</button></footer>}
  {zoom&&<div role="dialog" aria-modal="true" aria-label="Foto kenangan" className="family-lightbox" onClick={()=>setZoom(null)}><button aria-label="Tutup foto" onClick={()=>setZoom(null)}>×</button><img src={zoom} alt="Kenangan keluarga" onClick={e=>e.stopPropagation()}/></div>}
 </>}
 </main>;
}
