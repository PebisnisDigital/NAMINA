import { useEffect, useState } from "react";
import "./CoachNovalClone.css";

const ORIGINAL_URL = "https://instan.click/Kartunamacoachnoval";
const PRODUCTS_URL = "https://winme.id/brilioncore1";
const EMAIL = "novalmuhamad873@gmail.com";
const ORIGINAL_ADDRESS = "Jl karya damai 1 no 2 .RT 3 RW 2.kelurahan :Buaran Indah, kabupaten :Tangerang ,kecamatan : Tangerang Provinsi :Banten kode pos 15119";
const MAP_URL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ORIGINAL_ADDRESS);

type IconName = "arrow" | "mail" | "pin" | "link" | "copy" | "check" | "bag";

function Icon({ name }: { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" {...common}>
      {name === "arrow" && <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>}
      {name === "mail" && <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>}
      {name === "pin" && <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>}
      {name === "link" && <><path d="M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-2 2"/><path d="M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l2-2"/></>}
      {name === "copy" && <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>}
      {name === "check" && <path d="m4 12 5 5L20 6"/>}
      {name === "bag" && <><rect x="4" y="8" width="16" height="13" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></>}
    </svg>
  );
}

export function CoachNovalClone() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "CoachNoval | Kartu Nama Digital";
    return () => { document.title = previousTitle; };
  }, []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.location.href = "mailto:" + EMAIL;
    }
  }

  return (
    <main className="noval-page" id="noval-kartu">
      <div className="noval-background" aria-hidden="true"><span/><span/></div>
      <article className="noval-card" aria-label="Kartu nama Coach Noval">
        <header className="noval-header">
          <div className="noval-avatar" aria-hidden="true">N</div>
          <p className="noval-kicker">KARTU NAMA DIGITAL</p>
          <h1>Coach Noval</h1>
          <p className="noval-intro">Klik link d bawah kita berteman d semua sosial media</p>
          <div className="noval-divider" aria-hidden="true"><span/></div>
        </header>

        <section className="noval-links" aria-label="Hubungi Coach Noval">
          <a className="noval-link noval-link-mail" href={"mailto:" + EMAIL}>
            <span className="noval-link-icon"><Icon name="mail"/></span>
            <span className="noval-link-copy"><strong>Email</strong><small>{EMAIL}</small></span>
            <Icon name="arrow"/>
          </a>

          <a className="noval-link noval-link-social" href={ORIGINAL_URL} target="_blank" rel="noopener noreferrer">
            <span className="noval-link-icon"><Icon name="link"/></span>
            <span className="noval-link-copy"><strong>Media sosial Coach Noval</strong><small>Lihat tautan sosial yang tersedia</small></span>
            <Icon name="arrow"/>
          </a>

          <a className="noval-products" href={PRODUCTS_URL} target="_blank" rel="noopener noreferrer">
            <span className="noval-products-icon"><Icon name="bag"/></span>
            <span>KLIK SEMUA PRODUK SAYA</span>
            <Icon name="arrow"/>
          </a>
        </section>

        <section className="noval-address" aria-labelledby="noval-location">
          <div className="noval-address-heading">
            <span className="noval-address-icon"><Icon name="pin"/></span>
            <h2 id="noval-location">Alamat</h2>
          </div>
          <p>{ORIGINAL_ADDRESS}</p>
          <a href={MAP_URL} target="_blank" rel="noopener noreferrer">Lihat di peta <Icon name="arrow"/></a>
        </section>

        <footer className="noval-footer">
          <span>COACH NOVAL</span>
          <button type="button" onClick={copyEmail} aria-label={copied ? "Email tersalin" : "Salin alamat email"}>
            <Icon name={copied ? "check" : "copy"}/>{copied ? "Tersalin" : "Salin email"}
          </button>
        </footer>
      </article>
    </main>
  );
}
