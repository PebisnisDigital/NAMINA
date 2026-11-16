import test from "node:test";
import assert from "node:assert/strict";
import { createWedding2Template } from "../src/static/wedding2Template.ts";
import { defaultWeddingDesign, weddingDesignSchema } from "../src/static/weddingDesign.ts";
import { siteDocumentSchema, cloneViniTemplate, prepareSite } from "../src/static/sites.ts";

test("Wedding Living Paper has a separate editable theme without changing original NAMINA",()=>{
  const wedding=createWedding2Template("pasangan-tes");
  assert.equal(wedding.presentation,"wedding2");
  assert.deepEqual(wedding.weddingDesign,defaultWeddingDesign());
  assert.equal(wedding.content.identity.displayName,"Hizqil & Icaa");
  assert.equal(wedding.media.desktopVideo,"");
  assert.equal(cloneViniTemplate("profil-tes").weddingDesign,undefined);
});

test("visual elements, section labels and animations survive publish schema round-trip",()=>{
  const site=createWedding2Template("contoh-pasangan");
  site.weddingDesign!.background="#efede4";
  site.weddingDesign!.sectionColors={mempelai:"#faf7ef"};
  site.weddingDesign!.sectionTitles={acara:"Hari Bahagia Kita"};
  site.weddingDesign!.coverButtonText="Buka Sampul";
  site.weddingDesign!.elements.push({
    id:"a7cc49da-c70b-4e0e-9e5b-a6537e12b612",type:"text",section:"beranda",
    x:13,y:220,width:71,text:"Sampai jumpa di hari bahagia",url:"",
    color:"#365640",fontSize:25,font:"classic",animation:"paper",align:"center",
  });
  const parsed=siteDocumentSchema.parse(JSON.parse(JSON.stringify(prepareSite(site))));
  assert.equal(parsed.weddingDesign?.elements[0]?.text,"Sampai jumpa di hari bahagia");
  assert.equal(parsed.weddingDesign?.sectionTitles?.acara,"Hari Bahagia Kita");
  assert.equal(parsed.weddingDesign?.coverButtonText,"Buka Sampul");
  assert.equal(parsed.weddingDesign?.sectionColors?.mempelai,"#faf7ef");
});

test("invalid canvas positions and unsafe theme data are rejected",()=>{
  const value=defaultWeddingDesign();
  value.elements.push({
    id:"a7cc49da-c70b-4e0e-9e5b-a6537e12b612",type:"button",section:"rsvp",
    x:170,y:50,width:40,text:"Kirim pesan",url:"javascript:alert(1)",
    color:"#35543c",fontSize:20,font:"modern",animation:"soft",align:"left",
  });
  assert.equal(weddingDesignSchema.safeParse(value).success,false);
  const invalid={...defaultWeddingDesign(),background:"red"};
  assert.equal(weddingDesignSchema.safeParse(invalid).success,false);
});
