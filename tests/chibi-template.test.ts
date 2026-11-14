import test from "node:test";
import assert from "node:assert/strict";
import { createChibiTemplate } from "../src/static/chibiTemplate.ts";
import { createDoctorTemplate, setChibiAppearance, setOriginalAppearance } from "../src/static/doctorTemplate.ts";
import { cloneViniTemplate, prepareSite, siteDocumentSchema, viniSeed } from "../src/static/sites.ts";
import { slugSchema } from "../src/domain/content.ts";

test("chibi is a reserved demo route, not a client slug", () => {
  assert.equal(slugSchema.safeParse("chibi").success, false);
  assert.equal(slugSchema.safeParse("contoh-chibi").success, true);
});

test("chibi demo uses cinematic NAMINA original structure and editable fictitious content", () => {
  const doc = createChibiTemplate("contoh-chibi");
  const published = siteDocumentSchema.parse(prepareSite(doc));
  assert.equal(published.slug, "contoh-chibi");
  assert.equal(published.presentation, "chibi");
  assert.equal(published.content.template, "ORIGINAL");
  assert.equal(published.content.identity.displayName, "NINA CHIBI");
  assert.equal(published.content.original?.style?.fontFamily, "fredoka");
  assert.match(published.media.desktopVideo, /hero\.mp4$/);
  assert.ok(published.content.original?.karya.items.length);
  assert.ok(published.content.original?.produk.items.length);
  assert.equal(published.content.original?.contactUrl, "");
});

test("chibi skin only changes colors, font and buttons; never moves layout or edits client data", () => {
  const source = cloneViniTemplate("contoh-klien");
  const copy = structuredClone(source);
  const changed = setChibiAppearance(source);
  assert.equal(changed.presentation, "chibi");
  assert.deepEqual(source, copy, "theme functions must not mutate the input");
  assert.deepEqual(changed.media, source.media);
  assert.deepEqual(changed.content.identity, source.content.identity);
  for (const key of ["nama", "karir", "skill", "karya", "produk"] as const) {
    assert.deepEqual(changed.content.original?.[key], source.content.original?.[key]);
  }
  assert.equal(changed.content.original?.style?.layoutPreset, source.content.original?.style?.layoutPreset);
  assert.equal(changed.content.original?.style?.factColumns, source.content.original?.style?.factColumns);
  assert.equal(changed.content.original?.style?.galleryColumns, source.content.original?.style?.galleryColumns);
  assert.equal(changed.content.original?.style?.contentMargin, source.content.original?.style?.contentMargin);
  assert.equal(changed.content.original?.style?.topSpacing, source.content.original?.style?.topSpacing);
  const reset = setOriginalAppearance(changed);
  assert.equal(reset.presentation, "original");
  assert.equal(reset.content.original?.style?.fontFamily, "montserrat");
  assert.deepEqual(reset.media, source.media);
  assert.deepEqual(reset.content.original?.karya.items, source.content.original?.karya.items);
  assert.equal(viniSeed.slug, "vini");
  assert.equal(createDoctorTemplate("contoh-dokter").presentation, "doctor");
});
