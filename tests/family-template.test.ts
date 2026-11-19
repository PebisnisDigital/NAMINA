import {test} from "node:test";
import assert from "node:assert/strict";
import {createFamilyTemplate} from "../src/static/familyTemplate.js";
import {blankSite,siteDocumentSchema,prepareSite} from "../src/static/sites.js";
import {switchSiteTemplate} from "../src/static/templateCatalog.js";
test("family starts with complete independent demo and valid legacy cards",()=>{
 const first=createFamilyTemplate("family-test"), second=createFamilyTemplate("family-new");
 assert.ok(siteDocumentSchema.safeParse(prepareSite(first)).success);
 assert.equal(first.familyDesign?.anak1.name,"Edo");assert.equal(first.familyDesign?.anak2.name,"Yuda");
 assert.ok(first.familyDesign?.welcomeVideo);assert.ok(first.familyDesign?.doaVideo);
 assert.equal(first.familyDesign?.gallery.length,5);
 first.familyDesign!.anak1.name="Edited";assert.equal(second.familyDesign?.anak1.name,"Edo");
});
test("switch to family preserves personal snapshot and restores family edits",()=>{
 const original=blankSite("family-switch");const family=switchSiteTemplate(original,"hari-anak-sedunia");
 assert.ok(family.familyDesign?.welcomeVideo);family.familyDesign!.anak1.name="Edited";
 const back=switchSiteTemplate(family,"original");assert.equal(back.content.identity.displayName,original.content.identity.displayName);
 assert.equal(switchSiteTemplate(back,"hari-anak-sedunia").familyDesign?.anak1.name,"Edited");
});
