import {useEffect,useState} from "react";
import {businessClient} from "../business/client";
import {ViniCinematic} from "../components/ViniCinematic";
import {resolveMedia,normalizeSite} from "../static/sites";
import {factorySpecSchema,type FactoryEntry} from "../static/factoryTemplates";
import type {z} from "zod";
import "../business.css";
type Spec=z.infer<typeof factorySpecSchema>;
type Row={slug:string;version:number;status:string;updated_at:string};
type Key={id:string;label:string;expires_at:string;revoked_at:string|null};
async function control(body:object){
 const session=await businessClient?.auth.getSession();const token=session?.data.session?.access_token;
 if(!token)throw Error("Masuk sebagai superadmin dahulu.");
 const r=await fetch("/api/mcp-templates?action=control",{method:"POST",cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await r.json();if(!r.ok)throw Error(data.error||"Permintaan gagal.");return data;
}
function Demo({spec}:{spec:Spec}){
 const doc=normalizeSite(spec.document);
 return <ViniCinematic key={doc.slug} presentation={doc.presentation} content={doc.content} assetUrls={resolveMedia(doc)}/>;
}
export function FactoryDemo({slug,version}:{slug:string;version:string}){
 const [spec,setSpec]=useState<Spec|null>(null),[error,setError]=useState("");
 useEffect(()=>{let active=true;void fetch("/api/mcp-templates?action=demo&slug="+encodeURIComponent(slug)+"&version="+encodeURIComponent(version),{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("Demo belum tersedia.");return factorySpecSchema.parse((await r.json()).spec);}).then(s=>{if(active)setSpec(s);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[slug,version]);
 return spec?<Demo spec={spec}/>:<main className="business"><p role="status">{error||"Memuat demo…"}</p></main>;
}
export function TemplateFactory(){
 const [rows,setRows]=useState<Row[]>([]),[keys,setKeys]=useState<Key[]>([]),[review,setReview]=useState<{row:Row;spec:Spec}|null>(null),[name,setName]=useState("Hermes R&D"),[secret,setSecret]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[preview,setPreview]=useState(false),[allowed,setAllowed]=useState(false);
 async function load(){const data=await control({action:"list"});setRows(data.templates||[]);setKeys(data.keys||[]);setAllowed(true);}
 async function run(body:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{
   const data=await control(body);
   if(body.action==="review"){setReview({row:{slug:String(body.slug),version:Number(body.version),status:data.status,updated_at:data.updated_at},spec:factorySpecSchema.parse(data.spec)});return;}
   if(body.action==="create_key")setSecret(data.token);
   if(["approve","reject","archive"].includes(String(body.action))){setReview(null);setNotice("Status template diperbarui.");}
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Permintaan gagal.");}finally{setBusy(false);}
 }
 useEffect(()=>{let alive=true;void load().then(()=>{if(!alive)return;const q=new URLSearchParams(location.search);if(q.has("slug")&&q.has("version"))void run({action:"review",slug:q.get("slug"),version:Number(q.get("version"))});}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[]);
 async function copy(s:string){try{await navigator.clipboard.writeText(s);setNotice("Tersalin.");}catch{setNotice("Salin secara manual.");}}
 if(preview&&review)return <><button type="button" style={{position:"fixed",zIndex:99999,top:12,right:12,padding:12}} onClick={()=>setPreview(false)}>Kembali ke review</button><Demo spec={review.spec}/></>;
 return <main className="business"><div className="business__shell"><header className="business__header"><h1>Template Factory</h1><nav><a href="/studio/admin">Kembali ke Admin</a></nav></header>
 <p>Produksi template berbasis editor Original. Setiap versi harus diperiksa sebelum dirilis ke katalog mitra.</p>
 {error&&<p role="alert" className="business__error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {!allowed?<button type="button" className="business__primary" disabled={busy} onClick={()=>void run({action:"list"})}>Muat Ulang</button>:<>
 <section className="business__section"><h2>AI Connect · Template Architect</h2><p>Endpoint: https://namina.biz.id/api/mcp-templates</p><button type="button" onClick={()=>void copy("https://namina.biz.id/api/mcp-templates")}>Salin Alamat</button>
 <form className="business__create" onSubmit={e=>{e.preventDefault();void run({action:"create_key",label:name});}}><label>Nama agent<input value={name} onChange={e=>setName(e.target.value)} required maxLength={80}/></label><button className="business__primary" disabled={busy||!!secret}>Buat Kunci R&amp;D</button></form>
 {secret&&<div><p>Kunci hanya tampil sekali. Simpan di konfigurasi rahasia Hermes.</p><input aria-label="Kunci R&D" readOnly value={secret}/><button onClick={()=>void copy(secret)}>Salin Kunci</button><button onClick={()=>setSecret("")}>Sembunyikan</button></div>}
 {keys.map(k=><div className="business__site" key={k.id}><div><strong>{k.label}</strong><small>{k.revoked_at||Date.parse(k.expires_at)<Date.now()?"Tidak aktif":"Aktif"} · {new Date(k.expires_at).toLocaleDateString("id-ID")}</small></div>{!k.revoked_at&&<button disabled={busy} onClick={()=>{if(confirm("Cabut kunci agent R&D?"))void run({action:"revoke_key",id:k.id});}}>Cabut Kunci</button>}</div>)}</section>
 <section className="business__section"><h2>Versi template</h2><button disabled={busy} onClick={()=>void run({action:"list"})}>Muat Ulang</button>{rows.length===0&&<p>Belum ada template Factory. Tujuh template bawaan tidak berubah.</p>}{rows.map(r=><div className="business__site" key={r.slug+":"+r.version}><div><strong>{r.slug} · v{r.version}</strong><small>{r.status}</small></div><button disabled={busy} onClick={()=>void run({action:"review",slug:r.slug,version:r.version})}>Periksa</button>{r.status==="published"&&<a href={"/template-demo/"+r.slug+"/"+r.version} target="_blank" rel="noreferrer">Demo publik</a>}</div>)}</section>
 {review&&<section className="business__section"><h2>{review.spec.name} · v{review.row.version}</h2><p>{review.spec.description}</p><p>Status: {review.row.status}</p><button onClick={()=>setPreview(true)}>Buka Demo Privat</button><details><summary>Periksa data dan media</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",maxHeight:400,overflow:"auto"}}>{JSON.stringify(review.spec,null,2)}</pre></details>
 {review.row.status==="review"&&<><button className="business__primary" disabled={busy} onClick={()=>{if(confirm("Sudah memeriksa desain, konten contoh, lisensi media, desktop dan mobile? Rilis versi ini ke katalog semua mitra?"))void run({action:"approve",slug:review.row.slug,version:review.row.version,updated_at:review.row.updated_at});}}>Setujui &amp; Rilis</button><button disabled={busy} onClick={()=>void run({action:"reject",slug:review.row.slug,version:review.row.version,updated_at:review.row.updated_at})}>Tolak</button></>}
 {review.row.status==="published"&&<button disabled={busy} onClick={()=>{if(confirm("Arsipkan versi ini? Website klien yang memakai salinannya tidak berubah."))void run({action:"archive",slug:review.row.slug,version:review.row.version,updated_at:review.row.updated_at});}}>Arsipkan</button>}</section>}
 </>}</div></main>;
}
