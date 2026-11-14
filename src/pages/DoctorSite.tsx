import { useEffect, useState } from "react";
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

export function DoctorSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  useEffect(() => {
    document.title = "dr. Arif Pratama — Demo Template Dokter | NAMINA";
    return () => { document.title = "NAMINA"; };
  }, []);
  const jump = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="doctor-site">
      <header className="doctor-header">
        <a href="/dokter" className="doctor-logo" aria-label="NAMINA, halaman dokter"><span className="doctor-logo-mark">N</span><strong>NAMINA</strong></a>
        <nav className={menuOpen ? "doctor-nav is-open" : "doctor-nav"} aria-label="Navigasi profil dokter">
          {menu.map(item => <button type="button" key={item.id} onClick={() => jump(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
        </nav>
        <button className="doctor-header-contact" onClick={() => setContactOpen(true)}>Hubungi Saya</button>
        <button className="doctor-menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen}>{menuOpen ? "✕" : "☰"}</button>
      </header>

      <main>
        <section className="doctor-hero" id="nama">
          <div className="doctor-video-layer" aria-hidden="true">
            <video src="/videos/hero.mp4" autoPlay muted loop playsInline preload="metadata" />
          </div>
          <div className="doctor-hero-shade" />
          <div className="doctor-hero-content">
            <span className="doctor-kicker">HALO, PERKENALKAN NAMA SAYA ADALAH...</span>
            <span className="doctor-cross" aria-hidden="true">✚ <span>⌁⌁⌁</span></span>
            <h1>dr. Arif<br />Pratama</h1>
            <span className="doctor-profession">♧ &nbsp; DOKTER UMUM</span>
            <p className="doctor-tagline">Pelayanan Kesehatan • Edukasi Medis • Gaya Hidup Sehat</p>
            <button className="doctor-primary" type="button" onClick={() => setContactOpen(true)}>Hubungi Saya <span>↗</span></button>
          </div>
          <div className="doctor-hero-facts">{facts.map(fact => <div className="doctor-fact" key={fact.label}><span aria-hidden="true">{fact.icon}</span><div><small>{fact.label}</small><strong>{fact.value}</strong></div></div>)}</div>
          <span className="doctor-demo-marker">DEMO • DATA FIKTIF</span>
        </section>

        <div className="doctor-quicknav" aria-label="Menu cepat">{menu.map(item => <button type="button" key={item.id} onClick={() => jump(item.id)}><span>{item.icon}</span><strong>{item.label}</strong></button>)}</div>

        <section className="doctor-intro doctor-shell">
          <div className="doctor-intro-copy"><span className="doctor-section-eyebrow">PROFIL PROFESIONAL</span><h2>Tentang Saya</h2><p>dr. Arif Pratama adalah karakter demo NAMINA untuk menampilkan profil dokter secara profesional. Contoh ini menggambarkan fokus pada pelayanan kesehatan preventif, edukasi medis, dan pendampingan gaya hidup sehat.</p></div>
          <div className="doctor-pulse" aria-hidden="true">♡ <span>⌁⌁⌁⌁</span> ✚</div>
        </section>

        <section className="doctor-section doctor-shell" id="karir"><SectionTitle eyebrow="PENGALAMAN" title="Perjalanan Profesi" subtitle="Contoh isi riwayat dan aktivitas profesional dokter." /><div className="doctor-card-grid">{career.map(item => <article className="doctor-feature-card" key={item.title}><div className="doctor-feature-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.description}</p><span className="doctor-card-arrow" aria-hidden="true">↗</span></article>)}</div></section>
        <section className="doctor-section doctor-shell" id="skill"><SectionTitle eyebrow="KOMPETENSI" title="Keahlian & Fokus" subtitle="Bidang kompetensi yang dapat ditampilkan di NAMINA." /><div className="doctor-card-grid">{skills.map(item => <article className="doctor-feature-card" key={item.title}><div className="doctor-feature-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.desc}</p><span className="doctor-card-arrow" aria-hidden="true">↗</span></article>)}</div></section>
        <section className="doctor-section doctor-shell" id="karya"><SectionTitle eyebrow="PORTOFOLIO" title="Karya & Kegiatan" /><div className="doctor-gallery">{works.map((item,index) => <article key={item.title} className={"doctor-media-card media-"+index}><div className="doctor-media-art" aria-hidden="true">{item.icon}</div><div><span>{item.tag}</span><h3>{item.title}</h3></div></article>)}</div></section>
        <section className="doctor-section doctor-shell" id="produk"><SectionTitle eyebrow="PROGRAM" title="Produk & Layanan" /><div className="doctor-gallery">{products.map((item,index) => <article key={item.title} className={"doctor-media-card media-"+index}><div className="doctor-media-art" aria-hidden="true">{item.icon}</div><div><span>{item.tag}</span><h3>{item.title}</h3></div></article>)}</div><p className="doctor-disclaimer">Ini contoh desain NAMINA, bukan penawaran layanan kesehatan nyata. Identitas, pengalaman, izin praktik, dan kontak dokter harus diverifikasi sebelum publikasi klien.</p></section>
      </main>
      <footer className="doctor-footer"><a href="/">NAMINA</a><span>Template Dokter • Demo</span></footer>
      {contactOpen && <div className="doctor-modal-backdrop" onClick={() => setContactOpen(false)} role="presentation"><div className="doctor-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-dialog-heading" onClick={event => event.stopPropagation()}><button className="doctor-modal-close" onClick={() => setContactOpen(false)} aria-label="Tutup">✕</button><span className="doctor-feature-icon">✚</span><h2 id="doctor-dialog-heading">Kontak Demo</h2><p>Ini masih template contoh. Nomor WhatsApp dokter akan dipasang setelah data klien terverifikasi.</p><button className="doctor-primary" onClick={() => setContactOpen(false)}>Mengerti</button></div></div>}
    </div>
  );
}
