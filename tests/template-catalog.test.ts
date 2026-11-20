import test from "node:test";
import assert from "node:assert/strict";
import { templateCatalog, createSiteFromTemplate, applySiteAppearance, switchSiteTemplate, selectedTemplate } from "../src/static/templateCatalog.ts";
import { cloneViniTemplate, prepareSite, siteDocumentSchema } from "../src/static/sites.ts";

test("the same seven built-in template choices are available to admin and partner Studios", () => {
  assert.deepEqual(templateCatalog.map(item => item.id), ["hari-anak-sedunia","original", "original-white", "doctor", "chibi", "wedding2", "wedding"]);
  assert.deepEqual(templateCatalog.map(item => item.demo), ["/anaksedunia","/vini", "", "/dokter", "/chibi", "/wedding2", "/wedding"]);
  assert.equal(new Set(templateCatalog.map(item => item.id)).size, 7);
  assert.deepEqual(templateCatalog[5].menus, ["Mempelai", "Acara", "Kisah", "Galeri", "Hadiah"]);
  assert.deepEqual(templateCatalog[6].menus, ["Mempelai", "Acara", "Kisah", "Amplop", "Love Story"]);
});

test("new websites use their selected template seed instead of always copying /vini", async () => {
  for (const id of ["original", "original-white", "doctor", "chibi", "wedding2", "wedding"] as const) {
    const site = siteDocumentSchema.parse(prepareSite(await createSiteFromTemplate("klien-" + id, id)));
    assert.equal(site.slug, "klien-" + id);
    assert.equal(site.presentation ?? "original", id);
    assert.ok(site.content.original);
    assert.ok(site.content.identity.displayName);
    assert.ok(site.content.original?.karya.items.length);
    assert.ok(site.content.original?.produk.items.length);
  }
  const white = await createSiteFromTemplate("putih-contoh", "original-white");
  assert.equal(white.presentation, "original-white");
  assert.equal(white.content.original?.style?.backgroundColor, "#ffffff");
  assert.equal(white.content.original?.style?.textColor, "#191919");
  const living = await createSiteFromTemplate("pasangan-living-paper", "wedding2");
  assert.equal(living.presentation, "wedding2");
  assert.equal(living.media.desktopVideo, "");
  assert.equal(living.content.original?.menuTitles?.karya, "Galeri");
  const wedding = await createSiteFromTemplate("pasangan-klien", "wedding");
  assert.equal(wedding.content.original?.menuTitles?.karya, "Amplop");
  assert.equal(wedding.content.original?.menuTitles?.produk, "Love Story");
});

test("switching existing client templates only updates appearance and standard menu labels", () => {
  const original = cloneViniTemplate("klien-contoh");
  const snapshot = structuredClone(original);
  for (const id of ["doctor", "chibi", "wedding", "wedding2", "original"] as const) {
    const edited = applySiteAppearance(original, id);
    assert.equal(edited.presentation, id);
    assert.deepEqual(edited.media, original.media);
    assert.deepEqual(edited.content.identity, original.content.identity);
    assert.deepEqual(edited.content.original?.karya.items, original.content.original?.karya.items);
    assert.deepEqual(edited.content.original?.produk.items, original.content.original?.produk.items);
    assert.equal(edited.content.original?.style?.layoutPreset, original.content.original?.style?.layoutPreset);
  }
  const white = applySiteAppearance(original, "original-white");
  assert.equal(white.content.original?.style?.backgroundColor, "#ffffff");
  assert.deepEqual(white.media, original.media);
  assert.deepEqual(white.content.identity, original.content.identity);
  const dark = applySiteAppearance(white, "original");
  assert.equal(dark.presentation, "original");
  assert.equal(dark.content.original?.style?.backgroundColor, "#08080c");
  assert.deepEqual(dark.content.original?.karya.items, white.content.original?.karya.items);
  assert.deepEqual(original, snapshot, "switching styles must never mutate existing client data");
});

test("legacy white sites show the light template without modifying content", () => {
  const old = cloneViniTemplate("legacy-putih");
  old.content.original!.style = {
    ...old.content.original!.style!,
    backgroundColor: "#ffffff",
    textColor: "#191919",
  };
  assert.equal(selectedTemplate(old), "original-white");
  const explicit = applySiteAppearance(old, "original-white");
  assert.equal(siteDocumentSchema.parse(prepareSite(explicit)).presentation, "original-white");
});

test("in-place /vini switch to Living Paper keeps the same slug and an editable Wedding", () => {
  const original = cloneViniTemplate("vini");
  original.content.identity.displayName = "TEH VINI";
  const oldVideo = original.media.desktopVideo;
  const wedding = switchSiteTemplate(original, "wedding2");
  assert.equal(wedding.slug, "vini", "switch must not create a new client URL");
  assert.equal(wedding.presentation, "wedding2");
  assert.equal(wedding.content.identity.displayName, "Hizqil & Icaa");
  assert.ok(wedding.weddingDesign);
  assert.equal(wedding.templateSnapshots?.personal?.content.identity.displayName, "TEH VINI");
  assert.equal(wedding.templateSnapshots?.personal?.media.desktopVideo, oldVideo);
  assert.equal(original.presentation, undefined);
  assert.equal(original.content.identity.displayName, "TEH VINI", "source is never mutated");
  const edited = structuredClone(wedding);
  edited.content.identity.displayName = "Hana & Rafi";
  edited.weddingDesign!.coverButtonText = "Buka Undangan";
  const publishedShape = siteDocumentSchema.parse(prepareSite(edited));
  assert.equal(publishedShape.templateSnapshots?.personal?.content.identity.displayName, "TEH VINI");
  assert.equal(publishedShape.content.identity.displayName, "Hana & Rafi");
});

test("switching back restores original /vini, and returning to Wedding restores edits", () => {
  const original = cloneViniTemplate("vini");
  const oldName = original.content.identity.displayName;
  const oldVideo = original.media.desktopVideo;
  const wedding = switchSiteTemplate(original, "wedding2");
  wedding.content.identity.displayName = "Hana & Rafi";
  wedding.weddingDesign!.coverButtonText = "Buka Sampul";
  const restored = switchSiteTemplate(wedding, "original");
  assert.equal(restored.slug, "vini");
  assert.equal(restored.presentation, "original");
  assert.equal(restored.content.identity.displayName, oldName);
  assert.equal(restored.media.desktopVideo, oldVideo);
  assert.equal(restored.templateSnapshots?.wedding?.content.identity.displayName, "Hana & Rafi");
  const backToWedding = switchSiteTemplate(restored, "wedding2");
  assert.equal(backToWedding.content.identity.displayName, "Hana & Rafi");
  assert.equal(backToWedding.weddingDesign?.coverButtonText, "Buka Sampul");
  assert.equal(siteDocumentSchema.safeParse(backToWedding).success, true);
});
