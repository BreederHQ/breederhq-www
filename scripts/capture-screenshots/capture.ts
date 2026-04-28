/**
 * Screenshot capture pipeline.
 *
 * Logs in to the configured environment as the screenshots-demo tenant, walks the manifest,
 * captures each entry at 2x DPI, and writes WebP + PNG outputs to public/images/screenshots/.
 *
 * Usage:
 *   npm run screenshots:capture                    # all entries
 *   npm run screenshots:capture -- --id=platform-dashboard
 *   npm run screenshots:capture -- --env=dev
 *
 * Env vars (with defaults):
 *   SCREENSHOT_ENV          = "dev"   (dev | local)
 *   SCREENSHOT_PLATFORM_URL = https://app-dev.breederhq.com
 *   SCREENSHOT_MARKETPLACE_URL = https://marketplace-dev.breederhq.com
 *   SCREENSHOT_PORTAL_URL   = https://portal-dev.breederhq.com
 *   SCREENSHOT_ADMIN_URL    = https://admin-dev.breederhq.com
 *   SCREENSHOT_LOGIN_URL    = https://accounts-dev.breederhq.com/login
 *   SCREENSHOT_EMAIL        = screenshots@breederhq.com
 *   SCREENSHOT_PASSWORD     = Cedar!Ridge#2026  (matches seed-screenshots-demo.ts;
 *                              override only if you re-seeded with a different password)
 *   SCREENSHOT_TENANT_SLUG  = screenshots-demo
 */

