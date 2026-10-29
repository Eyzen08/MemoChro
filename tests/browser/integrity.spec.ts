import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const accounts = JSON.parse(readFileSync(".env.test.local", "utf8")) as {
  id: string;
  email: string;
  password: string;
}[];
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .trim()
    .split(/\r?\n/)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
async function login(page: Page, index = 0) {
  const a = accounts[index];
  await page.goto("/login");
  await page.getByLabel("Email address").fill(a.email);
  await page.getByLabel("Password", { exact: true }).fill(a.password);
  await page.getByRole("button", { name: "Sign in to your archive" }).click();
  await expect(page).toHaveURL(/\/home$/);
}
async function api(index = 0) {
  const db = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } },
  );
  expect((await db.auth.signInWithPassword(accounts[index])).error).toBeNull();
  return db;
}

test("an association beyond the editor option limit survives an ordinary text edit", async ({
  page,
}) => {
  const db = await api();
  const id = randomUUID();
  const records = Array.from({ length: 501 }, (_, i) => ({
    id: randomUUID(),
    user_id: accounts[0].id,
    name:
      i === 500
        ? "zzzz Selected outside first page"
        : `000 QA pagination ${String(i).padStart(3, "0")}`,
  }));
  expect((await db.from("people").insert(records)).error).toBeNull();
  try {
    expect(
      (
        await db.rpc("save_memory", {
          p_id: id,
          p_data: {
            title: "Association regression",
            memory_date: "2020-01-01",
          },
          p_people: [records[500].id],
        })
      ).error,
    ).toBeNull();
    await login(page);
    await page.goto(`/memories/${id}/edit`);
    await expect(
      page.getByLabel(records[500].name, { exact: true }),
    ).toBeChecked();
    await page
      .getByLabel("Give this moment a name")
      .fill("Edited without losing a person");
    await page
      .getByRole("button", { name: "Save memory", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/memories/${id}$`));
    const links = await db
      .from("memory_people")
      .select("person_id")
      .eq("memory_id", id);
    expect(links.error).toBeNull();
    expect(links.data).toEqual([{ person_id: records[500].id }]);
  } finally {
    await db.from("memories").delete().eq("id", id);
    for (let i = 0; i < records.length; i += 100)
      expect(
        (
          await db
            .from("people")
            .delete()
            .in(
              "id",
              records.slice(i, i + 100).map((p) => p.id),
            )
        ).error,
      ).toBeNull();
  }
});

test("two tabs uploading the same image keep one complete original and preview", async ({
  page,
  context,
}) => {
  const db = await api();
  const id = randomUUID();
  expect(
    (
      await db
        .from("memories")
        .insert({
          id,
          user_id: accounts[0].id,
          title: "Concurrent upload regression",
          memory_date: "2020-02-02",
        })
    ).error,
  ).toBeNull();
  await login(page);
  const second = await context.newPage();
  await Promise.all([
    page.goto(`/memories/${id}/edit`),
    second.goto(`/memories/${id}/edit`),
  ]);
  await Promise.all([
    page.locator("input[type=file]").setInputFiles("public/quiet-lake.jpg"),
    second.locator("input[type=file]").setInputFiles("public/quiet-lake.jpg"),
  ]);
  await Promise.all([
    page.getByRole("button", { name: "Save memory", exact: true }).click(),
    second.getByRole("button", { name: "Save memory", exact: true }).click(),
  ]);
  await Promise.all([
    expect(page).toHaveURL(new RegExp(`/memories/${id}$`)),
    expect(second).toHaveURL(new RegExp(`/memories/${id}$`)),
  ]);
  const media = await db
    .from("memory_media")
    .select("path,preview_path")
    .eq("memory_id", id);
  expect(media.error).toBeNull();
  expect(media.data).toHaveLength(1);
  const files = [media.data![0].path, media.data![0].preview_path];
  for (const path of files) {
    const result = await db.storage.from("memory-media").download(path);
    expect(result.error).toBeNull();
    expect(result.data!.size).toBeGreaterThan(0);
  }
  expect(
    (await db.storage.from("memory-media").remove(files)).error,
  ).toBeNull();
  expect((await db.from("memories").delete().eq("id", id)).error).toBeNull();
  await second.close();
});

test("account deletion requires the password and removes data and media", async ({
  page,
}) => {
  test.skip(
    !process.env.TEST_ACCOUNT_DELETION,
    "Requires a freshly provisioned disposable third account.",
  );
  const db = await api(2);
  const id = randomUUID();
  const path = `${accounts[2].id}/${id}/${randomUUID().replaceAll("-", "")}.jpg`;
  expect(
    (
      await db
        .from("memories")
        .insert({
          id,
          user_id: accounts[2].id,
          title: "Disposable memory",
          memory_date: "2020-01-01",
        })
    ).error,
  ).toBeNull();
  expect(
    (
      await db.storage
        .from("memory-media")
        .upload(path, readFileSync("public/quiet-lake.jpg"), {
          contentType: "image/jpeg",
        })
    ).error,
  ).toBeNull();
  await login(page, 2);
  await page.goto("/settings");
  await page.locator(".danger-section summary").click();
  await page
    .getByLabel("Current password", { exact: true })
    .fill("DefinitelyWrongPassword123");
  await page.getByLabel("Type DELETE MY ACCOUNT").fill("DELETE MY ACCOUNT");
  await page
    .getByRole("button", { name: "Permanently delete my account" })
    .click();
  await expect(page.locator(".feedback.error")).toContainText(
    "Your password is incorrect.",
  );
  await page
    .getByLabel("Current password", { exact: true })
    .fill(accounts[2].password);
  await page
    .getByRole("button", { name: "Permanently delete my account" })
    .click();
  await expect(page).toHaveURL(/\/\?deleted=true$/);
  await expect(
    page.getByText("Your account and archive have been deleted."),
  ).toBeVisible();
  expect((await db.auth.getUser()).error).not.toBeNull();
  expect(
    (await db.storage.from("memory-media").download(path)).error,
  ).not.toBeNull();
  const rows = await db.from("memories").select("id").eq("id", id);
  expect(rows.data || []).toEqual([]);
});
