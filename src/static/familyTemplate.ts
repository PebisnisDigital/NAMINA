import { blankSite,siteDocumentSchema,prepareSite,type SiteDocument } from "./sites.js";
import { createFamilySample } from "./familySample.js";
export function createFamilyTemplate(slug:string):SiteDocument {
 const site=blankSite(slug);
 site.presentation="hari-anak-sedunia";
 site.familyDesign=createFamilySample();
 site.content.identity.displayName="Hari Anak Sedunia";
 site.content.identity.profession="Cerita Keluarga";
 site.content.identity.bio="";
 // The shared content schema requires at least one visible legacy card. Retain the valid seed cards; family renderer does not display them.
 site.media={desktopVideo:"",mobileVideo:"",poster:"",portrait:"",enterKey:"",cards:{}};
 return siteDocumentSchema.parse(prepareSite(site));
}
