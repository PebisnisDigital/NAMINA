import {useState} from "react";
import {businessClient} from "../business/client";
type Key={id:string;label:string;scope:string;expires_at:string;revoked_at:string|null};
type RequestRow={id:string;operation:string;payload:Record<string,unknown>;status:string;created_at:string;result:unknown};
async function call(body:object){
 const session=await businessClient?.auth.getSession();const token=session?.data.session?.access_token;
 if(!token)throw Error("Masuk kembali sebagai superadmin.");
 const r=await fetch("/api/mcp-admin-control",{method:"POST",cache:"no-store",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await r.json();if(!r.ok)throw Error(data.error||"Permintaan gagal.");return data;
}
const labels:Record<string,string>={create_partner_website:"Buat website mitra",update_partner_website:"Edit website mitra",publish:"Publikasikan website",create_partner:"Tambah mitra",edit_partner:"Edit mitra",extend_partner:"Aktifkan / perpanjang mitra",rotate_link:"Ganti Magic Link",revoke_link:"Cabut Magic Link",revoke_partner_mcp:"Cabut MCP mitra",set_partner_quota:"Ubah kuota"};
export function AdminAiConnect({onChanged}:{onChanged:()=>Promise<void>}){
 const [keys,setKeys]=useState<Key[]|null>(null),[requests,setRequests]=useState<RequestRow[]>([]);
 const [name,setName]=useState("Hermes"),[scope,setScope]=useState("websites"),[secret,setSecret]=useState(""),[privateLink,setPrivateLink]=useState("");
 const [review,setReview]=useState<{id:string;value:unknown}|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function load(){const [k,q]=await Promise.all([call({action:"list"}),call({action:"requests"})]);setKeys(k.keys||[]);setRequests(q.requests||[]);}
 async function run(action:string,id?:string){
  if((action==="approve"||action==="revoke")&&!window.confirm(action==="approve"?"Jalankan aksi yang sudah diperiksa? Perubahan ini akan berlaku di NAMINA.":"Cabut akses agent ini?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   if(action==="create"){
    const r=await call({action,label:name,scope});setSecret(r.token);setNotice("Kunci dibuat. Simpan sebelum ditutup.");
   }else if(action==="review"){
    const result=await call({action,id});setReview({id:id!,value:result.review});return;
   }else if(action!=="list"){
    const r=await call({action,id});if(r.private_link)setPrivateLink(r.private_link);
    setNotice(action==="approve"?"Aksi disetujui dan selesai.":action==="reject"?"Permintaan ditolak.":"Kunci dicabut.");
    setReview(null);if(action==="approve")await onChanged();
   }
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Aksi gagal.");}
  finally{setBusy(false);}
 }
 async function copy(s:string){try{await navigator.clipboard.writeText(s);setNotice("Tersalin.");}catch{setNotice("Salin teks secara manual.");}}
 const endpoint="https://namina.biz.id/api/mcp-admin";
 return <section className="business__section namina-mcp-panel">
  <h2>AI Connect · Superadmin</h2>
  <p className="business__fineprint">Kunci ini berbeda dari kunci mitra. Agent bisa menyiapkan draft pusat dan mengajukan aksi admin. Publikasi, perubahan akses, dan paket membutuhkan persetujuan manusia di sini.</p>
  <button type="button" className="business__primary" disabled={busy} onClick={()=>void run("list")}>{keys===null?"Buka Admin AI Connect":"Muat Ulang"}</button>
  {keys!==null&&<>
   <div className="business__create"><input aria-label="Alamat MCP superadmin" readOnly value={endpoint}/><button type="button" className="business__primary" onClick={()=>void copy(endpoint)}>Salin Alamat</button></div>
   <form className="business__create" onSubmit={e=>{e.preventDefault();void run("create");}}>
    <label>Nama agent<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>
    <fieldset className="namina-mcp-scope"><legend>Hak akses</legend>{[["websites","Website"],["partners","Mitra"],["both","Website & Mitra"]].map(([v,l])=><label key={v}><input type="radio" name="admin-mcp-scope" checked={scope===v} onChange={()=>setScope(v)}/>{l}</label>)}</fieldset>
    <button type="submit" className="business__primary" disabled={busy||!name.trim()||!!secret}>Buat Kunci Admin</button>
   </form>
   {secret&&<div><p className="business__fineprint">Kunci rahasia sekali tampil. Simpan di konfigurasi Hermes, jangan kirim lewat chat.</p><div className="business__create"><input aria-label="Kunci superadmin" readOnly value={secret}/><button type="button" className="business__primary" onClick={()=>void copy(secret)}>Salin Kunci</button></div><button type="button" onClick={()=>setSecret("")}>Sembunyikan</button></div>}
   {keys.map(k=><div className="business__site" key={k.id}><div><strong>{k.label}</strong><small>{k.scope} · {k.revoked_at||Date.parse(k.expires_at)<=Date.now()?"Tidak aktif":"Aktif"} · {new Date(k.expires_at).toLocaleDateString("id-ID")}</small></div>{!k.revoked_at&&<button type="button" disabled={busy} onClick={()=>void run("revoke",k.id)}>Cabut Kunci</button>}</div>)}
   <h2>Persetujuan Agent</h2>
   {privateLink&&<div><p className="business__fineprint">Link privat baru, hanya untuk pemilik mitra. Tidak disimpan ke riwayat agent.</p><div className="business__create"><input aria-label="Magic Link mitra" readOnly value={privateLink}/><button type="button" className="business__primary" onClick={()=>void copy(privateLink)}>Salin Link</button></div><button type="button" onClick={()=>setPrivateLink("")}>Sembunyikan</button></div>}
   {requests.length===0&&<p>Belum ada permintaan.</p>}
   {requests.map(q=><div className="business__section" key={q.id}><strong>{labels[q.operation]||q.operation}</strong><p className="business__fineprint">{q.status} · {new Date(q.created_at).toLocaleString("id-ID")}</p>
    <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(q.payload,null,2)}</pre>
    {q.status==="pending"&&review?.id===q.id&&<details open><summary>Data yang akan diproses</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",maxHeight:400,overflow:"auto"}}>{JSON.stringify(review.value,null,2)}</pre></details>}
    {q.status==="pending"&&<div className="business__create">{review?.id===q.id?<button className="business__primary" type="button" disabled={busy||!!privateLink} onClick={()=>void run("approve",q.id)}>Setujui & Jalankan</button>:<button type="button" className="business__primary" disabled={busy} onClick={()=>void run("review",q.id)}>Periksa Detail</button>}<button type="button" disabled={busy} onClick={()=>void run("reject",q.id)}>Tolak</button></div>}
   </div>)}
  </>}
  {notice&&<p role="status" className="business__success">{notice}</p>}{error&&<p role="alert" className="business__error">{error}</p>}
 </section>;
}
