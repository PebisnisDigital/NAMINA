import { useEffect } from "react";
import { TemplatePicker } from "./TemplatePicker";
import type { TemplateKey } from "../static/templateCatalog";
import "./StudioTemplateDialog.css";

type Props = {
  value: TemplateKey;
  onChange: (value: TemplateKey) => void;
  onClose: () => void;
};

export function StudioTemplateDialog({
  value, onChange, onClose,
}: Props) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="studio-v2__template-backdrop"
    onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="studio-v2__template-dialog" role="dialog" aria-modal="true"
      aria-labelledby="studio-templates-title">
      <header className="studio-v2__template-dialog-head">
        <div>
          <span>PILIH TAMPILAN WEB</span>
          <h2 id="studio-templates-title">Template NAMINA</h2>
          <p>Enam gaya. Satu Studio. Personal dan undangan pernikahan.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Tutup pilihan template">×</button>
      </header>
      <div className="studio-v2__template-dialog-scroll">
        <TemplatePicker value={value} onChange={onChange} />
        <p className="studio-v2__template-dialog-note" role="status">
          Template akan langsung mengganti desain website yang sedang dibuka, termasuk /vini.
          Data personal dan Wedding tersimpan terpisah saat berganti kategori.
          Website publik baru berubah setelah tombol Publikasikan ditekan.
        </p>
      </div>
      <footer className="studio-v2__template-dialog-actions">
        <button type="button" className="studio-v2__template-action-secondary" onClick={onClose}>
          Selesai
        </button>
      </footer>
    </section>
  </div>;
}
