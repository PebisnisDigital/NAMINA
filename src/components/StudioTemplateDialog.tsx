import { useEffect } from "react";
import { TemplatePicker } from "./TemplatePicker";
import type { TemplateKey } from "../static/templateCatalog";
import "./StudioTemplateDialog.css";

type Props = {
  value: TemplateKey;
  onChange: (value: TemplateKey) => void;
  onClose: () => void;
  masterPreview?: boolean;
  onCreateFromTemplate?: () => void;
};

export function StudioTemplateDialog({
  value, onChange, onClose, masterPreview = false, onCreateFromTemplate,
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
          {masterPreview
            ? "Ini pratinjau di /vini (master). Coba ganti template sesukamu tanpa mengubah website /vini yang tayang. Buat website klien untuk menyimpan tema pilihan."
            : "Template pilihan langsung terlihat di preview. Nama, video, galeri, dan data klien tetap dipertahankan. Simpan atau publikasikan untuk menayangkannya."}
        </p>
      </div>
      <footer className="studio-v2__template-dialog-actions">
        {masterPreview && onCreateFromTemplate &&
          <button type="button" className="studio-v2__template-action-primary" onClick={onCreateFromTemplate}>
            Buat Klien dengan Tema Ini
          </button>}
        <button type="button" className="studio-v2__template-action-secondary" onClick={onClose}>
          Tutup
        </button>
      </footer>
    </section>
  </div>;
}
