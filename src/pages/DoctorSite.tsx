import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ClientSiteLogo } from "../components/ClientSiteLogo";
import { createDoctorTemplate } from "../static/doctorTemplate";
import { playableDropboxMediaUrl, retryDropboxImage, type SiteDocument } from "../static/sites";
import "./DoctorSite.css";

const facts = [
  { label: "Domisili", value: "Jakarta (Demo)", icon: "⌖" },
  { label: "Profesi", value: "Dokter Umum", icon: "✚" },
  { label: "Status", value: "Profil Contoh", icon: "◈" },
];
const menu = [
  { id: "nama", label: "Nama", icon: "♙" },
  { id: "karir", label: "Karir", icon: "▣" },
  { id: "skill", label: "Skill", icon: "✳" },
  { id: "karya", label: "Karya", icon: "▧" },
  { id: "produk", label: "Produk", icon: "◇" },
];
const career = [
  { title: "Pelayanan Kesehatan", description: "Contoh bidang pelayanan pasien dan edukasi preventif.", icon: "✚" },
  { title: "Edukasi Masyarakat", description: "Contoh kegiatan penyuluhan dan literasi kesehatan.", icon: "♡" },
  { title: "Pengembangan Profesi", description: "Contoh aktivitas pembelajaran dan pengembangan kompetensi.", icon: "▤" },
];
const skills = [
  { title: "Edukasi Medis", desc: "Komunikasi kesehatan yang jelas dan mudah dipahami.", icon: "✦" },
  { title: "Konseling Kesehatan", desc: "Pendampingan perilaku hidup sehat dan pencegahan.", icon: "♡" },
  { title: "Pelayanan Umum", desc: "Contoh keterampilan layanan kesehatan dasar.", icon: "✚" },
];
const works = [
  { title: "Edukasi Hidup Sehat", tag: "Kegiatan", icon: "♡" },
  { title: "Seminar Kesehatan", tag: "Publikasi", icon: "♧" },
  { title: "Konten Kesehatan", tag: "Edukasi", icon: "▣" },
];
const products = [
  { title: "Konsultasi Online", tag: "Contoh Layanan", icon: "▤" },
  { title: "Paket Cek Kesehatan", tag: "Contoh Layanan", icon: "✚" },
  { title: "Program Hidup Sehat", tag: "Contoh Program", icon: "♡" },
];

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return <div className="doctor-section-heading"><span>{eyebrow}</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>;
}

