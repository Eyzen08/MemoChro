import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const [account] = JSON.parse(readFileSync(".env.test.local", "utf8")) as {
  email: string;
  password: string;
}[];

test("failed saves preserve memory text, tags, and story drafts", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in to your archive" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/memories/new");
  await page
    .getByLabel("Give this moment a name")
    .fill("Do not lose this memory");
  await page
    .getByLabel("The story behind it")
    .fill("A long reflection that must survive a failed save.");
  const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`).join(",");
  await page.getByLabel("Tags", { exact: true }).fill(tags);
  await page.getByRole("button", { name: "Preserve this memory" }).click();
  await expect(page.locator(".feedback.error")).toContainText(
    "Use up to 20 tags",
  );
  await expect(page.getByLabel("Give this moment a name")).toHaveValue(
    "Do not lose this memory",
  );
  await expect(page.getByLabel("The story behind it")).toHaveValue(
    "A long reflection that must survive a failed save.",
  );
  await expect(page.getByLabel("Tags", { exact: true })).toHaveValue(tags);
  page.once("dialog", dialog => dialog.accept());
  await page.goto("/stories/new");
  await page.getByLabel("Title", { exact: true }).fill("   ");
  await page
    .getByLabel("Your story", { exact: true })
    .fill("This draft must still be here after validation fails.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".feedback.error")).toContainText(
    "Title is required",
  );
  await expect(page.getByLabel("Your story", { exact: true })).toHaveValue(
    "This draft must still be here after validation fails.",
  );
});
