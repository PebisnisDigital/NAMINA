import {useEffect,useState,type CSSProperties} from "react";
import { templateCatalog,loadFactoryCatalog,type TemplateInfo, type TemplateKey } from "../static/templateCatalog";
import "./TemplatePicker.css";

type Props = {
  value: TemplateKey;
  onChange: (value: TemplateKey) => void;
  compact?: boolean;
  disabled?: boolean;
};

export function TemplatePicker({ value, onChange, compact = false, disabled = false }: Props) {
  const [factory,setFactory]=useState<TemplateInfo[]>([]);
  useEffect(()=>{let live=true;void loadFactoryCatalog().then(x=>{if(live)setFactory(x);}).catch(()=>{});return()=>{live=false;};},[]);
  return <div className={"namina-template-picker" + (compact ? " namina-template-picker--compact" : "")}
    role="group" aria-label="Pilih template NAMINA">
    {[...templateCatalog,...factory].map(template => {
      const selected = value === template.id;
      const previewStyle = {
        "--template-bg": template.palette.background,
        "--template-accent": template.palette.accent,
        "--template-ink": template.palette.text,
      } as CSSProperties;
      return <div className={"namina-template-picker__item" + (selected ? " is-selected" : "")} key={template.id}>
        <button type="button" className="namina-template-picker__option" aria-pressed={selected}
          disabled={disabled} onClick={() => onChange(template.id)}>
          <span className="namina-template-picker__preview" style={previewStyle} aria-hidden="true">
            <span className="namina-template-picker__fake-nav">N <span>◦ ◦ ◦ ◦ ◦</span></span>
            <span className="namina-template-picker__fake-title">{template.headline}</span>
            <span className="namina-template-picker__fake-subtitle">{template.subtitle}</span>
            <span className="namina-template-picker__fake-video" />
            <span className="namina-template-picker__fake-pill" />
          </span>
          <span className="namina-template-picker__info">
            <span className="namina-template-picker__category">{template.category}</span>
            <strong>{template.name}</strong>
            <span className="namina-template-picker__desc">{template.description}</span>
            <span className="namina-template-picker__state">{selected ? "✓ Dipilih" : "Pilih Template"}</span>
          </span>
        </button>
        {template.demo
          ? <a className="namina-template-picker__demo" href={template.demo} target="_blank"
              rel="noopener noreferrer" aria-label={"Lihat demo " + template.name + " di tab baru"}>Lihat Demo ↗</a>
          : <span className="namina-template-picker__demo namina-template-picker__demo--hint">Pratinjau di Studio</span>}
      </div>;
    })}
  </div>;
}
