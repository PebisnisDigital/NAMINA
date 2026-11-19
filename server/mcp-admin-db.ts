import {createClient} from "@supabase/supabase-js";
import {siteDocumentSchema} from "../src/static/sites.js";
export function adminDb(){
 const url=process.env.VITE_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key||(process.env.SUPABASE_URL&&process.env.SUPABASE_URL!==url))throw Error("Backend unavailable");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
export function userDb(bearer:string){
 const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
 if(!url||!key)throw Error("Authentication unavailable");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:"Bearer "+bearer}}});
}
export async function legacy(path:string){
 const repo=process.env.NAMANA_GITHUB_REPO||"PebisnisDigital/NAMINA",branch=process.env.NAMANA_GITHUB_BRANCH||"main",token=process.env.NAMANA_GITHUB_TOKEN;
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!token)throw Error("Legacy store unavailable");
 return fetch("https://api.github.com/repos/"+repo+"/contents/"+path+"?ref="+encodeURIComponent(branch),{headers:{Accept:"application/vnd.github+json",Authorization:"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28"}});
}
export async function legacySite(slug:string){
 const r=await legacy("public/clients/"+slug+".json");
 if(r.status===404)return null;
 if(!r.ok)throw Error("Legacy store unavailable");
 const f=await r.json() as {content:string;sha:string};
 return {document:siteDocumentSchema.parse(JSON.parse(Buffer.from(f.content.replace(/\s/g,""),"base64").toString("utf8"))),sha:f.sha};
}
export async function legacySlugs(){
 const r=await legacy("public/clients");
 if(r.status===404)return [];
 if(!r.ok)throw Error("Legacy store unavailable");
 return ((await r.json()) as {name:string}[]).filter(f=>f.name.endsWith(".json")).map(f=>f.name.slice(0,-5));
}
export function checked<T>(r:{data:T;error:unknown}):T {
 if(r.error)throw Error("Database request failed");return r.data;
}
