import { useEffect, useRef, useState } from "react";
import { businessClient } from "../business/client";

type Props = { slug:string; siteId?:string; onUploaded:(url:string)=>void };
type State = "idle"|"preparing"|"uploading"|"verifying"|"done";
const LIMIT=80*1024*1024;
export function WeddingVideoUpload({slug,siteId,onUploaded}:Props){
  const [configured,setConfigured]=useState<boolean|null>(null);
  const [state,setState]=useState<State>("idle");
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const xhr=useRef<XMLHttpRequest|null>(null);
  useEffect(()=>{
    let active=true;
    fetch("/api/dropbox-video",{credentials:"same-origin"}).then(r=>r.json())
      .then((value:{configured?:boolean})=>{if(active)setConfigured(Boolean(value.configured));})
      .catch(()=>{if(active)setConfigured(false);});
    return()=>{active=false;xhr.current?.abort();};
  },[]);
  async function request(action:string,body:Record<string,unknown>) {
    let token="";
    if(siteId){
      if(!businessClient)throw new Error("Login mitra belum aktif.");
      const {data}=await businessClient.auth.getSession();
      token=data.session?.access_token||"";
      if(!token)throw new Error("Sesi mitra habis. Masuk lagi ke Studio.");
    }
    const result=await fetch("/api/dropbox-video?action="+action,{
      method:"POST",credentials:"same-origin",
      headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},
      body:JSON.stringify({...body,slug,...(siteId?{siteId}:{})}),
    });
    const json=await result.json() as {error?:string;url?:string;ticket?:string;uploadUrl?:string;ok?:boolean};
    if(!result.ok||json.error)throw new Error(json.error||"Gagal mengakses Dropbox");
    return json;
  }
  async function upload(file:File){
    if(state!=="idle"&&state!=="done")return;
    setError("");setProgress(0);
    if(!/\.mp4$/i.test(file.name)||file.size<1||file.size>LIMIT){setError("Pilih MP4 maksimal 80 MB.");return;}
    if(await file.slice(4,8).text()!=="ftyp"){setError("File bukan MP4 valid. Ekspor dalam format H.264.");return;}
    try{
      setState("preparing");
      const init=await request("init",{name:file.name,size:file.size});
      if(!init.uploadUrl||!init.ticket||new URL(init.uploadUrl).hostname!=="content.dropboxapi.com")throw new Error("URL unggah Dropbox tidak valid.");
      setState("uploading");
      await new Promise<void>((resolve,reject)=>{
        const request=new XMLHttpRequest();xhr.current=request;
        request.open("POST",init.uploadUrl!);
        request.setRequestHeader("Content-Type","application/octet-stream");
        request.upload.onprogress=e=>{if(e.lengthComputable)setProgress(Math.round(e.loaded/e.total*100));};
        request.onload=()=>{xhr.current=null;request.status>=200&&request.status<300?resolve():reject(new Error("Upload ditolak Dropbox."));};
        request.onerror=()=>{xhr.current=null;reject(new Error("Koneksi upload terputus."));};
        request.onabort=()=>{xhr.current=null;reject(new Error("Upload dibatalkan."));};
        request.send(file);
      });
      setState("verifying");
      const finish=await request("complete",{ticket:init.ticket});
      if(!finish.ok||!finish.url)throw new Error("Dropbox belum memverifikasi link video.");
      onUploaded(finish.url);
      setState("done");
    }catch(err){
      setError(err instanceof Error?err.message:"Upload gagal.");
      setState("idle");
    }finally{if(input.current)input.current.value="";}
  }
  const busy=state==="preparing"||state==="uploading"||state==="verifying";
  return <div className="w2-video-upload">
    <label className="w2-panel-field">
      <span>Unggah video intro (MP4, maks. 80 MB)</span>
      <input ref={input} type="file" accept="video/mp4,.mp4" disabled={busy||configured===false}
        onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);}}/>
    </label>
    {configured===false&&<p role="status" className="w2-panel-note">Dropbox belum dikonfigurasi. Gunakan URL video HTTPS di kolom atas.</p>}
    {busy&&<div role="status" className="w2-video-progress"><progress max="100" value={progress}/><span>{state==="preparing"?"Menyiapkan...":state==="verifying"?"Memeriksa hasil upload...":progress+"% terunggah"}</span>
      {state==="uploading"&&<button type="button" onClick={()=>xhr.current?.abort()}>Batalkan</button>}</div>}
    {state==="done"&&<p role="status" className="w2-video-success">✓ Video masuk Dropbox dan terpasang di draft.</p>}
    {error&&<p role="alert" className="w2-video-error">{error}</p>}
  </div>;
}
