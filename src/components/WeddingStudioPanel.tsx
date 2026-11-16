import { useEffect, useState, type ReactNode } from "react";
import type { SiteDocument } from "../static/sites";
import { defaultWeddingDesign, weddingSections, type WeddingElement, type WeddingDesign, type WeddingSection } from "../static/weddingDesign";
import "./WeddingStudioPanel.css";

type Props = {
  site: SiteDocument;
  selectedId: string;
  onSelect: (id:string)=>void;
  onChange: (fn:(draft:SiteDocument)=>void)=>void;
  onStageChange?: (stage:"cover"|"film"|"page")=>void;
};
type Tab = "konten" | "desain" | "elemen";
type FieldProps = {label:string;value:string;onChange:(value:string)=>void;type?:string;placeholder?:string;multiline?:boolean};
function Field({label,value,onChange,type="text",placeholder,multiline}:FieldProps){
  return <label className="w2-panel-field"><span>{label}</span>
    {multiline ? <textarea value={value} rows={3} maxLength={800} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
      : <input type={type} value={value} maxLength={type==="url"?2000:800} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}
  </label>;
}
function Select({label,value,options,onChange}:{label:string;value:string;options:readonly {value:string;label:string}[];onChange:(value:string)=>void}) {
  return <label className="w2-panel-field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>
    {options.map(option=><option value={option.value} key={option.value}>{option.label}</option>)}
  </select></label>;
}
function Color({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}) {
  return <label className="w2-panel-color"><span>{label}</span><input type="color" value={value} onChange={e=>onChange(e.target.value)}/><code>{value}</code></label>;
}
function SectionTitle({children}: {children:ReactNode}){return <h3 className="w2-panel-heading">{children}</h3>;}
const fontOptions = [{value:"romantic",label:"Romantic Script"},{value:"classic",label:"Classic Serif"},{value:"modern",label:"Modern Sans"}] as const;
const animationOptions = [{value:"paper",label:"Paper Reveal"},{value:"soft",label:"Soft Fade"},{value:"none",label:"Tanpa animasi"}] as const;
const textElementLabels:Record<WeddingElement["type"],string>={text:"Teks",image:"Foto",button:"Tombol",video:"Video",ornament:"Ornamen"};
const initialText:Record<WeddingElement["type"],string>={text:"Teks baru",image:"Foto baru",button:"Buka Lokasi",video:"Video",ornament:"❦"};
const selectionLabels:Record<string,string>={
  couple:"Nama pasangan",bio:"Deskripsi hero",photo:"Foto utama",date:"Tanggal acara",intro:"Kalimat pengantar",
  "parent-0":"Orang tua mempelai pria","parent-1":"Orang tua mempelai wanita",
  akad:"Akad nikah",resepsi:"Resepsi",lokasi:"Lokasi acara",
  "cover-subtitle":"Kalimat sampul","cover-button":"Tombol buka undangan","map-button":"Tautan peta",
};

