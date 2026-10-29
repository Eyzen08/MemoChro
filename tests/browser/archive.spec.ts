import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
const accounts = JSON.parse(readFileSync(".env.test.local", "utf8")) as {
  id: string;
  email: string;
  password: string;
  name: string;
}[];
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
const run = randomUUID().slice(0, 8);
const memoryTitle = `A quiet morning ${run}`;
async function signIn(page: Page, account = accounts[0]) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in to your archive" }).click();
  await expect(page).toHaveURL(/\/home$/);
}
async function api(index: number) {
  const db = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } },
  );
  const login = await db.auth.signInWithPassword(accounts[index]);
  expect(login.error).toBeNull();
  return db;
}

test("signed-out archive protection, expired callback and registration form", async ({
  page,
}) => {
  await page.goto("/memories");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your life, through time." }),
  ).toBeVisible();
  await page.goto("/auth/callback?next=//evil.example");
  await expect(page).toHaveURL(/\/login\?message=/);
  await page.goto("/signup");
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "12");
});

test("memory, uploads, search, relationships, export and safe deletion survive refresh", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/places/new");
  await page
    .getByLabel("Place name", { exact: true })
    .fill(`Quiet lake ${run}`);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/places$/);
  await page.goto("/settings/people/new");
  await page.getByLabel("Name", { exact: true }).fill(`A friend ${run}`);
  await page.getByLabel("Relationship", { exact: true }).fill("Friend");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/settings\/people$/);
  await page.goto("/albums/new");
  await page
    .getByLabel("Title", { exact: true })
    .fill(`Small adventures ${run}`);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/albums\/[a-f0-9-]+$/);
  const albumUrl = page.url();
  await page.goto("/memories/new");
  await page.getByLabel("Give this moment a name").fill(memoryTitle);
  await page.getByLabel("Memory date").fill("2024-06-12");
  await page
    .getByLabel("The story behind it")
    .fill("A still lake, good company, and a day worth keeping.");
  await page.getByLabel("Tags", { exact: false }).fill("lake, family");
  await page
    .getByLabel("Place", { exact: true })
    .selectOption({ label: `Quiet lake ${run}` });
  await page.getByLabel(`A friend ${run}`, { exact: true }).check();
  await page.getByLabel(`Small adventures ${run}`, { exact: true }).check();
  const largePhoto = Buffer.concat([
    readFileSync("public/quiet-lake.jpg"),
    Buffer.alloc(5 * 1024 * 1024),
  ]);
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "quiet-lake.jpg",
      mimeType: "image/jpeg",
      buffer: largePhoto,
    });
  await page.getByRole("button", { name: "Preserve this memory" }).click();
  await expect(page).toHaveURL(/\/memories\/[a-f0-9-]+$/);
  const memoryUrl = page.url();
  await expect(
    page.getByRole("heading", { name: memoryTitle, exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("A still lake, good company, and a day worth keeping."),
  ).toBeVisible();
  await expect(page.locator(".photo-gallery img")).toBeVisible();
  await page
    .getByRole("button", { name: "View quiet-lake.jpg full size" })
    .click();
  await expect(page.getByRole("dialog", {name:"Photograph viewer"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", {name:"Photograph viewer"})).not.toBeVisible();
  await page
    .getByLabel("Caption", { exact: true })
    .fill("Lake, boat, and good company.");
  await page.getByRole("button", { name: "Save caption", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Caption saved." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add to favorites", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "In your favorites" }),
  ).toBeVisible();
  await page.goto("/memories?q=family&favorites=true");
  await expect(
    page.getByRole("heading", { name: memoryTitle, exact: true }),
  ).toBeVisible();
  await page.goto("/memories?q=zzzznomatchzzzz");
  await expect(page.getByText("No results match these filters.")).toBeVisible();
  await page.goto(memoryUrl + "/edit");
  await page
    .getByLabel("Give this moment a name")
    .fill(memoryTitle + " revisited");
  await page.getByRole("button", { name: "Save memory", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: memoryTitle + " revisited",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/stories/new");
  await page
    .getByLabel("Title", { exact: true })
    .fill(`The longer story ${run}`);
  await page
    .getByLabel("Your story", { exact: true })
    .fill("This chapter connects the smallest things.");
  await page.getByLabel("State", { exact: true }).selectOption("saved");
  await page.getByLabel(memoryTitle + " revisited", { exact: false }).check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/stories\/[a-f0-9-]+$/);
  const storyUrl = page.url();
  await expect(
    page.getByText("This chapter connects the smallest things."),
  ).toBeVisible();
  await page.goto("/settings");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export my archive" }).click();
  const download = await downloadEvent;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const tar = readFileSync(downloadPath!);
  expect(tar.includes(Buffer.from(memoryTitle))).toBeTruthy();
  expect(tar.includes(Buffer.from("photos/"))).toBeTruthy();
  expect(tar.subarray(-1024).every((n) => n === 0)).toBeTruthy();
  await page.goto(albumUrl);
  await expect(
    page.getByRole("heading", { name: memoryTitle + " revisited" }),
  ).toBeVisible();
  await page.locator(".danger-details summary").click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(/\/albums$/);
  await page.goto(memoryUrl);
  await expect(
    page.getByRole("heading", { name: memoryTitle + " revisited" }),
  ).toBeVisible();
  await page.goto(storyUrl);
  await page.locator(".danger-details summary").click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(/\/stories$/);
  await page.goto(memoryUrl);
  await page.locator(".danger-details summary").click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(/\/memories$/);
});

test("two accounts cannot read, mutate, relate or download one another’s content", async ({
  page,
}) => {
  const a = await api(0),
    b = await api(1);
  const id = randomUUID();
  const album = randomUUID();
  const created = await a
    .from("memories")
    .insert({
      id,
      user_id: accounts[0].id,
      title: `Private ${run}`,
      memory_date: "2020-02-02",
    });
  expect(created.error).toBeNull();
  const other = await b.from("memories").select("*").eq("id", id);
  expect(other.error).toBeNull();
  expect(other.data).toEqual([]);
  const changed = await b
    .from("memories")
    .update({ title: "Stolen" })
    .eq("id", id)
    .select();
  expect(changed.data).toEqual([]);
  const reassigned = await a
    .from("memories")
    .update({ user_id: accounts[1].id })
    .eq("id", id);
  expect(reassigned.error).not.toBeNull();
  const aAlbum = await b
    .from("albums")
    .insert({ id: album, user_id: accounts[1].id, title: "Other archive" });
  expect(aAlbum.error).toBeNull();
  const link = await b
    .from("album_memories")
    .insert({ user_id: accounts[1].id, album_id: album, memory_id: id });
  expect(link.error).not.toBeNull();
  const path = `${accounts[0].id}/${id}/${randomUUID().replaceAll("-", "")}.jpg`;
  const upload = await a.storage
    .from("memory-media")
    .upload(path, readFileSync("public/quiet-lake.jpg"), {
      contentType: "image/jpeg",
    });
  expect(upload.error).toBeNull();
  const stolen = await b.storage.from("memory-media").download(path);
  expect(stolen.error).not.toBeNull();
  const signed = await b.storage
    .from("memory-media")
    .createSignedUrl(path, 300);
  expect(signed.error).not.toBeNull();
  const anon = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  expect((await anon.from("memories").select("*")).error).not.toBeNull();
  await signIn(page, accounts[1]);
  await page.goto(`/memories/${id}`);
  await expect(
    page.getByRole("heading", { name: "This moment isn’t here." }),
  ).toBeVisible();
  const premature = await a.rpc("delete_own_account");
  expect(premature.error).not.toBeNull();
  expect(
    (await a.storage.from("memory-media").remove([path])).error,
  ).toBeNull();
  expect((await a.from("memories").delete().eq("id", id)).error).toBeNull();
  expect((await b.from("albums").delete().eq("id", album)).error).toBeNull();
});

test("responsive navigation, long text, theme persistence and reduced motion", async ({
  page,
}) => {
  await signIn(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [360, 390, 768, 1024, 1366, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/home");
    await expect(
      page.getByRole("heading", { name: /Welcome back/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${width}px home overflow`,
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
    for (const path of [
      "/timeline",
      "/memories",
      "/albums",
      "/stories",
      "/places",
      "/memories/new",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${path} overflow`,
      ).toBeTruthy();
    }
    if (width < 1200) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(
        page
          .locator(".mobile-nav")
          .getByRole("link", { name: "Timeline", exact: true }),
      ).toBeVisible();
      await page
        .locator(".mobile-nav")
        .getByRole("link", { name: "Timeline", exact: true })
        .click();
      await expect(page).toHaveURL(/\/timeline$/);
    }
  }
  await page.goto("/home");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/home-light.png",
    fullPage: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/home");
  expect(
    await page
      .locator(".tilt").first()
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe("none");
  expect(errors).toEqual([]);
});
