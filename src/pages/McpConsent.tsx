import {useEffect,useState} from "react";
import {businessClient} from "../business/client";
import "../business.css";

export function McpConsent(){
  const [email,setEmail]=useState<string|null>(null);
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const params=new URLSearchParams(window.location.search);
  const agent=params.get("redirect_uri")?.startsWith("https://claude.ai/")?"Claude":"ChatGPT";
  const write=(params.get("scope")||"").split(/\s+/).includes("namina:draft");
  useEffect(()=>{
    let live=true;
    void businessClient?.auth.getUser().then(({data})=>{if(live){setEmail(data.user?.email||null);setReady(true);}}).catch(()=>{if(live)setReady(true);});
    if(!businessClient)setReady(true);
    return()=>{live=false;};
  },[]);
  async function decide(decision:"approve"|"deny"){
    setBusy(true);setError("");
    try{
      const session=await businessClient?.auth.getSession();
      const token=session?.data.session?.access_token;
      if(!token)throw Error("Masuk ke Studio terlebih dahulu.");
      const body=new URLSearchParams(window.location.search);body.set("decision",decision);
      const response=await fetch("/api/mcp-oauth?action=consent",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/x-www-form-urlencoded"},body:body.toString()});
      const result=await response.json();
      if(!response.ok||typeof result.redirect!=="string")throw Error("Otorisasi gagal. Pastikan akses mitra aktif, lalu coba lagi.");
      const target=new URL(result.redirect);
      const expected=new URL(params.get("redirect_uri")||"");
      if(target.origin!==expected.origin||target.pathname!==expected.pathname||!(target.origin==="https://claude.ai"||target.origin==="https://chatgpt.com"))throw Error("Alamat callback tidak valid.");
      window.location.assign(target.toString());
    }catch(cause){setError(cause instanceof Error?cause.message:"Otorisasi gagal.");setBusy(false);}
  }
  return <main className="business"><header className="business__header"><a className="business__logo" href="/studio">NAMINA<span>AI CONNECT</span></a></header>
    <div className="business__shell"><section className="business__section">
      <h1>Hubungkan {agent}</h1>
      <p>{ready&&email?"Akun Studio: "+email:"Izinkan agent mengakses workspace NAMINA milikmu."}</p>
      <p>Hak akses: {write?"Draft Editor — membaca, membuat, dan mengedit draft.":"Read Only — membaca website dan draft."}</p>
      <p>Agent tidak dapat memublikasikan, menghapus, atau membuka website mitra lain. Akses berakhir dalam 30 hari dan bisa dicabut melalui AI Connect.</p>
      {!ready?<p role="status">Memeriksa sesi…</p>:!email?<p><a href="/mitra" target="_blank" rel="noopener noreferrer">Masuk ke Studio di tab baru</a>, lalu muat ulang halaman ini.</p>:<div className="business__create"><button className="business__primary" disabled={busy} onClick={()=>void decide("approve")}>Izinkan Akses</button><button type="button" disabled={busy} onClick={()=>void decide("deny")}>Tolak</button></div>}
      {error&&<p role="alert" className="business__error">{error}</p>}
    </section></div></main>;
}
