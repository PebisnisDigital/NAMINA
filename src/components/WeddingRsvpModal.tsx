import { useState } from "react";

function whatsappNumber(link: string): string {
  if (!link) return "";
  try {
    const parsed = new URL(link);
    let phone = "";
    if (parsed.hostname === "wa.me" || parsed.hostname === "www.wa.me") phone = parsed.pathname.slice(1);
    else if (parsed.hostname === "api.whatsapp.com" || parsed.hostname === "web.whatsapp.com") phone = parsed.searchParams.get("phone") || "";
    return /^\d{8,15}$/.test(phone) ? phone : "";
  } catch {
    return "";
  }
}

/** RSVP is shared via guest-initiated WhatsApp, not silently stored on NAMINA. */
export function WeddingRsvpModal({
  coupleName, contactUrl, onClose,
}: { coupleName: string; contactUrl: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState("Hadir");
  const [count, setCount] = useState(1);
  const [wishes, setWishes] = useState("");
  const [notice, setNotice] = useState("");
  const phone = whatsappNumber(contactUrl);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone) return;
    const guestCount = attendance === "Hadir" ? String(count) : "0";
    const text = [
      "RSVP Undangan " + coupleName,
      "Nama tamu: " + name.trim(),
      "Kehadiran: " + attendance,
      "Jumlah tamu: " + guestCount,
      "Ucapan & doa: " + (wishes.trim() || "-"),
    ].join("\n");
    const url = new URL("https://wa.me/" + phone);
    url.searchParams.set("text", text);
    const opened = window.open(url.toString(), "_blank", "noopener,noreferrer");
    if (!opened) setNotice("Jika WhatsApp belum terbuka, periksa izin pop-up browser lalu coba lagi.");
  }

  return <div className="vini-cinema__modal-backdrop" role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="vini-cinema__modal vini-cinema__modal--rsvp"
      role="dialog" aria-modal="true" aria-labelledby="wedding-rsvp-title">
      <button type="button" className="vini-cinema__modal-close" aria-label="Tutup RSVP" onClick={onClose}>×</button>
      <div className="vini-cinema__rsvp-content">
        <span className="vini-cinema__rsvp-eyebrow">BE OUR GUEST</span>
        <h2 id="wedding-rsvp-title">Konfirmasi Kehadiran</h2>
        <p>Kehadiran dan doa Anda akan menjadi hadiah paling bermakna bagi {coupleName}.</p>
        <form className="vini-cinema__rsvp-form" onSubmit={submit}>
          <label>Nama Tamu
            <input name="guestName" value={name} maxLength={80} required autoComplete="name"
              placeholder="Nama lengkap Anda" onChange={event => setName(event.target.value)} />
          </label>
          <div className="vini-cinema__rsvp-fields">
            <label>Konfirmasi
              <select name="attendance" value={attendance} onChange={event => setAttendance(event.target.value)}>
                <option value="Hadir">Hadir</option>
                <option value="Tidak hadir">Tidak hadir</option>
              </select>
            </label>
            <label>Jumlah Tamu
              <select name="guestCount" value={attendance === "Hadir" ? count : 0}
                disabled={attendance !== "Hadir"} onChange={event => setCount(Number(event.target.value))}>
                {attendance !== "Hadir" && <option value={0}>0</option>}
                {[1,2,3,4,5].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <label>Ucapan & Doa
            <textarea name="wishes" rows={3} maxLength={400}
              value={wishes} placeholder="Tuliskan ucapan untuk kedua mempelai..."
              onChange={event => setWishes(event.target.value)} />
          </label>
          <button className="vini-cinema__rsvp-submit" type="submit" disabled={!phone}>Kirim via WhatsApp</button>
          <p className="vini-cinema__rsvp-note" role="status">
            {notice || (phone
              ? "Pesan akan dibuka di WhatsApp. RSVP baru terkirim setelah Anda menekan Kirim di WhatsApp."
              : "Mode demo: belum ada nomor WhatsApp penerima. Atur kontak di NAMINA Studio untuk mengaktifkan RSVP.")}
          </p>
        </form>
      </div>
    </section>
  </div>;
}
