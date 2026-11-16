import { test, expect, type Page } from "@playwright/test";
import { cloneViniTemplate } from "../../src/static/sites";

async function openAdminStudio(page: Page) {
  await page.route("**/api/studio?*", async route => {
    const url = new URL(route.request().url());
    const action = url.searchParams.get("action");
    const reply = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (action === "session") return reply({ configured: true, authenticated: true });
    if (action === "list") return reply({ slugs: ["vini", "kustin"] });
    if (action === "site") {
      const slug = url.searchParams.get("slug") || "vini";
      return reply({ document: cloneViniTemplate(slug), sha: null });
    }
    return reply({ error: "Unexpected Studio request" }, 400);
  });
  // Direct URL uses the same administrator StudioV2 component as /studio,
  // without requiring live Supabase authentication for a browser regression.
  await page.goto("/studio-v2");
  const chooser = page.getByRole("combobox", { name: "Pilih website klien" });
  await expect(chooser).toBeVisible();
  await chooser.selectOption("kustin");
  await expect(page.locator(".studio-v2__canvas-indicator")).toContainText("namina.biz.id/kustin");
}

test("new-client template picker selects, returns to catalog, creates a draft, and closes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAdminStudio(page);
  await page.locator("summary", { hasText: "+ Klien · 6 Template" }).click();
  const panel = page.locator(".studio-v2__create-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".namina-template-picker__item")).toHaveCount(6);

  await panel.locator(".namina-template-picker__item")
    .filter({ hasText: "Dokter · Medical Teal" })
    .locator(".namina-template-picker__option").click();
  await expect(panel).toContainText("Siapkan Website Klien");
  await expect(panel).toContainText("Template dipilih: Dokter · Medical Teal");
  await expect(page.getByLabel("Nama link klien baru")).toBeVisible();
  await expect(panel.locator(".namina-template-picker__item")).toHaveCount(0);

  await panel.getByRole("button", { name: "Ganti Template" }).click();
  await expect(panel.locator(".namina-template-picker__item")).toHaveCount(6);
  await panel.locator(".namina-template-picker__item")
    .filter({ hasText: "Original · Putih" })
    .locator(".namina-template-picker__option").click();
  await page.getByLabel("Nama link klien baru").fill("uji-template-putih");
  await panel.getByRole("button", { name: "Buat Website dengan Template Ini" }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator(".studio-v2__canvas-indicator")).toContainText("namina.biz.id/uji-template-putih");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("namina:studio-v2:draft:uji-template-putih") || "{}"));
  expect(saved.slug).toBe("uji-template-putih");
  expect(saved.presentation).toBe("original-white");
});

for (const width of [390, 1440]) {
  test(`new-client popup closes via X, Escape, and outside click at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openAdminStudio(page);
    const summary = page.locator("summary", { hasText: "+ Klien · 6 Template" });
    const panel = page.locator(".studio-v2__create-panel");

    await summary.click();
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Tutup pilihan template" }).click();
    await expect(panel).toBeHidden();

    await summary.click();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    await summary.click();
    await expect(panel).toBeVisible();
    const panelRect = await panel.boundingBox();
    expect(panelRect).not.toBeNull();
    expect(panelRect!.x).toBeGreaterThanOrEqual(0);
    expect(panelRect!.x + panelRect!.width).toBeLessThanOrEqual(width + 1);
    await page.mouse.click(5, 240);
    await expect(panel).toBeHidden();
  });
}

test("existing /kustin template selection updates only its draft and dismisses dialog", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAdminStudio(page);
  await page.getByRole("button", { name: "Template", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Template NAMINA" });
  await expect(dialog).toBeVisible();
  await dialog.locator(".namina-template-picker__item")
    .filter({ hasText: "Chibi · Candy Pastel" })
    .locator(".namina-template-picker__option").click();
  await expect(dialog).toBeHidden();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("namina:studio-v2:draft:kustin") || "{}"));
  expect(saved.slug).toBe("kustin");
  expect(saved.presentation).toBe("chibi");
  // Previewing a style never writes to the publication endpoint.
  await expect(page.locator(".studio-v2__canvas-indicator")).toContainText("namina.biz.id/kustin");
});
