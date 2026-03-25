import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const DIR = "./screenshots";

const pages = [
  { name: "home", path: "/" },
  { name: "sponsorship", path: "/sponsorship" },
  { name: "comments", path: "/comments" },
  { name: "titles", path: "/titles" },
  { name: "chat", path: "/chat" },
  { name: "settings", path: "/settings" },
];

const browser = await chromium.launch();

// Desktop viewport
for (const { name, path } of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // Set a fake Gemini key so ApiKeyGate doesn't block
  await page.addInitScript(() => {
    localStorage.setItem("creatoriq_gemini_key", "fake-key-for-screenshot");
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/${name}-desktop.png`, fullPage: true });
  console.log(`  ${name}-desktop.png`);
  await ctx.close();
}

// Mobile viewport
for (const { name, path } of pages) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("creatoriq_gemini_key", "fake-key-for-screenshot");
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/${name}-mobile.png`, fullPage: true });
  console.log(`  ${name}-mobile.png`);
  await ctx.close();
}

// Dark mode desktop
for (const { name, path } of pages) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("creatoriq_gemini_key", "fake-key-for-screenshot");
    localStorage.setItem("creatoriq_theme", "dark");
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/${name}-dark.png`, fullPage: true });
  console.log(`  ${name}-dark.png`);
  await ctx.close();
}

await browser.close();
console.log("\nDone! All screenshots saved to ./screenshots/");