export function WeddingStudioPanel({site,selectedId,onSelect,onChange,onStageChange}:Props){
  const design=site.weddingDesign || defaultWeddingDesign();
  const [tab,setTab]=useState<Tab>("konten");
  const [stage,setStage]=useState<"cover"|"film"|"page">("page");
  const [section,setSection]=useState<WeddingSection>("beranda");
  const original=site.content.original!;
  const selectedElement=selectedId.startsWith("element:")
    ?design.elements.find(element=>element.id===selectedId.slice(8)):undefined;
  const edit=(fn:(draft:SiteDocument)=>void)=>onChange(fn);
  const updateDesign=(fn:(d:WeddingDesign)=>void)=>edit(next=>{next.weddingDesign ||= defaultWeddingDesign();fn(next.weddingDesign);});
  const editFact=(category:"nama"|"karir"|"skill",index:number,key:"label"|"value",value:string)=>
    edit(next=>{const item=next.content.original?.[category].items[index];if(item)item[key]=value;});
  const editGallery=(category:"karya"|"produk",index:number,key:"title"|"description",value:string)=>
    edit(next=>{const item=next.content.original?.[category].items[index];if(item)item[key]=value;});
  const editElement=(fn:(item:WeddingElement)=>void)=>updateDesign(d=>{
    const item=d.elements.find(e=>e.id===selectedElement?.id);
    if(item)fn(item);
  });
  useEffect(()=>{
    if(selectedId.startsWith("element:"))setTab("elemen");
    else if(selectedId && (selectionLabels[selectedId]||/^(gallery|story|gift)-\d+$/.test(selectedId)))setTab("konten");
  },[selectedId]);
  const add=(type:WeddingElement["type"])=>{
    if(design.elements.length>=60)return;
    const id=crypto.randomUUID();
    updateDesign(d=>d.elements.push({id,type,section,x:15,y:280,width:70,
      text:initialText[type],url:"",color:d.primary,fontSize:type==="ornament"?40:24,
      font:d.font,animation:d.motion,align:"center"}));
    setTab("elemen");onSelect("element:"+id);
  };
  function nativeFieldControls(): ReactNode {
    const base=[
      <Field key="couple" label="Nama pasangan" value={site.content.identity.displayName}
        onChange={value=>edit(next=>{next.content.identity.displayName=value;})}/>,
      <Field key="bio" label="Kalimat hero" value={site.content.identity.bio} multiline
        onChange={value=>edit(next=>{next.content.identity.bio=value;})}/>,
      <Field key="photo" label="URL foto pengantin (HTTPS)" type="url" value={site.media.portrait}
        placeholder="https://.../foto.webp" onChange={value=>edit(next=>{next.media.portrait=value;})}/>,
      <Field key="intro" label="Pengantar undangan" value={original.nama.description} multiline
        onChange={value=>edit(next=>{next.content.original!.nama.description=value;})}/>,
      <Field key="parent-0" label="Orang tua mempelai pria" value={original.nama.items[0]?.value||""}
        onChange={value=>editFact("nama",0,"value",value)}/>,
      <Field key="parent-1" label="Orang tua mempelai wanita" value={original.nama.items[1]?.value||""}
        onChange={value=>editFact("nama",1,"value",value)}/>,
      <Field key="date" label="Tanggal & waktu (WIB)" type="datetime-local" value={original.karir.items[0]?.value.slice(0,16)||""}
        onChange={value=>editFact("karir",0,"value",value?value+":00+07:00":"")}/>,
      <Field key="akad" label="Akad nikah" value={original.karir.items[1]?.value||""} multiline
        onChange={value=>editFact("karir",1,"value",value)}/>,
      <Field key="resepsi" label="Resepsi" value={original.karir.items[2]?.value||""} multiline
        onChange={value=>editFact("karir",2,"value",value)}/>,
      <Field key="lokasi" label="Alamat lokasi" value={original.karir.items[3]?.value||""} multiline
        onChange={value=>editFact("karir",3,"value",value)}/>,
      <Field key="video" label="URL video pembuka (MP4 atau Dropbox)" type="url" value={site.media.mobileVideo||site.media.desktopVideo}
        placeholder="https://.../video.mp4" onChange={value=>edit(next=>{next.media.mobileVideo=value;next.media.desktopVideo=value;})}/>,
      <Field key="cover-subtitle" label="Kalimat di sampul" value={design.coverSubtitle||""} onChange={v=>updateDesign(d=>{d.coverSubtitle=v;})}/>,
      <Field key="cover-button" label="Teks tombol buka undangan" value={design.coverButtonText||""} onChange={v=>updateDesign(d=>{d.coverButtonText=v;})}/>,
      <Field key="map-button" label="Link Google Maps (HTTPS)" value={design.mapUrl||""} type="url" onChange={v=>updateDesign(d=>{d.mapUrl=v;})}/>,
    ];
    if(selectionLabels[selectedId])return <>{base.filter((_,index)=>{
      const ids=["couple","bio","photo","intro","parent-0","parent-1","date","akad","resepsi","lokasi","video","cover-subtitle","cover-button","map-button"];
      return ids[index]===selectedId;
    })}<button type="button" className="w2-panel-link" onClick={()=>onSelect("")}>Lihat seluruh kolom</button></>;
    if(selectedId.startsWith("story-")){
      const index=Number(selectedId.slice(6));const item=original.skill.items[index];
      if(item)return <><Field label="Judul cerita" value={item.label} onChange={v=>editFact("skill",index,"label",v)}/>
      <Field label="Isi cerita" multiline value={item.value} onChange={v=>editFact("skill",index,"value",v)}/></>;
    }
    if(selectedId.startsWith("gallery-")){
      const i=Number(selectedId.slice(8)),item=original.karya.items[i];
      if(item)return <><Field label="Judul foto" value={item.title} onChange={v=>editGallery("karya",i,"title",v)}/>
      <Field label="URL foto (HTTPS)" type="url" value={site.media.cards[item.id]||""}
        onChange={value=>edit(next=>{next.media.cards[item.id]=value;})}/></>;
    }
    if(selectedId.startsWith("gift-")){
      const i=Number(selectedId.slice(5)),item=original.produk.items[i];
      if(item)return <><Field label="Judul hadiah" value={item.title} onChange={v=>editGallery("produk",i,"title",v)}/>
      <Field label="Keterangan hadiah" value={item.description} multiline onChange={v=>editGallery("produk",i,"description",v)}/></>;
    }
    return <>
      <SectionTitle>Pasangan & Sampul</SectionTitle>{base.slice(0,6)}
      <SectionTitle>Acara & Video</SectionTitle>{base.slice(6,11)}
      <SectionTitle>Sampul & Tombol</SectionTitle>{base.slice(11)}
      <SectionTitle>Love Story</SectionTitle>
      {original.skill.items.map((item,index)=><div key={item.id} className="w2-panel-card">
        <Field label={"Judul cerita "+(index+1)} value={item.label} onChange={v=>editFact("skill",index,"label",v)}/>
        <Field label="Isi cerita" value={item.value} onChange={v=>editFact("skill",index,"value",v)}/></div>)}
      <button className="w2-panel-add" type="button" disabled={original.skill.items.length>=12} onClick={()=>edit(next=>next.content.original!.skill.items.push({id:crypto.randomUUID(),label:"Bab Baru",value:"Cerita pasangan",icon:8121295}))}>+ Tambah cerita</button>
      <SectionTitle>Galeri foto</SectionTitle>
      {original.karya.items.map((item,index)=><div className="w2-panel-card" key={item.id}>
        <Field label={"Judul foto "+(index+1)} value={item.title} onChange={v=>editGallery("karya",index,"title",v)}/>
        <Field label="URL gambar HTTPS" type="url" value={site.media.cards[item.id]||""} onChange={v=>edit(next=>{next.media.cards[item.id]=v;})}/>
        <button type="button" className="w2-panel-danger" onClick={()=>edit(next=>{const [removed]=next.content.original!.karya.items.splice(index,1);if(removed)delete next.media.cards[removed.id];})}>Hapus foto</button></div>)}
      <button type="button" className="w2-panel-add" disabled={original.karya.items.length>=20} onClick={()=>edit(next=>next.content.original!.karya.items.push({id:crypto.randomUUID(),title:"Foto baru",description:"",color:"#869879",motif:"monogram",link:"",imageAssetId:null}))}>+ Tambah foto</button>
      <SectionTitle>Amplop Digital</SectionTitle>
      {original.produk.items.map((item,index)=><div className="w2-panel-card" key={item.id}>
        <Field label={"Judul "+(index+1)} value={item.title} onChange={v=>editGallery("produk",index,"title",v)}/>
        <Field label="Deskripsi rekening / hadiah" value={item.description} multiline onChange={v=>editGallery("produk",index,"description",v)}/></div>)}
      <p className="w2-panel-note">RSVP saat ini masih demo lokal. Data tamu belum dikirim ke database bersama.</p>
    </>;
  }
  return <aside className="w2-studio-panel" aria-label="Editor visual Wedding Living Paper">
    <div className="w2-panel-head"><span>NAMINA · WEDDING BUILDER</span><strong>Living Paper Studio</strong><p>Klik teks atau gambar di preview untuk mengedit. Geser elemen tambahan ke posisi yang diinginkan.</p></div>
    <div className="w2-panel-stage" role="group" aria-label="Pilih tahap undangan">
      {([["cover","Sampul"],["film","Intro Video"],["page","Isi Undangan"]] as const).map(([id,label])=>
        <button key={id} type="button" aria-pressed={stage===id} onClick={()=>{setStage(id);onSelect("");onStageChange?.(id);}}>{label}</button>)}
    </div>
    <nav className="w2-panel-tabs" aria-label="Kategori editor">
      {([["konten","Konten"],["desain","Desain"],["elemen","Elemen"]] as const).map(([id,label])=>
        <button key={id} type="button" aria-pressed={tab===id} onClick={()=>{setTab(id);onSelect("");}}>{label}</button>)}
    </nav>
    <div className="w2-panel-body">
      {tab==="konten" && <div className="w2-panel-stack">
        {selectedId && <div className="w2-panel-selected">Dipilih: {selectionLabels[selectedId]||selectedId.replace(/-/g," ")}</div>}
        {nativeFieldControls()}
      </div>}
      {tab==="desain"&&<div className="w2-panel-stack">
        <SectionTitle>Tema halaman</SectionTitle>
        <Color label="Latar halaman" value={design.background} onChange={v=>updateDesign(d=>{d.background=v;})}/>
        <Color label="Warna kertas" value={design.surface} onChange={v=>updateDesign(d=>{d.surface=v;})}/>
        <Color label="Warna utama" value={design.primary} onChange={v=>updateDesign(d=>{d.primary=v;})}/>
        <Color label="Warna aksen" value={design.accent} onChange={v=>updateDesign(d=>{d.accent=v;})}/>
        <Select label="Gaya font undangan" value={design.font} options={fontOptions} onChange={v=>updateDesign(d=>{d.font=v as WeddingDesign["font"];})}/>
        <label className="w2-panel-field"><span>Ukuran judul utama · {Math.round(design.headingScale*100)}%</span><input type="range" min=".7" max="1.7" step=".05" value={design.headingScale} onChange={e=>updateDesign(d=>{d.headingScale=Number(e.target.value);})}/></label>
        <Select label="Animasi halaman" value={design.motion} options={animationOptions} onChange={v=>updateDesign(d=>{d.motion=v as WeddingDesign["motion"];})}/>
        <SectionTitle>Warna tiap halaman</SectionTitle>
        {weddingSections.map(item=><Color key={item.id} label={item.label} value={design.sectionColors?.[item.id]||design.surface} onChange={v=>updateDesign(d=>{const colors = d.sectionColors ?? (d.sectionColors={});colors[item.id]=v;})}/>)}
        <button type="button" className="w2-panel-link" onClick={()=>updateDesign(d=>{d.sectionColors={};})}>Reset warna tiap halaman</button>
      </div>}
      {tab==="elemen"&&<div className="w2-panel-stack">
        <SectionTitle>Tambah elemen</SectionTitle>
        <Select label="Letakkan di bagian" value={section} options={weddingSections.map(item=>({value:item.id,label:item.label}))} onChange={v=>setSection(v as WeddingSection)}/>
        <div className="w2-panel-library">{(["text","image","button","video","ornament"] as const).map(type=>
          <button key={type} disabled={design.elements.length>=60} type="button" onClick={()=>add(type)}>
            <span aria-hidden="true">{({text:"T",image:"▧",button:"↗",video:"▶",ornament:"❦"})[type]}</span>{textElementLabels[type]}
          </button>)}</div>
        {selectedElement&&<>
          <SectionTitle>Atur {textElementLabels[selectedElement.type]}</SectionTitle>
          <Select label="Bagian halaman" value={selectedElement.section} options={weddingSections.map(item=>({value:item.id,label:item.label}))} onChange={v=>editElement(e=>{e.section=v as WeddingSection;})}/>
          {selectedElement.type!=="video"&&selectedElement.type!=="image"&&
            <Field label="Isi teks" value={selectedElement.text} multiline={selectedElement.type==="text"} onChange={v=>editElement(e=>{e.text=v;})}/>}
          {selectedElement.type==="image"&&<Field label="Alt teks / deskripsi foto" value={selectedElement.text} onChange={v=>editElement(e=>{e.text=v;})}/>}
          {selectedElement.type==="image"||selectedElement.type==="button"||selectedElement.type==="video" ?
            <Field label={selectedElement.type==="button"?"Tautan tombol (HTTPS)":"URL gambar/video (HTTPS)"} type="url" value={selectedElement.url} onChange={v=>editElement(e=>{e.url=v;})}/> : null}
          <Color label="Warna teks" value={selectedElement.color} onChange={v=>editElement(e=>{e.color=v;})}/>
          <Select label="Jenis font" value={selectedElement.font} options={fontOptions} onChange={v=>editElement(e=>{e.font=v as WeddingElement["font"];})}/>
          <Select label="Animasi masuk" value={selectedElement.animation} options={animationOptions} onChange={v=>editElement(e=>{e.animation=v as WeddingElement["animation"];})}/>
          <Select label="Perataan" value={selectedElement.align} options={[{value:"left",label:"Kiri"},{value:"center",label:"Tengah"},{value:"right",label:"Kanan"}]} onChange={v=>editElement(e=>{e.align=v as WeddingElement["align"];})}/>
          <label className="w2-panel-field"><span>Ukuran font · {selectedElement.fontSize}px</span><input type="range" min="10" max="90" value={selectedElement.fontSize} onChange={e=>editElement(item=>{item.fontSize=Number(e.target.value);})}/></label>
          <label className="w2-panel-field"><span>Lebar elemen · {selectedElement.width}%</span><input type="range" min="10" max="100" value={selectedElement.width} onChange={e=>editElement(item=>{item.width=Number(e.target.value);})}/></label>
          <div className="w2-panel-coords"><label>Posisi X (%)<input type="number" min="0" max="95" value={selectedElement.x} onChange={e=>editElement(item=>{item.x=Math.max(0,Math.min(95,Number(e.target.value)||0));})}/></label>
          <label>Posisi Y (px)<input type="number" min="0" max="1800" value={selectedElement.y} onChange={e=>editElement(item=>{item.y=Math.max(0,Math.min(1800,Number(e.target.value)||0));})}/></label></div>
          <div className="w2-panel-actions">
            <button type="button" onClick={()=>{const id=crypto.randomUUID();updateDesign(d=>{const from=d.elements.find(e=>e.id===selectedElement.id);if(from&&d.elements.length<60)d.elements.push({...structuredClone(from),id,y:Math.min(1800,from.y+35)});});onSelect("element:"+id);}}>Duplikat</button>
            <button type="button" className="w2-panel-danger" onClick={()=>{updateDesign(d=>{d.elements=d.elements.filter(e=>e.id!==selectedElement.id);});onSelect("");}}>Hapus</button>
          </div>
        </>}
        <SectionTitle>Lapisan elemen ({design.elements.length}/60)</SectionTitle>
        {design.elements.length===0&&<p className="w2-panel-note">Tambahkan elemen lalu geser langsung di halaman. Posisi disimpan saat draft dipublikasikan.</p>}
        {design.elements.map(e=><button type="button" key={e.id} className={"w2-panel-layer"+(selectedId==="element:"+e.id?" is-selected":"")} onClick={()=>{onSelect("element:"+e.id);setSection(e.section);}}>
          <span>{textElementLabels[e.type]} · {e.text.slice(0,27)}</span><small>{weddingSections.find(s=>s.id===e.section)?.label||e.section}</small>
        </button>)}
      </div>}
    </div>
    <div className="w2-panel-foot"><span>Autosave draft di Studio admin · Simpan Draft di Studio mitra</span><a href={"/"+site.slug} target="_blank" rel="noopener noreferrer">Lihat halaman ↗</a></div>
  </aside>;
}
