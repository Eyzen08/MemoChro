import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("sample archive is browsable, searchable and read only", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/demo\/home$/);
  await expect(page.getByText("Sample archive — read only", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  for (const section of ["timeline", "memories", "albums", "stories", "places"]) {
    await page.goto(`/demo/${section}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: /favorite|delete|save|upload/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /edit|create memory/i })).toHaveCount(0);
  }
  await page.goto("/demo/memories");
  await page.getByRole("searchbox").fill("Sunday");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".memory-card")).toHaveCount(1);
  await page.locator(".memory-caption a").click();
  await page.locator(".photo-gallery button").first().click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.keyboard.press("Escape");
  for (const section of ["albums", "stories", "places"]) {
    await page.goto(`/demo/${section}`);
    await page.locator(".sample-collection a").first().click();
    await expect(page).toHaveURL(new RegExp(`/demo/${section}/`));
  }
});

test("photo selections survive validation, support removal/drop and warn before leaving", async ({ page }) => {
  await page.addInitScript(() => {
    const active = new Set<string>(), create = URL.createObjectURL, revoke = URL.revokeObjectURL;
    URL.createObjectURL = value => { const url = create(value); active.add(url); return url; };
    URL.revokeObjectURL = url => { active.delete(url); revoke(url); };
    Object.defineProperty(window, "activePreviewURLs", {get:()=>active.size});
  });
  const [account] = JSON.parse(readFileSync(".env.test.local", "utf8"));
  await page.goto("/login");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in to your archive" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/memories/new");
  await page.getByLabel("Give this moment a name").fill("Keep these selections");
  await page.locator('input[type="file"]').setInputFiles("public/quiet-lake.jpg");
  await expect(page.locator(".selection-preview img")).toHaveCount(1);
  await page.getByLabel("Give this moment a name").click();
  const unload = page.waitForEvent("dialog", {timeout:5000});
  const reload = page.reload({timeout:3000, waitUntil:"commit"}).catch(() => {});
  const warning = await unload;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await reload;
  await expect(page.getByLabel("Give this moment a name")).toHaveValue("Keep these selections");
  await page.getByRole("button", { name: "Remove quiet-lake.jpg" }).click();
  await expect(page.locator(".selection-preview img")).toHaveCount(0);
  expect(await page.evaluate(()=>(window as unknown as {activePreviewURLs:number}).activePreviewURLs)).toBe(0);
  await page.locator(".upload-zone").dispatchEvent("drop", { dataTransfer: await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array([255,216,255,0])], "dropped.jpg", {type:"image/jpeg"}));
    return data;
  }) });
  await expect(page.getByRole("button", { name: "Remove dropped.jpg" })).toBeVisible();
  await page.getByLabel("Tags", {exact:true}).fill(Array.from({length:21}, (_,i)=>`tag${i}`).join(","));
  // Use a valid image for the server validation failure.
  await page.getByRole("button", {name:"Remove dropped.jpg"}).click();
  await page.locator('input[type="file"]').setInputFiles("public/quiet-lake.jpg");
  await page.getByRole("button", {name:"Preserve this memory"}).click();
  await expect(page.locator(".feedback.error")).toContainText("Use up to 20 tags");
  await expect(page.locator(".selection-preview img")).toHaveCount(1);
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("link", {name:"Cancel", exact:true}).click();
  await expect(page).toHaveURL(/\/memories\/new$/);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("link", {name:"Cancel", exact:true}).click();
  await expect(page).toHaveURL(/\/memories$/);
  expect(await page.evaluate(()=>(window as unknown as {activePreviewURLs:number}).activePreviewURLs)).toBe(0);
});
