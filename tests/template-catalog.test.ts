import test from "node:test";
import assert from "node:assert/strict";
import { templateCatalog, createSiteFromTemplate, applySiteAppearance, selectedTemplate } from "../src/static/templateCatalog.ts";
import { cloneViniTemplate, prepareSite, siteDocumentSchema } from "../src/static/sites.ts";

test("the same six template choices are available to admin and partner Studios", () => {
  assert.deepEqual(templateCatalog.map(item => item.id), ["original", "original-white", "doctor", "chibi", "wedding2", "wedding"]);
  assert.deepEqual(templateCatalog.map(item => item.demo), ["/vini", "", "/dokter", "/chibi", "/wedding2", "/wedding"]);
  assert.equal(new Set(templateCatalog.map(item => item.id)).size, 6);
  assert.deepEqual(templateCatalog[4].menus, ["Mempelai", "Acara", "Kisah", "Galeri", "Hadiah"]);
  assert.deepEqual(templateCatalog[5].menus, ["Mempelai", "Acara", "Kisah", "Amplop", "Love Story"]);
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
