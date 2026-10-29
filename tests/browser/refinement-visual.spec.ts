import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("refinement layout, drawer focus, themes and motion at six widths", async ({page}) => {
  for (const width of [360,390,768,1024,1366,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.goto("/");
    await page.screenshot({path:`test-results/refined-welcome-${width}.png`,fullPage:true});
    expect.soft(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `welcome ${width}`).toBeTruthy();
    for (const path of ["home","timeline","memories","albums","stories","places","memories/flour-everywhere"]) {
      await page.goto(`/demo/${path}`);
      expect.soft(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${path} ${width}`).toBeTruthy();
    }
    await page.goto("/demo/home");
    await page.screenshot({path:`test-results/refined-demo-${width}.png`,fullPage:true});
    if(width<1200) {
      const trigger=page.getByRole("button",{name:"Open navigation"});
      await trigger.click();
      const dialog=page.getByRole("dialog",{name:"Archive navigation"});
      await expect.soft(dialog).toBeVisible();
      for(let i=0;i<10;i++) { await page.keyboard.press("Tab"); expect.soft(await dialog.evaluate(el=>el.contains(document.activeElement))).toBeTruthy(); }
      await page.keyboard.press("Escape");
      await expect.soft(trigger).toBeFocused();
    }
  }
  await page.getByRole("button",{name:"Switch color theme"}).click();
  await page.reload();
  await expect.soft(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.screenshot({path:"test-results/refined-demo-dark.png",fullPage:true});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/demo/home");
  expect.soft(await page.locator(".sample-intro > img").evaluate(el=>getComputedStyle(el).transform)).toBe("none");
  const [account]=JSON.parse(readFileSync(".env.test.local","utf8"));
  await page.goto("/login");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password",{exact:true}).fill(account.password);
  await page.getByRole("button",{name:"Sign in to your archive"}).click();
  await expect.soft(page).toHaveURL(/\/home$/);
  await page.getByRole("button",{name:"Switch color theme"}).click();
  for(const width of [360,390,768,1024,1366,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.goto("/memories/new");
    const date=await page.locator('[name="memory_date"]').boundingBox(), time=await page.locator('[name="memory_time"]').boundingBox();
    expect.soft(Math.abs(date!.y-time!.y)).toBeLessThan(2);
    expect.soft(await page.locator('[name="mood"]').evaluate(el=>getComputedStyle(el).fontSize)).toBe("16px");
    expect.soft(await page.locator('.title-label').evaluate(el=>getComputedStyle(el).fontSize)).toBe("14px");
    await expect.soft(page.getByRole("button",{name:"Preserve this memory"})).toBeInViewport();
    await page.screenshot({path:`test-results/refined-editor-${width}.png`,fullPage:true});
    expect.soft(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`editor ${width}`).toBeTruthy();
  }
  await page.getByRole("button",{name:"Switch color theme"}).click();
  await page.screenshot({path:"test-results/refined-editor-dark.png",fullPage:true});
  await page.setViewportSize({width:844,height:390});
  await page.goto("/memories/new");
  expect.soft((await page.locator(".editor-fields").boundingBox())!.height).toBeGreaterThanOrEqual(220);
});
