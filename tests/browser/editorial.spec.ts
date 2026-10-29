import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("editorial landing presents real samples and working entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your life, through time." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start preserving", exact: true })).toHaveAttribute("href", "/signup");
  await expect(page.getByRole("link", { name: "Explore sample archive", exact: true })).toHaveAttribute("href", "/demo");
  const samples = page.getByRole("region", { name: "The ordinary. The unforgettable." });
  await expect(samples.locator('a[href^="/demo/memories/"]')).toHaveCount(3);
  await samples.locator('a[href^="/demo/memories/"]').first().click();
  await expect(page).toHaveURL(/\/demo\/memories\/sunday-table$/);
  await expect(page.getByText("Sample archive — read only", { exact: true })).toBeVisible();
  await page.goto("/?deleted=1");
  await expect(page.getByText("Your account and archive have been deleted.")).toBeVisible();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("landing stays within the viewport in both themes", async ({ page }) => {
  await page.goto("/");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => localStorage.setItem("memochro-theme", value), theme);
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("main img").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await page.screenshot({ path: `test-results/editorial-landing-${theme}-${width}.png`, fullPage: true });
    }
  }
  await page.getByRole("button", { name: "Switch color theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("Home keeps sample inspiration separate from personal memories", async ({ page }) => {
  const [account] = JSON.parse(readFileSync(".env.test.local", "utf8"));
  await page.goto("/login");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in to your archive" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator("[data-editorial-home]")).toBeVisible();
  const empty = await page.getByRole("link", { name: "Create your first memory" }).count();
  if (empty) {
    const samples = page.getByRole("region", { name: "Imagine your archive" });
    await expect(samples.getByText(/Fictional memories/)).toBeVisible();
    await expect(samples.locator('a[href^="/demo/memories/"]')).toHaveCount(3);
    await expect(page.locator('.home-section .memory-card')).toHaveCount(0);
  } else {
    await expect(page.locator(".featured-memory")).toBeVisible();
    await expect(page.getByRole("region", { name: "Imagine your archive" })).toHaveCount(0);
  }
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { localStorage.setItem("memochro-theme", value); }, theme);
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.reload();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await page.screenshot({ path: `test-results/editorial-home-${theme}-${width}.png`, fullPage: true });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.locator("[data-editorial-home] .button").first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe("0s");
  await page.goto("/");
  await expect(page).toHaveURL(/\/home$/);
});

test("populated Home handles a long written memory without a photo", async ({ page }) => {
  const [account] = JSON.parse(readFileSync(".env.test.local", "utf8"));
  await page.goto("/login");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in to your archive" }).click();
  await expect(page).toHaveURL(/\/home$/);
  const title = `Editorial layout check ${Date.now()} ${"A moment worth remembering ".repeat(5)}`.trim();
  let memoryUrl: string | undefined;
  try {
    await page.goto("/memories/new");
    await page.getByLabel("Give this moment a name").fill(title);
    await page.getByRole("button", { name: "Preserve this memory" }).click();
    await expect(page).toHaveURL(/\/memories\/[a-f0-9-]+$/);
    memoryUrl = page.url();
    for (const theme of ["light", "dark"]) {
      await page.evaluate(value => localStorage.setItem("memochro-theme", value), theme);
      for (const width of [375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto("/home");
        await expect(page.locator(".featured-memory h2")).toHaveText(title);
        await expect(page.locator(".featured-memory > img")).toHaveCount(0);
        await expect(page.getByRole("region", { name: "Imagine your archive" })).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
        await page.screenshot({ path: `test-results/editorial-populated-${theme}-${width}.png`, fullPage: true });
      }
    }
    await page.locator(".featured-memory").click();
    await expect(page).toHaveURL(memoryUrl);
  } finally {
    if (memoryUrl) {
      await page.goto(memoryUrl);
      await page.locator(".danger-details summary").click();
      await page.getByLabel("Type DELETE to confirm").fill("DELETE");
      await page.getByRole("button", { name: "Delete permanently" }).click();
      await expect(page).toHaveURL(/\/memories$/);
    }
  }
});
