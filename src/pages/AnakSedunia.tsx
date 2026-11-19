import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type CSSProperties } from "react";
import { createFamilySample } from "../static/familySample";
import { defaultFamilyDesign, type FamilyDesign, type FamilyView } from "../static/familyDesign";
import { NaminaLogo } from "../components/NaminaLogo";
import "./anakSedunia.css";

type Menu = "anak1" | "anak2" | "kenangan" | "doa";
const menuDefinitions = [
  {id:"anak1", title: "Edo", sub:"Profil, perjalanan & doa", icon:"♙"},
  {id:"anak2", title: "Yuda", sub:"Profil, perjalanan & doa", icon:"♙"},
  {id:"doa", title: "Doa", sub:"Hari ini dan selamanya", icon:"♡"},
  {id:"kenangan", title: "Kenangan", sub:"Galeri perjalanan keluarga", icon:"▧"}
] as const;
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
function MemoryCarousel({zoomed,onOpen,design}:{zoomed:boolean;onOpen:(src:string)=>void;design:FamilyDesign}){
 const [paused,setPaused]=useState(false);
 const speed=useRef(design.style.speed);speed.current=design.style.speed;
 const viewport=useRef<HTMLDivElement|null>(null);
 const track=useRef<HTMLDivElement|null>(null);
 const group=useRef<HTMLDivElement|null>(null);
 const offset=useRef(0);
 const width=useRef(0);
 const hold=useRef(0);
 const stopped=useRef(false);
 const drag=useRef<{id:number;x:number;start:number;moved:boolean}|null>(null);
 const suppressClick=useRef(false);
 function paint(){
   if(!track.current||!width.current)return;
   offset.current=((offset.current%width.current)+width.current)%width.current;
   track.current.style.transform="translate3d("+(-width.current-offset.current)+"px,0,0)";
 }
 useEffect(()=>{stopped.current=paused||zoomed;},[paused,zoomed]);
 useEffect(()=>{
   const element=group.current;
   if(!element)return;
   const measure=()=>{width.current=element.getBoundingClientRect().width;paint();};
   measure();
   const observer=new ResizeObserver(measure);
   observer.observe(element);
   if(viewport.current)observer.observe(viewport.current);
   let frame=0,last=performance.now();
   const tick=(now:number)=>{
     const dt=Math.min(50,Math.max(0,now-last))/1000;last=now;
     if(!stopped.current&&!drag.current&&now>=hold.current&&width.current){
       offset.current+=dt*speed.current*(window.innerWidth<=760?.83:1);
       paint();
     }
     frame=requestAnimationFrame(tick);
   };
   frame=requestAnimationFrame(tick);
   return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[]);
 function pointerDown(e:ReactPointerEvent<HTMLDivElement>){
   if(!e.isPrimary||e.button!==0)return;
   suppressClick.current=false;
   drag.current={id:e.pointerId,x:e.clientX,start:offset.current,moved:false};
   const target=e.target instanceof Element?e.target.closest("button"):null;
   (target||e.currentTarget).setPointerCapture(e.pointerId);
 }
 function pointerMove(e:ReactPointerEvent<HTMLDivElement>){
   const d=drag.current;
   if(!d||d.id!==e.pointerId)return;
   const dx=e.clientX-d.x;
   if(Math.abs(dx)>5)d.moved=true;
   if(d.moved){suppressClick.current=true;offset.current=d.start-dx;paint();e.preventDefault();}
 }
 function pointerEnd(e:ReactPointerEvent<HTMLDivElement>){
   if(drag.current?.id!==e.pointerId)return;
   if(drag.current.moved)hold.current=performance.now()+700;
   drag.current=null;
 }
 function nudge(direction:number){
   offset.current+=direction*Math.min(330,(viewport.current?.clientWidth||330)*.7);
   paint();hold.current=performance.now()+700;
 }
 return <>
   <div ref={viewport} className="family-magazine-window family-draggable-gallery" role="region" aria-label="Galeri foto keluarga, geser ke kiri atau kanan"
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}
      onClickCapture={e=>{if(suppressClick.current&&e.detail!==0){e.preventDefault();e.stopPropagation();suppressClick.current=false;}}}
      onWheel={e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){offset.current+=e.deltaX;paint();hold.current=performance.now()+700;}}}>
     <div ref={track} className="family-magazine-track" style={{transform:"translate3d(0,0,0)"}}>
       {[0,1,2].map(copy=><div ref={copy===0?group:undefined} className="family-magazine-group" key={copy} aria-hidden={copy!==1}>
         {design.gallery.map((item,i)=><button type="button" className="family-magazine-card" key={i} tabIndex={copy===1?0:-1} onClick={()=>{if(item.src)onOpen(galleryImageUrl(item.src));}}>
           <div className="family-magazine-top"><span>{design.galleryBrand}</span><span>{String(i+1).padStart(2,"0")}</span></div>
           <div className="family-magazine-photo" data-portrait={item.portrait}>{item.src?<img src={galleryImageUrl(item.src)} alt={item.title} decoding="async" draggable={false}/>:<span className="family-image-placeholder">Tambahkan foto</span>}</div>
           <div className="family-magazine-copy"><span className="family-magazine-tag">{design.galleryTag}</span><strong>{item.title}</strong><p>{item.detail}</p></div>
         </button>)}
       </div>)}
     </div>
   </div>
   <div className="family-editorial-controls"><button type="button" className="family-gallery-motion" onClick={()=>nudge(-1)} aria-label="Geser foto ke kanan">‹</button><button type="button" className="family-gallery-motion" onClick={()=>setPaused(v=>!v)} aria-pressed={paused}>{paused?"▶ Lanjutkan animasi":"Ⅱ Jeda animasi"}</button><button type="button" className="family-gallery-motion" onClick={()=>nudge(1)} aria-label="Geser foto ke kiri">›</button><span>{design.galleryHint}</span></div>
 </>;
}
export function AnakSedunia({design,studioPreview=false,previewView="anak1"}:{design?:FamilyDesign;studioPreview?:boolean;previewView?:FamilyView}={}){
 const [demo]=useState(createFamilySample);
 const family=design|| (studioPreview?defaultFamilyDesign():demo);
 const menus=menuDefinitions.map(item=>({...item,title:item.id==="anak1"?family.anak1.menu:item.id==="anak2"?family.anak2.menu:item.id==="doa"?family.doaMenu:family.galleryMenu}));
 const prayers=family.prayers;
 const [stage,setStage]=useState<"loading"|"welcome"|"site">(studioPreview?"site":"loading");
 const [menu,setMenu]=useState<Menu>("anak1");
 useEffect(()=>{if(!studioPreview)return;setStage(previewView==="welcome"?"welcome":"site");if(previewView!=="welcome")setMenu(previewView);setPage(0);},[studioPreview,previewView]);
 const [zoom,setZoom]=useState<string|null>(null);
 const [page,setPage]=useState(0);
 const [pageSize,setPageSize]=useState(viewportPageSize);
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
     const videos=[welcomeRef.current,anak1Ref.current,anak2Ref.current,doaRef.current].filter(Boolean);
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
     setProgress(Math.round(values.length?values.reduce((x,y)=>x+y,0)/values.length*100:100));
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
 const label=menus.find(item=>item.id===menu)?.title||"Edo";
 const cinematic=Boolean(child)||menu==="doa";
 const pageTotal=Math.max(1,Math.ceil((child?child.prayers.length:prayers.length)/pageSize));
 const visiblePage=Math.min(page,pageTotal-1);
 const themeStyle=design||studioPreview?({"--family-bg":family.style.background,"--gold":family.style.accent,"--family-text":family.style.text,"--muted":family.style.muted,"--family-card":family.style.card,"--family-card-ink":family.style.cardInk,"--family-overlay":family.style.overlay,"--family-heading-scale":family.style.headingScale,fontFamily:family.style.font==="modern"?"system-ui,sans-serif":"Georgia,serif"} as CSSProperties):undefined;

 return <main style={themeStyle} className={"family-cinema family-site"+(themeStyle?" family-custom":"")+(stage!=="site"||cinematic?" family-fullscreen":" family-gallery-site")+(child?" family-child-site":"")}>
  <div className="family-preloaded-scene" aria-hidden="true" data-visible={stage==="site"&&Boolean(child||menu==="doa")}>
    {family.anak1.video?<video ref={anak1Ref} src={galleryImageUrl(family.anak1.video)} preload="auto" autoPlay muted loop playsInline disablePictureInPicture data-active={menu==="anak1"}/>:family.anak1.poster?<img className="family-doa-poster" src={galleryImageUrl(family.anak1.poster)} alt="" data-active={menu==="anak1"}/>:null}
    {family.anak2.video?<video ref={anak2Ref} src={galleryImageUrl(family.anak2.video)} preload="auto" autoPlay muted loop playsInline disablePictureInPicture data-active={menu==="anak2"}/>:family.anak2.poster?<img className="family-doa-poster" src={galleryImageUrl(family.anak2.poster)} alt="" data-active={menu==="anak2"}/>:null}
    {family.doaVideo?<video ref={doaRef} src={galleryImageUrl(family.doaVideo)} preload="auto" autoPlay muted loop playsInline disablePictureInPicture data-active={menu==="doa"}/>:family.doaPoster?<img className="family-doa-poster" src={galleryImageUrl(family.doaPoster)} alt="" data-active={menu==="doa"}/>:null}
    <div className="family-scene-shade"/>
  </div>
  <div className="family-welcome" data-visible={stage==="welcome"} aria-hidden={stage!=="welcome"}>
    {family.welcomeVideo?<video ref={welcomeRef} src={galleryImageUrl(family.welcomeVideo)} preload="auto" autoPlay muted={!welcomeSound} loop playsInline disablePictureInPicture onError={()=>setWelcomeFailed(true)} aria-label="Video kenangan keluarga"/>:family.welcomePoster?<img className="family-welcome-poster" src={galleryImageUrl(family.welcomePoster)} alt=""/>:null}
    {stage==="welcome"&&<>
      <div className="family-welcome-shade"/>
      <button type="button" className="family-welcome-button" onClick={enterFamily}>{family.welcomeButton}</button>
      {family.welcomeVideo&&!welcomeFailed&&<button type="button" className="family-welcome-audio" onClick={toggleWelcomeSound}>{welcomeSound?"♫ Matikan suara":"♫ Aktifkan suara"}</button>}
    </>}
  </div>
  {stage==="loading"?<div className="family-liquid-intro" role="progressbar" aria-label="Memuat video NAMINA" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
    <span className="namina-liquid-loader family-media-meter" aria-hidden="true">
      <span className="namina-liquid-loader__base"><NaminaLogo variant="hero"/></span>
      <span className="namina-liquid-loader__fill" style={{clipPath:"polygon(0 "+(100-progress)+"%,20% "+Math.max(0,100-progress-(progress===100?0:2))+"%,40% "+Math.min(100,100-progress+(progress===100?0:2))+"%,60% "+Math.max(0,100-progress-(progress===100?0:1))+"%,80% "+Math.min(100,100-progress+(progress===100?0:2))+"%,100% "+(100-progress)+"%,100% 100%,0 100%)"}}><NaminaLogo variant="hero"/></span>
    </span>
    {loadNotice&&<span className="family-loading-hint">{family.loadingText}</span>}
  </div>:stage==="site"?<>
  <header className="family-header"><button className="family-brand" onClick={()=>navigate("anak1")}>{family.brandLogo?<img className="family-custom-logo" src={galleryImageUrl(family.brandLogo)} alt={family.brand}/>:family.brand}</button><nav aria-label="Menu keluarga">{menus.map(item=><button key={item.id} aria-current={menu===item.id?"page":undefined} onClick={()=>navigate(item.id)}><span className="family-nav-icon" aria-hidden="true">{item.id==="kenangan"?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5"/></svg>:item.id==="doa"?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.9c-2.4-2.3-6.2-1.8-8.8 1.6C9.4 3.1 5.6 2.6 3.2 4.9c-2.8 2.7-2.3 6.9 1 10.2L12 22l7.8-6.9c3.3-3.3 3.8-7.5 1-10.2Z"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-2.5a7 7 0 0 1 14 0V20"/></svg>}</span><span>{item.title}</span></button>)}</nav></header>
  <section className={"family-stage family-"+menu} key={menu} aria-label={label}>
   {child?<div className="family-scene-content"><div className="family-copy"><span className="family-kicker">{child.kicker}</span><h1>{child.name}</h1>{child.job&&<h2 className="family-profession">{child.job}</h2>}<p>{child.intro}</p><div className="family-points">{child.prayers.slice(visiblePage*pageSize,(visiblePage+1)*pageSize).map(([title,detail])=><article key={title}><span>✦</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><PageControls page={visiblePage} total={pageTotal} onChange={setPage}/></div></div>
   :menu==="kenangan"?<div className="family-editorial-gallery">
      <div className="family-editorial-heading"><span className="family-kicker">{family.galleryKicker}</span><h1>{family.galleryTitle}</h1><p>{family.galleryIntro}</p></div>
      {family.gallery.length?<MemoryCarousel zoomed={Boolean(zoom)} onOpen={setZoom} design={family}/>:<p>Belum ada foto.</p>}
    </div>
   :<div className="family-scene-content"><div className="family-copy"><span className="family-kicker">{family.doaKicker}</span><h1>{family.doaTitle}</h1><p>{family.doaIntro}</p><div className="family-points">{prayers.slice(visiblePage*pageSize,(visiblePage+1)*pageSize).map(([title,detail])=><article key={title}><span>♡</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div><PageControls page={visiblePage} total={pageTotal} onChange={setPage}/><span className="family-sign">{family.doaClosing}</span></div></div>}
  </section>
  {!cinematic&&<footer className="family-footer"><span>{family.footer}</span><button className="family-quiet" onClick={replayIntro}>{family.replayLabel}</button></footer>}
  {zoom&&<div role="dialog" aria-modal="true" aria-label="Foto kenangan" className="family-lightbox" onClick={()=>setZoom(null)}><button aria-label="Tutup foto" onClick={()=>setZoom(null)}>×</button><img src={zoom} alt="Kenangan keluarga" onClick={e=>e.stopPropagation()}/></div>}
 </>:null}
 </main>;
}
