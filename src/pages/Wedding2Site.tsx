import { useEffect, useRef, useState, type CSSProperties } from "react";
import { WeddingCanvasElements } from "../components/WeddingCanvasElements";
import { defaultWeddingDesign, type WeddingSection } from "../static/weddingDesign";
import type { SiteDocument } from "../static/sites";
import { playableDropboxMediaUrl } from "../static/sites";
import { createWedding2Template } from "../static/wedding2Template";
import "./Wedding2Site.css";

type Stage = "cover" | "opening" | "film" | "page";
type Props = { document: SiteDocument; studioPreview?: boolean; editorMode?: boolean; selectedId?: string; studioStage?: "cover"|"film"|"page" };
const fallbackPhoto = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80";
const fallbackGallery = [
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=75",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=75",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=75",
];
function Petals({ className = "" }: { className?: string }) {
  return <svg className={"w2-petals " + className} viewBox="0 0 240 260" fill="none" aria-hidden="true">
    <path d="M12 258C65 198 28 100 157 23M71 177c58-21 90-70 118-131M102 117c-22-28-39-59-46-91" stroke="#648068" strokeWidth="2.2" strokeLinecap="round"/>
    {[[157,23,-30],[181,44,31],[107,117,4],[65,175,-29],[57,25,15],[151,85,12],[203,29,0]].map(([x,y,rotate],i)=>
      <g key={i} transform={`translate(${x} ${y}) rotate(${rotate})`}>
        <ellipse cx="0" cy="-17" rx="11" ry="20" fill="#fbfbef" stroke="#d9d5be"/>
        <ellipse cx="0" cy="17" rx="11" ry="20" fill="#fffef5" stroke="#d9d5be"/>
        <ellipse cx="-17" cy="0" rx="20" ry="11" fill="#fffef5" stroke="#d9d5be"/>
        <ellipse cx="17" cy="0" rx="20" ry="11" fill="#fbfaf1" stroke="#d9d5be"/>
        <circle r="5" fill="#c6ab68"/>
      </g>)}
    <path d="M33 223q-34-4-17-34 23 6 17 34Zm27-47q23-36 44-21-9 24-44 21Zm26-63q-32-25-19-45 25 9 19 45Zm52-46q22-30 46-20-12 24-46 20Z" fill="#829c79" opacity=".9"/>
  </svg>;
}
function PaperTitle({ children, eyebrow, editable }: { children: React.ReactNode; eyebrow?: string; editable?: string }) {
  return <header className="w2-section-title">
    {eyebrow && <span className="w2-eyebrow">{eyebrow}</span>}
    <h2 data-w2-select={editable}>{children}</h2><span className="w2-title-ornament">✦ ─── ♡ ─── ✦</span>
  </header>;
}
function Counter({ date }: { date: string }) {
  const count = () => {
    const total = Math.max(0, new Date(date).getTime() - Date.now());
    const safe = Number.isFinite(total) ? Math.floor(total / 1000) : 0;
    return [Math.floor(safe / 86400), Math.floor(safe / 3600) % 24, Math.floor(safe / 60) % 60, safe % 60];
  };
  const [numbers, setNumbers] = useState(count);
  useEffect(() => { const timer = window.setInterval(() => setNumbers(count()), 1000); return () => clearInterval(timer); }, [date]);
  return <div className="w2-countdown" aria-label="Hitung mundur pernikahan">
    {numbers.map((n,i) => <div className="w2-counter" key={i}><strong>{String(n).padStart(2,"0")}</strong><span>{["Hari","Jam","Menit","Detik"][i]}</span></div>)}
  </div>;
}
function Section({ id, children, className = "", color }: { id: string; children: React.ReactNode; className?: string; color?: string }) {
  return <section id={id} className={"w2-paper-section " + className} style={color ? { backgroundColor:color } : undefined}>{children}</section>;
}
export function Wedding2Site({ document: site, studioPreview = false, editorMode = false, selectedId = "", studioStage = "page" }: Props) {
  const original = site.content.original;
  const design = site.weddingDesign || defaultWeddingDesign();
  const sectionColor = (section: WeddingSection) => design.sectionColors?.[section];
  const rootStyle = {
    "--w2-paper":design.surface, "--w2-green":design.primary, "--w2-ink":design.primary,
    "--w2-gold":design.accent, "--w2-page-background":design.background,
    "--w2-heading-scale":design.headingScale,
  } as CSSProperties;
  const placed = (section: WeddingSection) => <WeddingCanvasElements elements={design.elements} section={section} editorMode={editorMode} selectedId={selectedId}/>;
  const [phase,setPhase] = useState<Stage>(studioPreview ? "page" : "cover");
  const displayed = studioPreview ? studioStage : phase;
  const [guest,setGuest] = useState("");
  const [guestName,setGuestName] = useState("");
  const [attending,setAttending] = useState("hadir");
  const [message,setMessage] = useState("");
  const [sent,setSent] = useState(false);
  const [muted,setMuted] = useState(true);
  const [activePhoto,setActivePhoto] = useState<number | null>(null);
  const film = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const couple = site.content.identity.displayName || "Hizqil & Icaa";
  const names = couple.split(/\s*&\s*/);
  const groom = names[0] || "Hizqil", bride = names[1] || "Icaa";
  const byKey = <K extends "nama"|"karir"|"skill"|"karya"|"produk",>(key: K) => original?.[key];
  const field = (index:number) => byKey("karir")?.items[index]?.value || "";
  const date = field(0) || "2027-02-20T08:00:00+07:00";
  const dateObj = new Date(date);
  const dateLabel = Number.isFinite(dateObj.getTime()) ? new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"}).format(dateObj) : date;
  const photo = site.media.portrait || site.media.poster || fallbackPhoto;
  const introVideo = playableDropboxMediaUrl(site.media.mobileVideo || site.media.desktopVideo || "");
  const gallery = byKey("karya")?.items.slice(0,6) || [];
  const photos = gallery.length ? gallery.map((g,i)=>site.media.cards[g.id] || fallbackGallery[i % fallbackGallery.length]) : fallbackGallery;
  const revealGuest = new URLSearchParams(typeof location !== "undefined" ? location.search : "").get("to") || "";
  useEffect(() => { setGuest(revealGuest.slice(0,80)); },[revealGuest]);
  useEffect(() => {
    if(studioPreview || phase === "page") return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {document.body.style.overflow = before;};
  },[phase,studioPreview]);
  useEffect(() => {
    if(phase !== "opening")return;
    const t = window.setTimeout(()=>setPhase("film"),1000);
    return () => clearTimeout(t);
  },[phase]);
  useEffect(() => {
    if(phase !== "film")return;
    let timer = window.setTimeout(()=>setPhase("page"),introVideo ? 14000 : 5200);
    if(introVideo && film.current) {
      film.current.currentTime = 0;
      void film.current.play().catch(()=>{window.clearTimeout(timer);timer=window.setTimeout(()=>setPhase("page"),5200);});
    }
    return () => {window.clearTimeout(timer);film.current?.pause();};
  },[phase,introVideo]);
  useEffect(() => {
    if(phase!=="page")return;
    const nodes = frame.current?.querySelectorAll<HTMLElement>(".w2-reveal") || [];
    if(!("IntersectionObserver" in window)) {nodes.forEach(n=>n.classList.add("w2-visible"));return;}
    const observer = new IntersectionObserver(entries => entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add("w2-visible");observer.unobserve(e.target); }
    }),{threshold:.1});
    nodes.forEach(n=>observer.observe(n));
    return () => observer.disconnect();
  },[phase]);
  useEffect(() => {
    if(!editorMode)return;
    frame.current?.querySelectorAll<HTMLElement>("[data-w2-select]").forEach(node=>
      node.classList.toggle("w2-active-edit",node.dataset.w2Select===selectedId));
  },[editorMode,selectedId]);
  const onEditClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if(!editorMode)return;
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-w2-select]") : null;
    if(!target)return;
    event.preventDefault();
    event.stopPropagation();
    if(window.parent!==window)window.parent.postMessage({type:"WEDDING2_SELECT",id:target.dataset.w2Select},window.location.origin);
  };
  const done = () => {setPhase("page");window.scrollTo({top:0,behavior:"instant"});};
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(!guestName.trim() || !message.trim())return;
    try{localStorage.setItem("namina:wedding2:rsvp:"+site.slug,JSON.stringify({name:guestName.slice(0,60),attending,message:message.slice(0,400)}));}catch{/* local-only preview */}
    setSent(true);
  };
  return <div className={"w2-root w2-font-"+design.font+" w2-motion-"+design.motion+(editorMode?" w2-root--editing":"")} ref={frame} style={rootStyle} onClickCapture={onEditClick}>
    {displayed !== "page" && <div className={"w2-stage w2-stage--"+displayed}>
      {displayed==="cover"||displayed==="opening" ? <div className="w2-cover">
        <Petals className="w2-cover-flower w2-cover-flower--left"/>
        <Petals className="w2-cover-flower w2-cover-flower--right"/>
        <p className="w2-overline">THE WEDDING INVITATION</p>
        <h1 data-w2-select="couple">{couple}</h1>
        <p data-w2-select="cover-subtitle" className="w2-cover-intro">{design.coverSubtitle||"Sebuah kisah, satu janji selamanya."}</p>
        <button type="button" className="w2-envelope-button" aria-label="Buka amplop undangan" onClick={()=>setPhase("opening")} disabled={phase==="opening"}>
          <span className="w2-envelope">
            <span className="w2-envelope-back"/><span className="w2-envelope-letter">{couple}<small>You're invited</small></span>
            <span className="w2-envelope-face"/><span className="w2-envelope-flap"/>
            <span className="w2-envelope-seal">❦</span>
          </span>
        </button>
        <span className="w2-hint">Sentuh amplop untuk membuka</span>
        <button type="button" className="w2-cover-cta" onClick={()=>setPhase("opening")} data-w2-select="cover-button">{design.coverButtonText||"Buka Undangan"} <span aria-hidden="true">↗</span></button>
        <p className="w2-guest">Kepada Yth. {guest || "Bapak / Ibu / Saudara/i"}</p>
      </div> : <div className="w2-film">
        {introVideo ? <video ref={film} src={introVideo} poster={site.media.poster||undefined} muted={muted} playsInline autoPlay onEnded={done} onError={done} aria-label="Video pembuka undangan"/> :
        <div className="w2-film-art" style={{backgroundImage:`linear-gradient(0deg,rgba(28,44,32,.72),rgba(38,49,31,.16)),url("${photo}")`}}/>}
        <div className="w2-film-caption"><span>OUR STORY BEGINS</span><strong>{couple}</strong><p>{dateLabel}</p></div>
        <div className="w2-film-buttons">{introVideo&&<button type="button" onClick={()=>setMuted(!muted)}>{muted?"Nyalakan Suara":"Bisukan"}</button>}<button type="button" onClick={done}>Lewati Intro ↗</button></div>
        {!introVideo && <p className="w2-film-fallback">Animasi pembuka · Ganti dengan video klien lewat Studio</p>}
      </div>}
    </div>}

    {displayed==="page"&&<>
      <nav className="w2-topbar" aria-label="Navigasi undangan"><a href="#beranda" className="w2-monogram">W<span>♡</span></a><span>THE WEDDING OF {couple}</span><a href="#acara">Detail Acara ↗</a></nav>
      <main className="w2-main">
        <section id="beranda" className="w2-hero" style={sectionColor("beranda")?{backgroundColor:sectionColor("beranda")}:undefined}>
          <Petals className="w2-hero-flower w2-hero-flower--left"/><Petals className="w2-hero-flower w2-hero-flower--right"/>
          <div className="w2-hero-inner w2-reveal">
            <p className="w2-overline">THE WEDDING OF</p>
            <h1 data-w2-select="couple">{couple}</h1>
            <div className="w2-hero-divider">✧ ───── ♡ ───── ✧</div>
            <p data-w2-select="date">{dateLabel}</p>
            <div className="w2-hero-photo" data-w2-select="photo"><img src={photo} alt="Ilustrasi pasangan pengantin. Ganti foto dengan foto klien di Studio." loading="eager" onError={e=>{e.currentTarget.style.opacity="0";}} /></div>
            <p className="w2-hero-verse" data-w2-select="bio">{site.content.identity.bio || "Dua hati, satu perjalanan, dan doa yang menyatukan."}</p>
          </div>
          {placed("beranda")}
        </section>

        <Section id="mempelai" color={sectionColor("mempelai")} className="w2-introduction">
          <div className="w2-reveal"><PaperTitle editable="heading:mempelai" eyebrow="BISMILLAHIRRAHMANIRRAHIM">{design.sectionTitles?.mempelai||"Dengan Penuh Cinta"}</PaperTitle>
          <p className="w2-centered-copy" data-w2-select="intro">{byKey("nama")?.description || "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Anda untuk hadir pada hari pernikahan kami."}</p>
          <div className="w2-names"><div><span>Mempelai Pria</span><strong>{groom}</strong><p data-w2-select="parent-0">{byKey("nama")?.items[0]?.value||"Putra dari keluarga tercinta"}</p></div><span className="w2-amp">&</span><div><span>Mempelai Wanita</span><strong>{bride}</strong><p data-w2-select="parent-1">{byKey("nama")?.items[1]?.value||"Putri dari keluarga tercinta"}</p></div></div>
          </div>
          {placed("mempelai")}
        </Section>

        <Section id="acara" color={sectionColor("acara")} className="w2-events">
          <div className="w2-reveal"><PaperTitle editable="heading:acara" eyebrow="SAVE OUR DATE">{design.sectionTitles?.acara||"Hari Bahagia"}</PaperTitle>
          <p className="w2-date" data-w2-select="date">{dateLabel}</p><Counter date={date}/>
          <div className="w2-event-grid">
            <article className="w2-event-card"><span className="w2-event-symbol">◈</span><h3>Akad Nikah</h3><p data-w2-select="akad">{field(1)||"Waktu dan lokasi akad diisi melalui Studio"}</p><span>{dateLabel}</span></article>
            <article className="w2-event-card"><span className="w2-event-symbol">❦</span><h3>Resepsi</h3><p data-w2-select="resepsi">{field(2)||"Waktu dan lokasi resepsi diisi melalui Studio"}</p><span>{dateLabel}</span></article>
          </div>
          <div className="w2-location"><span>LOKASI ACARA</span><h3 data-w2-select="lokasi">{field(3)||"Lokasi menyusul"}</h3><p>Pastikan alamat sesuai undangan resmi pasangan.</p>{design.mapUrl?.startsWith("https://")&&<a data-w2-select="map-button" className="w2-map-button" href={design.mapUrl} target="_blank" rel="noopener noreferrer">Buka Google Maps ↗</a>}</div>
          </div>
          {placed("acara")}
        </Section>

        <Section id="cerita" color={sectionColor("cerita")}>
          <div className="w2-reveal"><PaperTitle editable="heading:cerita" eyebrow="A LITTLE STORY">{design.sectionTitles?.cerita||"Kisah Kami"}</PaperTitle>
          <div className="w2-timeline">{(byKey("skill")?.items||[]).slice(0,4).map((item,i)=><article key={item.id}><span className="w2-timeline-point">{["♡","✧","♧","❦"][i]}</span><div><span>{item.label}</span><p data-w2-select={"story-"+i}>{item.value}</p></div></article>)}</div>
          </div>
          {placed("cerita")}
        </Section>

        <Section id="galeri" color={sectionColor("galeri")} className="w2-gallery-section">
          <div className="w2-reveal"><PaperTitle editable="heading:galeri" eyebrow="THE LITTLE MOMENTS">{design.sectionTitles?.galeri||"Galeri Cinta"}</PaperTitle>
          <div className="w2-gallery">{photos.map((src,i)=><button key={i} type="button" data-w2-select={"gallery-"+i} className={"w2-photo w2-photo--"+i%3} onClick={()=>setActivePhoto(i)} aria-label={"Perbesar foto "+(i+1)}>
            <img src={src} alt={gallery[i]?.title || "Galeri pasangan pengantin"} loading="lazy" onError={e=>{e.currentTarget.style.opacity="0";}} /><span>{gallery[i]?.title||"Our moment"}</span></button>)}</div></div>
          {placed("galeri")}
        </Section>

        <Section id="rsvp" color={sectionColor("rsvp")} className="w2-rsvp-section">
          <div className="w2-reveal"><PaperTitle editable="heading:rsvp" eyebrow="YOUR PRESENCE MATTERS">{design.sectionTitles?.rsvp||"Kehadiran & Doa"}</PaperTitle>
            <p className="w2-centered-copy">Kirim doa dan konfirmasi kehadiran untuk kedua mempelai.</p>
            <form className="w2-rsvp-form" onSubmit={submit}>
              <label>Nama Tamu<input value={guestName} maxLength={60} required onChange={e=>{setGuestName(e.target.value);setSent(false);}} placeholder="Nama lengkap" /></label>
              <fieldset><legend>Konfirmasi kehadiran</legend><label><input name="attend" type="radio" checked={attending==="hadir"} onChange={()=>setAttending("hadir")}/> Hadir</label><label><input name="attend" type="radio" checked={attending==="tidak"} onChange={()=>setAttending("tidak")}/> Berhalangan</label></fieldset>
              <label>Ucapan & Doa<textarea value={message} maxLength={400} required rows={4} onChange={e=>{setMessage(e.target.value);setSent(false);}} placeholder="Tuliskan ucapan Anda..."/></label>
              <button type="submit">Kirim Ucapan ↗</button>
              {sent&&<p role="status" className="w2-form-notice">Ucapan tersimpan di perangkat ini sebagai demo. Database tamu belum terhubung.</p>}
            </form>
          </div>
          {placed("rsvp")}
        </Section>

        <Section id="hadiah" color={sectionColor("hadiah")} className="w2-gift-section">
          <div className="w2-reveal"><PaperTitle editable="heading:hadiah" eyebrow="WITH LOVE">{design.sectionTitles?.hadiah||"Amplop Digital"}</PaperTitle>
            <p className="w2-centered-copy">Doa restu Anda adalah hadiah paling berharga bagi kami.</p>
            <div className="w2-gift-grid">{(byKey("produk")?.items||[]).slice(0,2).map(item=><div className="w2-gift-card" key={item.id}><span>❦</span><h3>{item.title}</h3><p data-w2-select={"gift-"+(byKey("produk")?.items||[]).findIndex(g=>g.id===item.id)}>{item.description}</p></div>)}</div>
          </div>
          {placed("hadiah")}
        </Section>

        <footer className="w2-footer"><Petals className="w2-footer-flower"/><p data-w2-select="closing-text">{design.closingText||"TERIMA KASIH"}</p><h2>{couple}</h2><span>{dateLabel}</span><small>Undangan digital · NAMINA Wedding Living Paper</small></footer>
      </main>
      <nav className="w2-bottom-nav" aria-label="Navigasi bawah">
        {[["⌂","beranda","Beranda"],["♡","mempelai","Mempelai"],["◷","acara","Acara"],["▧","galeri","Galeri"],["✉","rsvp","Ucapan"]].map(([icon,id,label])=><a key={id} href={"#"+id}><span aria-hidden="true">{icon}</span><small>{label}</small></a>)}
      </nav>
      {activePhoto!==null&&<div className="w2-lightbox" onClick={()=>setActivePhoto(null)} role="presentation"><button type="button" onClick={()=>setActivePhoto(null)} aria-label="Tutup galeri">✕</button><img src={photos[activePhoto]} alt="Foto galeri pernikahan diperbesar"/></div>}
    </>}
  </div>;
}

export function Wedding2Demo() {
  const [site]=useState(()=>createWedding2Template("wedding2"));
  return <Wedding2Site document={site}/>;
}
