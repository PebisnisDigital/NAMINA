import test from "node:test";
import assert from "node:assert/strict";
import { templateCatalog, createSiteFromTemplate, applySiteAppearance } from "../src/static/templateCatalog.ts";
import { cloneViniTemplate, prepareSite, siteDocumentSchema } from "../src/static/sites.ts";

test("the same four template choices are available to admin and partner Studios", () => {
  assert.deepEqual(templateCatalog.map(item => item.id), ["original", "doctor", "chibi", "wedding"]);
  assert.deepEqual(templateCatalog.map(item => item.demo), ["/vini", "/dokter", "/chibi", "/wedding"]);
  assert.equal(new Set(templateCatalog.map(item => item.id)).size, 4);
  assert.deepEqual(templateCatalog[3].menus, ["Mempelai", "Acara", "Kisah", "Amplop", "Love Story"]);
});

test("new websites use their selected template seed instead of always copying /vini", async () => {
  for (const id of ["original", "doctor", "chibi", "wedding"] as const) {
    const site = siteDocumentSchema.parse(prepareSite(await createSiteFromTemplate("klien-" + id, id)));
    assert.equal(site.slug, "klien-" + id);
    assert.equal(site.presentation ?? "original", id);
    assert.ok(site.content.original);
    assert.ok(site.content.identity.displayName);
    assert.ok(site.content.original?.karya.items.length);
    assert.ok(site.content.original?.produk.items.length);
  }
  const wedding = await createSiteFromTemplate("pasangan-klien", "wedding");
  assert.equal(wedding.content.original?.menuTitles?.karya, "Amplop");
  assert.equal(wedding.content.original?.menuTitles?.produk, "Love Story");
});

test("switching existing client templates only updates appearance and standard menu labels", () => {
  const original = cloneViniTemplate("klien-contoh");
  const snapshot = structuredClone(original);
  for (const id of ["doctor", "chibi", "wedding", "original"] as const) {
    const edited = applySiteAppearance(original, id);
    assert.equal(edited.presentation, id);
    assert.deepEqual(edited.media, original.media);
    assert.deepEqual(edited.content.identity, original.content.identity);
    assert.deepEqual(edited.content.original?.karya.items, original.content.original?.karya.items);
    assert.deepEqual(edited.content.original?.produk.items, original.content.original?.produk.items);
    assert.equal(edited.content.original?.style?.layoutPreset, original.content.original?.style?.layoutPreset);
  }
  assert.deepEqual(original, snapshot, "switching styles must never mutate existing client data");
});