export function DoctorSite({ site, editorMode = false }: { site?: SiteDocument; editorMode?: boolean }) {
  const demo = useMemo(() => createDoctorTemplate("contoh-dokter"), []);
  const current = site || demo;
  const original = current.content.original!;
  const medicalStyle = {
    "--medical": original.style?.accentColor || "#078e8d",
    "--ink": original.style?.textColor || "#0b233d",
  } as CSSProperties;
  const contactUrl = (() => {
    if (!original.contactUrl) return "";
    try {
      const url = new URL(original.contactUrl);
      if (original.contactMessage) url.searchParams.set("text", original.contactMessage);
      return url.toString();
    } catch { return ""; }
  })();
  const labels = menu.map(item => ({ ...item, label: original.menuTitles?.[item.id as "nama" | "karir" | "skill" | "karya" | "produk"] || item.label }));
  const visibleFacts = original.nama.items.filter(item => item.label.toLowerCase() !== "nama").slice(0, 3);
  const careerCards = original.karir.items.map((item, index) => ({ id: item.id, index, title: item.value, description: item.label, icon: "✚" }));
  const skillCards = original.skill.items.map((item, index) => ({ id: item.id, index, title: item.value, desc: item.label, icon: "♡" }));
  const workCards = original.karya.items.map((item, index) => ({ id: item.id, title: item.title, tag: "Karya", icon: ["♡","✚","▤"][index%3], image: current.media.cards[item.id] || "" }));
  const productCards = original.produk.items.map((item, index) => ({ id: item.id, title: item.title, tag: "Layanan", icon: ["▤","✚","♡"][index%3], image: current.media.cards[item.id] || "" }));
  const isDemo = !site || current.content.identity.displayName.toLowerCase() === "dr. arif pratama";
  const mediaVideo = playableDropboxMediaUrl(current.media.desktopVideo || "/videos/hero.mp4");
  const mobileVideo = playableDropboxMediaUrl(current.media.mobileVideo || mediaVideo);
  const [activeCard, setActiveCard] = useState<{ title: string; description: string; link: string } | null>(null);
  const contactButton = (top = false) => contactUrl && !editorMode
    ? <a className={top ? "doctor-header-contact" : "doctor-primary"} href={contactUrl} rel="noopener noreferrer" target="_blank">{original.contactLabel || "Hubungi Saya"} {!top && <span>↗</span>}</a>
    : <button className={top ? "doctor-header-contact" : "doctor-primary"} data-v2-edit="contact" type="button" onClick={() => { if (!editorMode) setContactOpen(true); }}>{original.contactLabel || "Hubungi Saya"} {!top && <span>↗</span>}</button>;
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  useEffect(() => {
    if (editorMode) return;
    const previous = document.title;
    document.title = current.content.identity.displayName + " | NAMINA";
    return () => { document.title = previous; };
  }, [editorMode, current.content.identity.displayName]);
  const jump = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="doctor-site" style={medicalStyle}>
      <header className="doctor-header">
        <div className="doctor-logo" data-v2-edit="logo">{original.logo && original.logo.mode !== "default"
          ? <ClientSiteLogo logo={original.logo} /> : <a href={editorMode ? undefined : "/"} aria-label="NAMINA"><span className="doctor-logo-mark">N</span><strong>NAMINA</strong></a>}</div>
        <nav className={menuOpen ? "doctor-nav is-open" : "doctor-nav"} aria-label="Navigasi profil dokter">
          {labels.map(item => <button type="button" data-v2-edit={"menu:" + item.id} key={item.id} onClick={() => jump(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
        </nav>
        {contactButton(true)}
        <button className="doctor-menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen}>{menuOpen ? "✕" : "☰"}</button>
      </header>

      <main>
        <section className="doctor-hero" id="nama">
          <div className="doctor-video-layer" aria-hidden="true">
            <video key={mediaVideo + mobileVideo} autoPlay muted loop playsInline preload="metadata">
              {mobileVideo !== mediaVideo && <source media="(max-width: 680px)" src={mobileVideo} type="video/mp4" />}
              <source src={mediaVideo} type="video/mp4" />
            </video>
          </div>
          <div className="doctor-hero-shade" />
          <div className="doctor-hero-content">
            <span className="doctor-kicker" data-v2-edit="intro">{original.nama.intro}</span>
            <span className="doctor-cross" aria-hidden="true">✚ <span>⌁⌁⌁</span></span>
            <h1 data-v2-edit="name">{current.content.identity.displayName}</h1>
            <span className="doctor-profession" data-v2-edit="profession">✚ &nbsp; {current.content.identity.profession}</span>
            <p className="doctor-tagline" data-v2-edit="description">{original.nama.description}</p>
            {contactButton()}
          </div>
          <div className="doctor-hero-facts">{visibleFacts.map(fact => <div className="doctor-fact" data-v2-edit={"fact:nama:" + original.nama.items.indexOf(fact)} key={fact.id}><span aria-hidden="true">{fact.icon}</span><div><small>{fact.label}</small><strong>{fact.value}</strong></div></div>)}</div>
          {isDemo && <span className="doctor-demo-marker">DEMO • DATA CONTOH</span>}
          {editorMode && <button type="button" className="doctor-editor-video" data-v2-edit="video">✎ Ganti video</button>}
        </section>

        <div className="doctor-quicknav" aria-label="Menu cepat">{labels.map(item => <button type="button" data-v2-edit={"menu:" + item.id} key={item.id} onClick={() => jump(item.id)}><span>{item.icon}</span><strong>{item.label}</strong></button>)}</div>

        <section className="doctor-intro doctor-shell">
          <div className="doctor-intro-copy"><span className="doctor-section-eyebrow">PROFIL PROFESIONAL</span><h2 data-v2-edit="menu:nama">Tentang Saya</h2><p data-v2-edit="description">{current.content.identity.bio || original.nama.description}</p></div>
          <div className="doctor-pulse" aria-hidden="true">♡ <span>⌁⌁⌁⌁</span> ✚</div>
        </section>

        <section className="doctor-section doctor-shell" id="karir"><div data-v2-edit="menu:karir"><SectionTitle eyebrow="PENGALAMAN" title={original.karir.subtitle || "Perjalanan Profesi"} subtitle={original.karir.description} /></div><div className="doctor-card-grid">{careerCards.map(item => <article className="doctor-feature-card" data-v2-edit={"fact:karir:" + item.index} key={item.id}><div className="doctor-feature-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.description}</p><span className="doctor-card-arrow" aria-hidden="true">↗</span></article>)}</div></section>
        <section className="doctor-section doctor-shell" id="skill"><div data-v2-edit="menu:skill"><SectionTitle eyebrow="KOMPETENSI" title={original.skill.subtitle || "Keahlian & Fokus"} subtitle={original.skill.description} /></div><div className="doctor-card-grid">{skillCards.map(item => <article className="doctor-feature-card" data-v2-edit={"fact:skill:" + item.index} key={item.id}><div className="doctor-feature-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.desc}</p><span className="doctor-card-arrow" aria-hidden="true">↗</span></article>)}</div></section>
        <section className="doctor-section doctor-shell" id="karya"><div data-v2-edit="menu:karya"><SectionTitle eyebrow="PORTOFOLIO" title={original.karya.subtitle || "Karya & Kegiatan"} subtitle={original.karya.description} /></div><div className="doctor-gallery">{workCards.map((item,index) => <article key={item.id} data-v2-edit={"card:karya:" + item.id} className={"doctor-media-card media-"+index} onClick={() => { if (!editorMode) setActiveCard(original.karya.items[index]); }}>{item.image ? <img className="doctor-card-image" src={playableDropboxMediaUrl(item.image)} alt={item.title} onError={event => retryDropboxImage(event.currentTarget)} /> : <div className="doctor-media-art" aria-hidden="true">{item.icon}</div>}<div><span>{item.tag}</span><h3>{item.title}</h3></div></article>)}</div></section>
        <section className="doctor-section doctor-shell" id="produk"><div data-v2-edit="menu:produk"><SectionTitle eyebrow="PROGRAM" title={original.produk.subtitle || "Produk & Layanan"} subtitle={original.produk.description} /></div><div className="doctor-gallery">{productCards.map((item,index) => <article key={item.id} data-v2-edit={"card:produk:" + item.id} className={"doctor-media-card media-"+index} onClick={() => { if (!editorMode) setActiveCard(original.produk.items[index]); }}>{item.image ? <img className="doctor-card-image" src={playableDropboxMediaUrl(item.image)} alt={item.title} onError={event => retryDropboxImage(event.currentTarget)} /> : <div className="doctor-media-art" aria-hidden="true">{item.icon}</div>}<div><span>{item.tag}</span><h3>{item.title}</h3></div></article>)}</div>{isDemo && <p className="doctor-disclaimer">Ini contoh desain NAMINA, bukan penawaran layanan kesehatan nyata. Kredensial dan kontak dokter harus diverifikasi sebelum publikasi klien.</p>}</section>
      </main>
      <footer className="doctor-footer"><a href="/">NAMINA</a><span>{isDemo ? "Template Dokter • Demo" : "Website Profil Digital"}</span></footer>
      {activeCard && <div className="doctor-modal-backdrop" onClick={() => setActiveCard(null)} role="presentation"><div className="doctor-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-card-dialog" onClick={event => event.stopPropagation()}><button className="doctor-modal-close" onClick={() => setActiveCard(null)} aria-label="Tutup">✕</button><h2 id="doctor-card-dialog">{activeCard.title}</h2><p>{activeCard.description}</p>{activeCard.link && <a className="doctor-primary" href={activeCard.link} rel="noopener noreferrer" target="_blank">Lihat Detail ↗</a>}</div></div>}
      {contactOpen && <div className="doctor-modal-backdrop" onClick={() => setContactOpen(false)} role="presentation"><div className="doctor-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-dialog-heading" onClick={event => event.stopPropagation()}><button className="doctor-modal-close" onClick={() => setContactOpen(false)} aria-label="Tutup">✕</button><span className="doctor-feature-icon">✚</span><h2 id="doctor-dialog-heading">Kontak Belum Tersedia</h2><p>Nomor WhatsApp belum diisi. Tambahkan melalui NAMINA Studio.</p><button className="doctor-primary" onClick={() => setContactOpen(false)}>Mengerti</button></div></div>}
    </div>
  );
}
