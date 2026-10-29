import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

test("partial upload failure retains only remaining files and a retry completes without duplicates", async ({page}) => {
  const [account]=JSON.parse(readFileSync(".env.test.local","utf8"));
  const env=Object.fromEntries(readFileSync(".env.local","utf8").trim().split(/\r?\n/).map(line=>{const i=line.indexOf("=");return [line.slice(0,i),line.slice(i+1)];}));
  const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
  expect((await db.auth.signInWithPassword(account)).error).toBeNull();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password",{exact:true}).fill(account.password);
  await page.getByRole("button",{name:"Sign in to your archive"}).click();
  await expect(page).toHaveURL(/\/home$/);
  const before=await db.from("memories").select("id").order("id");
  await page.goto("/demo/memories?q=Maya");
  await expect(page.locator(".memory-card")).toHaveCount(3);
  expect((await db.from("memories").select("id").order("id")).data).toEqual(before.data);
  await page.goto("/memories?q=Sunday%2C%20with%20room%20for%20everyone");
  await expect(page.locator(".memory-card")).toHaveCount(0);
  await page.goto("/memories/new");
  const id=await page.locator('input[name="id"]').inputValue();
  try {
    await page.getByLabel("Give this moment a name").fill("Upload retry regression");
    await page.getByLabel("The story behind it").fill("Keep this reflection when the second upload fails.");
    await page.locator('input[type="file"]').setInputFiles(["public/quiet-lake.jpg","public/mountains.jpg"]);
    let uploads=0;
    await page.route("**/storage/v1/object/memory-media/**",async route=>{
      if(route.request().method()==="POST" && ++uploads===2) await route.abort("failed"); else await route.continue();
    });
    await page.getByRole("button",{name:"Preserve this memory"}).click();
    await expect(page.locator(".feedback.error")).toContainText("Your memory text was saved.");
    await expect(page.getByRole("button",{name:"Remove mountains.jpg"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Remove quiet-lake.jpg"})).toHaveCount(0);
    await expect(page.getByLabel("The story behind it")).toHaveValue("Keep this reflection when the second upload fails.");
    expect((await db.from("memory_media").select("id").eq("memory_id",id)).data).toHaveLength(1);
    await page.unroute("**/storage/v1/object/memory-media/**");
    await page.getByRole("button",{name:"Preserve this memory"}).click();
    await expect(page).toHaveURL(new RegExp(`/memories/${id}$`));
    await expect(page.locator(".photo-gallery figure")).toHaveCount(2);
    expect((await db.from("memory_media").select("id").eq("memory_id",id)).data).toHaveLength(2);
  } finally {
    const folder=`${account.id}/${id}`;
    const objects=await db.storage.from("memory-media").list(folder);
    if(objects.data?.length) expect((await db.storage.from("memory-media").remove(objects.data.map(o=>`${folder}/${o.name}`))).error).toBeNull();
    expect((await db.from("memories").delete().eq("id",id)).error).toBeNull();
    await db.auth.signOut();
  }
});