import { chromium, type Browser, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { MANIFEST, MANIFEST_BY_ID, VIEWPORTS, type ScreenshotEntry } from "./manifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const OUTPUT_ROOT = join(REPO_ROOT, "public", "images", "screenshots");

interface Args {
  ids: string[];
  env: "dev" | "local";
  dryRun: boolean;
}

function parseArgs(): Args {
  const args: Args = { ids: [], env: "local", dryRun: false };
  for (const raw of process.argv.slice(2)) {
    if (raw.startsWith("--id=")) args.ids.push(raw.slice("--id=".length));
    else if (raw.startsWith("--env=")) {
      const v = raw.slice("--env=".length);
      if (v === "dev" || v === "local") args.env = v;
      else throw new Error(`Unknown --env=${v} (expected dev|local)`);
    } else if (raw === "--dry-run") args.dryRun = true;
  }
  return args;
}

function appBaseUrl(app: ScreenshotEntry["app"], env: Args["env"]): string {
  if (env === "local") {
    switch (app) {
      case "marketplace": return process.env.SCREENSHOT_MARKETPLACE_URL ?? "https://marketplace.breederhq.test";
      case "portal": return process.env.SCREENSHOT_PORTAL_URL ?? "https://portal.breederhq.test";
      case "admin": return process.env.SCREENSHOT_ADMIN_URL ?? "https://admin.breederhq.test";
      default: return process.env.SCREENSHOT_PLATFORM_URL ?? "https://app.breederhq.test";
    }
  }
  switch (app) {
    case "marketplace": return process.env.SCREENSHOT_MARKETPLACE_URL ?? "https://marketplace-dev.breederhq.com";
    case "portal": return process.env.SCREENSHOT_PORTAL_URL ?? "https://portal-dev.breederhq.com";
    case "admin": return process.env.SCREENSHOT_ADMIN_URL ?? "https://admin-dev.breederhq.com";
    default: return process.env.SCREENSHOT_PLATFORM_URL ?? "https://app-dev.breederhq.com";
  }
}

function loginUrlFor(env: Args["env"]): string {
  return process.env.SCREENSHOT_LOGIN_URL
    ?? (env === "local"
      ? "https://accounts.breederhq.test/login"
      : "https://accounts-dev.breederhq.com/login");
}

async function login(page: Page, env: Args["env"], email: string, password: string): Promise<void> {
  await page.goto(loginUrlFor(env), { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for the post-login redirect to settle on any of the BHQ subdomains.
  await page.waitForLoadState("networkidle", { timeout: 30_000 });
}

async function logout(page: Page, env: Args["env"]): Promise<void> {
  // Clear cookies + storage for all BHQ origins so the next login starts fresh.
  // accounts-dev sets the auth cookie at .breederhq.com scope, so clearing context
  // cookies is sufficient — no need to call /logout endpoints per app.
  const context = page.context();
  await context.clearCookies();
  // Best-effort storage clear on the login origin.
  try {
    await page.goto(loginUrlFor(env), { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
}

async function captureEntry(page: Page, entry: ScreenshotEntry, env: Args["env"]): Promise<Buffer> {
  const viewport = VIEWPORTS[entry.viewport];
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  const fullUrl = new URL(entry.url, appBaseUrl(entry.app ?? "platform", env));
  fullUrl.searchParams.set("screenshot", "1");
  await page.goto(fullUrl.toString(), { waitUntil: "domcontentloaded" });

  if (entry.waitFor) {
    await page.waitForSelector(entry.waitFor, { state: "visible", timeout: 15_000 });
  }
  // Belt-and-suspenders: give animations and lazy images a moment to settle.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(500);

  // Optional click-through (open tabs, drawers, etc.)
  if (entry.clicks?.length) {
    for (const sel of entry.clicks) {
      try {
        await page.locator(sel).first().click({ timeout: 5_000 });
        await page.waitForTimeout(400);
      } catch (err) {
        console.warn(`    click failed for "${sel}": ${(err as Error).message}`);
      }
    }
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    // Wait for any "Loading..." indicators to disappear before capture. Lineage,
    // Genetics, Titles tabs all fetch data after the click — without this we
    // sometimes capture a half-rendered "Loading..." view.
    await page
      .waitForFunction(
        () => !document.body.innerText.match(/^\s*Loading\.\.\.\s*$/m),
        null,
        { timeout: 8_000 },
      )
      .catch(() => {});
    await page.waitForTimeout(800);
  }

  if (entry.hideSelectors?.length) {
    // Use display:none so the element is fully removed from layout (collapses
    // its space) — visibility:hidden would leave a blank gap. After hiding,
    // wait briefly for any reflow to settle before capture.
    await page.addStyleTag({
      content: entry.hideSelectors.map((s) => `${s} { display: none !important; }`).join("\n"),
    });
    await page.waitForTimeout(200);
  }

  if (entry.clip) {
    const handle = await page.waitForSelector(entry.clip, { timeout: 5_000 });
    return (await handle.screenshot({ type: "png", omitBackground: false })) as Buffer;
  }
  return (await page.screenshot({ fullPage: true, type: "png" })) as Buffer;
}

async function writeOutputs(entry: ScreenshotEntry, png: Buffer): Promise<{ webp: string; png: string }> {
  const dir = OUTPUT_ROOT;
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const pngPath = join(dir, `${entry.id}.png`);
  const webpPath = join(dir, `${entry.id}.webp`);

  await writeFile(pngPath, png);
  const webp = await sharp(png).webp({ quality: 85 }).toBuffer();
  await writeFile(webpPath, webp);

  return { webp: webpPath, png: pngPath };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const targets = args.ids.length
    ? args.ids.map((id) => {
        const entry = MANIFEST_BY_ID[id];
        if (!entry) throw new Error(`Unknown screenshot id: ${id}`);
        return entry;
      })
    : MANIFEST.filter((e) => !e.manual);

  if (args.dryRun) {
    console.log(`Would capture ${targets.length} screenshot(s) on env=${args.env}:`);
    for (const t of targets) console.log(`  - ${t.id} → ${appBaseUrl(t.app ?? "platform", args.env)}${t.url}`);
    return;
  }

  console.log(`Capturing ${targets.length} screenshot(s) on env=${args.env}...`);
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    // Force light theme. The marketing site (breederhq-www) is light-themed, so
    // every product screenshot embedded on it should also be light to avoid
    // visual whiplash. Apps store their theme preference in localStorage and
    // default to dark, so we seed the relevant keys before every navigation
    // via addInitScript — this runs before the ThemeProvider reads storage,
    // preventing a flash of dark theme on first paint.
    const context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: "light" });
    await context.addInitScript(() => {
      try {
        // Platform / Admin / Animals / Breeding / etc. share @bhq/ui ThemeProvider
        localStorage.setItem("bhq-theme", "light");
        // Portal uses its own ThemeContext with a different storage key
        localStorage.setItem("portal-theme", "light");
      } catch { /* ignore */ }
    });
    const page = await context.newPage();

    const defaultEmail = process.env.SCREENSHOT_EMAIL ?? "screenshots@breederhq.com";
    const defaultPassword = process.env.SCREENSHOT_PASSWORD ?? "Cedar!Ridge#2026";
    let currentEmail = defaultEmail;
    await login(page, args.env, defaultEmail, defaultPassword);

    for (const entry of targets) {
      const start = Date.now();
      try {
        // Re-login if this entry needs a different user than the current session.
        const targetEmail = entry.loginAs?.email ?? defaultEmail;
        const targetPassword = entry.loginAs?.password ?? defaultPassword;
        if (targetEmail !== currentEmail) {
          await logout(page, args.env);
          await login(page, args.env, targetEmail, targetPassword);
          currentEmail = targetEmail;
        }

        const png = await captureEntry(page, entry, args.env);
        const { webp, png: pngPath } = await writeOutputs(entry, png);
        console.log(`  OK ${entry.id} (${Date.now() - start}ms) → ${webp}, ${pngPath}`);
      } catch (err) {
        console.error(`  FAIL ${entry.id}: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    }
  } finally {
    if (browser) await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
