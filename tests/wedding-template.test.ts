import assert from "node:assert/strict";
import test from "node:test";
import { createWeddingTemplate } from "../src/static/weddingTemplate.ts";
import { setWeddingAppearance, setOriginalAppearance, createDoctorTemplate } from "../src/static/doctorTemplate.ts";
import { cloneViniTemplate, prepareSite, siteDocumentSchema, viniSeed } from "../src/static/sites.ts";
import { slugSchema } from "../src/domain/content.ts";

test("wedding demo route is reserved for the platform", () => {
  assert.equal(slugSchema.safeParse("wedding").success, false);
  assert.equal(slugSchema.safeParse("contoh-wedding").success, true);
});
test("wedding is a fully editable NAMINA original profile with five named sections", () => {
  const site = siteDocumentSchema.parse(prepareSite(createWeddingTemplate("contoh-wedding")));
  assert.equal(site.presentation, "wedding");
  assert.equal(site.content.template, "ORIGINAL");
  assert.equal(site.content.identity.displayName, "Alya & Raka");
  assert.deepEqual(site.content.original?.menuTitles, {
    nama: "Mempelai", karir: "Acara", skill: "Kisah", karya: "Amplop", produk: "Love Story",
  });
  assert.equal(site.content.original?.style?.fontFamily, "cormorant");
  assert.equal(site.content.original?.style?.layoutPreset, "original");
  assert.equal(site.content.original?.contactUrl, "");
  assert.ok(site.content.original?.produk.items.length);
  assert.ok(site.content.original?.produk.items.every(item => /foto|cinta/i.test(item.description)));
  assert.ok(site.content.original?.karya.items.some(item => /rekening/i.test(item.description)));
  assert.equal(site.content.original?.contactLabel, "Love Story");
  assert.equal(site.media.desktopVideo, "/videos/hero.mp4");
  assert.equal(viniSeed.slug, "vini");
  assert.equal(createDoctorTemplate("contoh-dokter").presentation, "doctor");
});
test("wedding skin preserves /vini positions and all client content", () => {
  const original = cloneViniTemplate("klien-wedding");
  const copy = structuredClone(original);
  const wedding = setWeddingAppearance(original);
  assert.deepEqual(original, copy, "theme must not mutate input");
  assert.equal(wedding.presentation, "wedding");
  assert.deepEqual(wedding.content.identity, original.content.identity);
  assert.deepEqual(wedding.media, original.media);
  for (const key of ["nama", "karir", "skill", "karya", "produk"] as const) {
    assert.deepEqual(wedding.content.original?.[key], original.content.original?.[key]);
  }
  for (const key of ["layoutPreset","contentMargin","topSpacing","factColumns","galleryColumns","cardGap"] as const) {
    assert.equal(wedding.content.original?.style?.[key], original.content.original?.style?.[key]);
  }
  const restored = setOriginalAppearance(wedding);
  assert.equal(restored.presentation,"original");
  assert.equal(restored.content.original?.menuTitles?.nama,"Nama");
  assert.equal(restored.content.original?.menuTitles?.karya,"Karya");
  assert.equal(restored.content.original?.menuTitles?.produk,"Produk");
  assert.deepEqual(restored.media, original.media);
});

test("historical Wedding menus are renamed when the skin is reapplied, without replacing client content", () => {
  const old = createWeddingTemplate("wedding-klien");
  old.content.original!.menuTitles = {
    nama: "Mempelai", karir: "Acara", skill: "Kisah", karya: "Galeri", produk: "RSVP",
  };
  const gallery = structuredClone(old.content.original!.produk.items);
  const upgraded = setWeddingAppearance(old);
  assert.equal(upgraded.content.original?.menuTitles?.karya, "Amplop");
  assert.equal(upgraded.content.original?.menuTitles?.produk, "Love Story");
  assert.deepEqual(upgraded.content.original?.produk.items, gallery);
});
