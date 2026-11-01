// Rebuild the static browser and sharing assets from the existing brand and licensed samples.
// Run: node scripts/generate-brand-assets.mjs (requires system Chromium).
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const app = new URL('src/app/', root);
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#211c19"/><g transform="rotate(-5 32 32)" stroke="#c4a087" stroke-width="3"><rect x="14" y="14" width="15" height="15" rx="1" fill="none"/><rect x="35" y="14" width="15" height="15" rx="1" fill="#c4a087"/><rect x="14" y="35" width="15" height="15" rx="1" fill="none" opacity=".55"/><rect x="35" y="35" width="15" height="15" rx="1" fill="none"/></g></svg>`;
await writeFile(new URL('icon.svg', app), mark);
await sharp(Buffer.from(mark)).resize(180, 180).png().toFile(fileURLToPath(new URL('apple-icon.png', app)));
const png = await sharp(Buffer.from(mark)).resize(32, 32).png().toBuffer();
const ico = Buffer.alloc(22); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4); ico[6]=32; ico[7]=32; ico.writeUInt16LE(1,10); ico.writeUInt16LE(32,12); ico.writeUInt32LE(png.length,14); ico.writeUInt32LE(22,18);
await writeFile(new URL('favicon.ico', app), Buffer.concat([ico,png]));
const data = async (path, type) => `data:${type};base64,${(await readFile(new URL(path,root))).toString('base64')}`;
const serif = await data('public/fonts/font-4.ttf','font/ttf');
const sans = await data('public/fonts/font-0.ttf','font/ttf');
const dinner = await data('public/samples/dinner-1280.webp','image/webp');
const beach = await data('public/samples/beach-1280.webp','image/webp');
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'});
try {
 const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await page.setContent(`<style>@font-face{font-family:Caslon;src:url(${serif})}@font-face{font-family:DM;src:url(${sans})}*{box-sizing:border-box}body{margin:0;background:#eee6d9;color:#211c19;overflow:hidden}.canvas{width:1200px;height:630px;position:relative;padding:66px 70px}.brand{display:flex;align-items:center;gap:14px;font:34px DM}.brand svg{width:43px;height:43px}.dot{color:#9b7052}h1{font:88px/.98 Caslon;letter-spacing:-2px;margin:73px 0 0;width:590px;font-weight:400}.sub{font:20px/1.5 DM;color:#625044;margin-top:25px;width:410px}.print{position:absolute;background:#faf6ee;padding:13px 13px 43px;box-shadow:0 18px 38px #211c1926}.print img{width:100%;height:100%;object-fit:cover}.back{width:285px;height:330px;right:68px;top:58px;transform:rotate(9deg)}.front{width:320px;height:300px;right:138px;top:276px;transform:rotate(-8deg)}.line{position:absolute;bottom:47px;left:70px;width:58px;height:3px;background:#9b7052}</style><div class="canvas"><div class="brand">${mark}<span>MemoChro<span class="dot">.</span></span></div><h1>Your life,<br>through time.</h1><p class="sub">A private home for the moments<br>that make a life.</p><div class="print back"><img src="${beach}"/></div><div class="print front"><img src="${dinner}"/></div><div class="line"></div></div>`);
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 await page.screenshot({path:fileURLToPath(new URL('opengraph-image.png',app))});
} finally {await browser.close();}
await writeFile(new URL('opengraph-image.alt.txt',app),'MemoChro — Your life, through time. Photographic prints of friends sharing dinner and walking by the sea.\n');
