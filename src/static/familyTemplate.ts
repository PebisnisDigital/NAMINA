import { blankSite,siteDocumentSchema,type SiteDocument } from "./sites.js";
import { defaultFamilyDesign } from "./familyDesign.js";
export function createFamilyTemplate(slug:string):SiteDocument {
 const site=blankSite(slug);
 site.presentation="hari-anak-sedunia";
 site.familyDesign=defaultFamilyDesign();
 site.content.identity.displayName="Hari Anak Sedunia";
 site.content.identity.profession="Cerita Keluarga";
 site.content.identity.bio="";
 site.content.cards=[];
 site.media={desktopVideo:"",mobileVideo:"",poster:"",portrait:"",enterKey:"",cards:{}};
 return siteDocumentSchema.parse(site);
}
