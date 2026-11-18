import { useState } from "react";
import { businessClient } from "../business/client";

type AgentKey = {
  id: string; label: string; scope: "read"|"draft";
  expires_at: string; last_used_at: string|null; active: boolean;
};
type ResponseData = { keys?: AgentKey[]; token?: string; error?: string };
async function request(body: object): Promise<ResponseData> {
  const session=await businessClient?.auth.getSession();
  const token=session?.data.session?.access_token;
  if (!token) throw new Error("Masuk kembali ke Studio.");
  const response=await fetch("/api/mcp-keys",{
    method:"POST", cache:"no-store", headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify(body),
  });
  const data=await response.json() as ResponseData;
  if (!response.ok) throw new Error(data.error || "AI Connect tidak tersedia.");
  return data;
}
const dateLabel=(value:string)=>new Date(value).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"});
export function BusinessAiConnect() {
  const [keys,setKeys]=useState<AgentKey[]|null>(null);
  const [label,setLabel]=useState("");
  const [scope,setScope]=useState<"read"|"draft">("read");
  const [secret,setSecret]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const endpoint=window.location.origin+"/api/mcp";
  async function run(action: "list"|"create"|"revoke", id?:string) {
    setBusy(true); setError(""); setNotice("");
    try {
      if(action==="create") {
        const data=await request({action,label,scope});
        if(!data.token) throw new Error("Kunci tidak diterima.");
        setSecret(data.token); setLabel(""); setNotice("Kunci dibuat. Salin sebelum menutupnya.");
      } else if(action==="revoke") {
        if(!window.confirm("Cabut akses agent ini? Kuncinya tidak dapat dipakai lagi.")) return;
        await request({action,id}); setNotice("Kunci dicabut.");
      }
      const list=await request({action:"list"}); setKeys(list.keys || []);
    } catch(cause) {setError(cause instanceof Error?cause.message:"AI Connect gagal.");}
    finally {setBusy(false);}
  }
  async function copy(value:string) {
    try {await navigator.clipboard.writeText(value);setNotice("Tersalin.");}
    catch {setNotice("Tidak dapat menyalin otomatis. Pilih dan salin teks secara manual.");}
  }
  return <section className="business__section namina-mcp-panel">
    <h2>AI Connect</h2>
    <p className="business__fineprint">Hubungkan agent yang mendukung MCP dengan kunci Bearer. Agent hanya dapat membuka website workspace ini. Publikasi tetap melalui Studio.</p>
    <button type="button" className="business__primary" disabled={busy} onClick={()=>void run("list")}>{busy?"Memproses…":keys===null?"Buka AI Connect":"Muat Ulang Kunci"}</button>
    {keys!==null&&<>
      <label className="business__fineprint" htmlFor="mcp-url">Alamat MCP</label>
      <div className="business__create">
        <input id="mcp-url" readOnly value={endpoint}/>
        <button type="button" className="business__primary" onClick={()=>void copy(endpoint)}>Salin Alamat</button>
      </div>
      <form className="business__create" onSubmit={event=>{event.preventDefault();if(!busy)void run("create");}}>
        <label htmlFor="mcp-label">Nama agent<input id="mcp-label" value={label} maxLength={80} required onChange={e=>setLabel(e.target.value)} placeholder="Contoh: Hermes"/></label>
        <fieldset className="namina-mcp-scope">
          <legend>Hak akses</legend>
          <label><input type="radio" name="mcp-scope" checked={scope==="read"} onChange={()=>setScope("read")}/>Read Only</label>
          <label><input type="radio" name="mcp-scope" checked={scope==="draft"} onChange={()=>setScope("draft")}/>Draft Editor</label>
        </fieldset>
        <button className="business__primary" type="submit" disabled={busy||!label.trim()||!!secret}>Buat Kunci</button>
      </form>
      {secret&&<div className="business__access-card">
        <p className="business__fineprint">Kunci rahasia ditampilkan sekali. Simpan hanya di konfigurasi agent tepercaya, jangan kirim melalui chat.</p>
        <div className="business__create"><input aria-label="Kunci MCP baru" readOnly value={secret}/><button type="button" className="business__primary" onClick={()=>void copy(secret)}>Salin Kunci</button></div>
        <button type="button" onClick={()=>setSecret("")}>Sembunyikan Kunci</button>
      </div>}
      <p className="business__fineprint">Maksimal 10 kunci aktif, berlaku 30 hari. Koneksi OAuth belum tersedia.</p>
      {keys.length===0&&<p className="business__fineprint">Belum ada kunci agent.</p>}
      {keys.map(key=><div className="business__site" key={key.id}>
        <div><strong>{key.label}</strong><small>{key.scope==="read"?"Read Only":"Draft Editor"} · {key.active?"Aktif":"Tidak aktif"}</small><small>Berlaku hingga {dateLabel(key.expires_at)}</small>{key.last_used_at&&<small>Terakhir dipakai {dateLabel(key.last_used_at)}</small>}</div>
        {key.active&&<button type="button" disabled={busy} onClick={()=>void run("revoke",key.id)}>Cabut Akses</button>}
      </div>)}
    </>}
    {notice&&<p role="status" className="business__success">{notice}</p>}
    {error&&<p role="alert" className="business__error">{error}</p>}
  </section>;
}
