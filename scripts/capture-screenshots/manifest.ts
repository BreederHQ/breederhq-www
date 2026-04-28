/**
 * Screenshot manifest — single source of truth for product screenshots used on the marketing site.
 *
 * Each entry describes:
 *  - id: stable kebab-case key, used as filename and as the prop on <Screenshot id="..." />
 *  - url: relative path on the target environment (e.g. "/animals", "/breeding")
 *  - viewport: capture viewport size; pick from the presets below
 *  - waitFor: optional CSS selector that must be visible before capture (waits up to 15s)
 *  - clip: optional element selector to crop to (otherwise full page)
 *  - hideSelectors: optional CSS selectors to hide before capture (e.g. dev banners)
 *  - description: human-readable purpose; appears in alt text fallback and in the manifest report
 *  - usedOn: marketing pages where this screenshot is rendered (informational; helps refresh planning)
 *
 * Adding a new screenshot:
 *  1. Add an entry here.
 *  2. Run `npm run screenshots:capture` from breederhq-www.
 *  3. Commit the generated WebP + PNG under public/images/screenshots/.
 *  4. Reference it on a marketing page via <Screenshot id="..." />.
 */

export type Viewport =
  | "desktop" // 1440x900 — primary marketing default
  | "desktop-tall" // 1440x1800 — for full-page hero shots
  | "laptop" // 1280x800 — comparison/secondary
  | "tablet" // 834x1112
  | "mobile"; // 390x844 — iPhone-class

export const VIEWPORTS: Record<Viewport, { width: number; height: number; deviceScaleFactor: number }> = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  "desktop-tall": { width: 1440, height: 1800, deviceScaleFactor: 1 },
  laptop: { width: 1280, height: 800, deviceScaleFactor: 1 },
  tablet: { width: 834, height: 1112, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 1 },
};

export interface ScreenshotEntry {
  id: string;
  url: string;
  viewport: Viewport;
  waitFor?: string;
  clip?: string;
  hideSelectors?: string[];
  description: string;
  usedOn: string[];
  /** App host the URL is relative to. Defaults to "platform". */
  app?: "platform" | "marketplace" | "portal" | "admin";
  /**
   * Optional click-through steps to perform after navigation but before capture.
   * Each entry is a CSS or text selector (Playwright supports text= and role=).
   * Use this to open tabs, drawers, or modals that don't have a stable URL.
   */
  clicks?: string[];
  /**
   * Optional login override for this entry. By default the capture script logs in
   * once at startup as the breeder (screenshots@breederhq.com). Entries that need
   * a different user — e.g. a buyer viewing the portal — set loginAs to swap
   * credentials before navigation.
   */
  loginAs?: { email: string; password: string };
  /**
   * If true, this entry is captured manually (e.g. transient modals that
   * require interactive form input). The auto-capture script skips these.
   */
  manual?: boolean;
}

// Login credentials for each multi-species seed tenant. Used as `loginAs` on
// every horse/cat/etc. shot so the capture script switches accounts before
// navigating. Each tenant is independent — no shared user across them.
const HORSES_LOGIN = { email: "horses@breederhq.com", password: "Willow!Creek#2026" };

export const MANIFEST: ScreenshotEntry[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 2 — DECISION-DRIVING SHOTS
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: "platform-dashboard",
    url: "/",
    viewport: "desktop",
    waitFor: "main",
    description: "Platform dashboard — first thing a logged-in breeder sees",
    usedOn: ["index.astro", "for-breeders.astro"],
  },
  {
    id: "animals-list",
    url: "/animals",
    viewport: "desktop",
    waitFor: "main",
    description: "Animals list — the core inventory of dogs/cats/horses with breed, status, tags",
    usedOn: ["for-breeders.astro", "workflows/index.astro", "compare/breederhq-vs-spreadsheets.astro"],
  },
  {
    id: "breeding-plans-list",
    url: "/breeding",
    viewport: "desktop",
    waitFor: "main",
    description: "Breeding plans list — shows active plans with phase progress",
    usedOn: ["workflows/breeding-plans.astro", "workflows/breeding-cycles.astro", "for-breeders.astro"],
  },
  {
    id: "breeding-calendar",
    url: "/breeding/calendar",
    viewport: "desktop",
    waitFor: "main",
    description: "Breeding calendar — heat cycles, breed dates, expected birth dates",
    usedOn: ["workflows/breeding-cycles.astro", "workflows/heat-tracking.astro"],
  },
  {
    id: "offspring-list",
    url: "/offspring",
    viewport: "desktop",
    waitFor: "main",
    description: "Offspring/litter view — puppies with collar colors, placement state, buyer linked",
    usedOn: ["workflows/offspring-care.astro", "for-breeders.astro"],
  },
  {
    id: "contacts-list",
    url: "/contacts",
    viewport: "desktop",
    waitFor: "main",
    description: "Contacts list — buyers, prospects, vendors with marketplace activity",
    usedOn: ["workflows/client-management.astro"],
  },
  {
    id: "finance-invoices",
    url: "/finance/invoices",
    viewport: "desktop",
    waitFor: "main",
    description: "Finance / invoices — paid invoices for puppy sales with deposit + balance",
    usedOn: ["workflows/invoicing-expenses.astro"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // BATCH A — Detail-page depth shots
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: "animal-detail-overview",
    url: "/animals?animalId=280", // Willow — detail drawer opens via query param
    viewport: "desktop-tall",
    waitFor: "main",
    description: "Animal detail — Willow's overview with breed, DOB, microchip, photo, status",
    usedOn: ["for-breeders.astro", "compare/breederhq-vs-spreadsheets.astro", "dogs.astro"],
  },
  {
    id: "animal-pedigree",
    url: "/animals?animalId=280",
    viewport: "desktop",
    waitFor: "main",
    clicks: ['button:has-text("Lineage"), [role="tab"]:has-text("Lineage")'],
    description: "Animal pedigree (Lineage tab) — family tree with COI",
    usedOn: ["workflows/pedigrees.astro", "for-breeders.astro"],
  },
  {
    id: "animal-genetics",
    url: "/animals?animalId=280",
    viewport: "desktop",
    waitFor: "main",
    clicks: ['button:has-text("Genetics"), [role="tab"]:has-text("Genetics")'],
    description: "Animal genetics — coat color loci + health panel results",
    usedOn: ["workflows/genetics-and-health-testing.astro", "workflows/breeding-intelligence.astro", "workflows/scout-ai.astro"],
  },
  // Removed: animal-health-records
  // The Health tab counts AnimalTraitValue rows (not VaccinationRecord), and
  // the screenshots-demo seed only populates VaccinationRecord. The tab renders
  // as 0/N for every section, which is not marketing-quality. Re-add once the
  // seed creates AnimalTraitValue entries for Willow's vaccines + screenings.
  {
    // Captured manually — this is the New Breeding Plan modal showing live
    // COI calculation + genetic carrier conflict detection as the user
    // picks Dam and Sire. Not auto-captureable because it requires opening
    // a modal and filling form fields. Re-capture by hand if the modal UI changes.
    id: "breeding-intelligence",
    url: "(manual capture — New Breeding Plan modal with COI + carrier panel)",
    viewport: "desktop",
    waitFor: "main",
    description: "New Breeding Plan modal — live COI risk + genetic carrier conflict detection",
    usedOn: ["workflows/breeding-intelligence.astro"],
    manual: true,
  },
  {
    id: "breeding-plan-buyers",
    url: "/breeding?planId=240",
    viewport: "desktop",
    waitFor: "main",
    clicks: ['button:has-text("Buyers"), [role="tab"]:has-text("Buyers")'],
    description: "Breeding plan buyers tab — waitlist linked to the plan with deposit status",
    usedOn: ["workflows/waitlists-and-placement.astro"],
  },
  {
    id: "contact-detail",
    url: "/contacts",
    viewport: "desktop-tall",
    waitFor: "main",
    clicks: ['text=Sarah Johnson'],
    description: "Contact detail — Sarah Johnson with linked puppy, invoices, conversations",
    usedOn: ["workflows/client-management.astro", "for-breeders.astro"],
  },
  {
    id: "sales-pipeline",
    url: "/contacts",
    viewport: "desktop",
    waitFor: "main",
    clicks: ['text=Sales Pipeline'],
    description: "Sales pipeline — deals across stages (inquiry, viewing, negotiation)",
    usedOn: ["workflows/client-management.astro"],
  },
  {
    id: "invoice-detail",
    url: "/finance/invoices",
    viewport: "desktop-tall",
    waitFor: "main",
    clicks: ['text=INV-2026-001'],
    description: "Invoice detail — line items, deposit + balance, payment history",
    usedOn: ["workflows/invoicing-expenses.astro"],
  },
  {
    id: "finance-dashboard",
    url: "/finance",
    viewport: "desktop",
    waitFor: "main",
    description: "Finance dashboard — MTD revenue, expenses, outstanding balances, recent invoices",
    usedOn: ["workflows/invoicing-expenses.astro", "for-breeders.astro"],
  },
  {
    id: "comms-hub-inbox",
    url: "/marketing/hub",
    viewport: "desktop",
    waitFor: "main",
    description: "Comms hub — buyer message threads (Sarah, Olivia conversations)",
    usedOn: ["workflows/communications-hub.astro", "for-breeders.astro"],
  },
  {
    id: "waitlist-list",
    url: "/waitlist/pending",
    viewport: "desktop",
    waitFor: "main",
    description: "Waitlist — pending buyers awaiting review with linked breeding plans",
    usedOn: ["workflows/waitlists-and-placement.astro"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // BATCH A — Marketplace + Portal
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: "marketplace-breeder-profile",
    url: "/breeders/screenshots-demo",
    viewport: "desktop-tall",
    app: "marketplace",
    waitFor: "main",
    description: "Public Cedar Ridge breeder profile in marketplace — bio, badges, listings",
    usedOn: ["index.astro", "for-breeders.astro", "buyers/why-breederhq-marketplace.astro", "find-breeders/dogs.astro"],
    // Hide the "Other verified breeders" cross-link footer — it surfaces
    // the validation/themed seed tenants (Seven Kingdoms, Riverdell) which
    // look unprofessional in marketing material.
    hideSelectors: ['section[aria-label*="Other verified"]'],
  },
  {
    id: "portal-buyer-home",
    url: "/",
    app: "portal",
    viewport: "desktop",
    waitFor: "main",
    description: "Buyer portal Overview — Sarah's dashboard branded as Cedar Ridge Kennels",
    usedOn: ["workflows/client-portal.astro", "for-breeders.astro", "buyers/index.astro"],
    loginAs: { email: "sarah.johnson@example.com", password: "Maple!Pup#2026" },
  },
  {
    id: "portal-buyer-animals",
    url: "/offspring",
    app: "portal",
    viewport: "desktop",
    waitFor: "main",
    description: "Buyer portal — My Animals — Sarah viewing her placed puppy Maple",
    usedOn: ["workflows/client-portal.astro", "for-breeders.astro", "buyers/index.astro"],
    loginAs: { email: "sarah.johnson@example.com", password: "Maple!Pup#2026" },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // HORSES — Willow Creek Equine (horses-demo tenant)
  //   These shots login as horses@breederhq.com (different tenant from dogs).
  //   Detail-page URLs use Animal/Plan IDs from horses-demo — IDs are looked
  //   up after seed runs via `npm run db:dev:seed:horses` + print-horse-ids.ts.
  // ───────────────────────────────────────────────────────────────────────────

  {
    id: "horse-platform-dashboard",
    url: "/",
    viewport: "desktop",
    waitFor: "main",
    description: "Horse breeder dashboard — Willow Creek Equine, Quarter Horse program",
    usedOn: ["horses.astro"],
    loginAs: HORSES_LOGIN,
  },
  {
    id: "horse-animals-list",
    url: "/animals",
    viewport: "desktop",
    waitFor: "main",
    description: "Horse animals list — mares, stallions, foals with breed + status",
    usedOn: ["horses.astro", "find-breeders/horses.astro"],
    loginAs: HORSES_LOGIN,
  },
  {
    id: "horse-breeding-plans-list",
    url: "/breeding",
    viewport: "desktop",
    waitFor: "main",
    description: "Horse breeding plans — AI breeding plan in pregnant phase + completed foaling",
    usedOn: ["horses.astro", "workflows/breeding-plans.astro"],
    loginAs: HORSES_LOGIN,
  },
  {
    id: "horse-breeding-plan-journey",
    url: "/breeding?planId=242", // DAK-2026-01 (Dakota × Cimarron)
    viewport: "desktop-tall",
    waitFor: "main",
    description: "Horse 8-phase breeding plan journey — AI breeding, ~120 days into 340-day gestation",
    usedOn: ["horses.astro", "workflows/breeding-intelligence.astro"],
    loginAs: HORSES_LOGIN,
  },
  {
    id: "horse-animal-detail",
    url: "/animals?animalId=292", // Dakota
    viewport: "desktop-tall",
    waitFor: "main",
    description: "Horse detail drawer — Dakota the broodmare with breed, DOB, microchip, status",
    usedOn: ["horses.astro"],
    loginAs: HORSES_LOGIN,
  },
  {
    id: "horse-animal-pedigree",
    url: "/animals?animalId=292", // Dakota
    viewport: "desktop",
    waitFor: "main",
    clicks: ['button:has-text("Lineage"), [role="tab"]:has-text("Lineage")'],
    description: "Horse pedigree (Lineage tab) — three-generation Quarter Horse family tree",
    usedOn: ["horses.astro", "workflows/pedigrees.astro"],
    loginAs: HORSES_LOGIN,
  },
  {
    id: "horse-animal-titles",
    url: "/animals?animalId=293", // Sienna
    viewport: "desktop",
    waitFor: "main",
    clicks: ['button:has-text("Titles"), [role="tab"]:has-text("Titles")'],
    description: "Horse titles tab — AQHA, NRHA, ROM achievements with event names + dates",
    usedOn: ["horses.astro"],
    loginAs: HORSES_LOGIN,
  },
  {
    id: "horse-marketplace-profile",
    url: "/breeders/horses-demo",
    viewport: "desktop-tall",
    app: "marketplace",
    waitFor: "main",
    description: "Public Willow Creek Equine marketplace profile — Quarter Horse breeder",
    usedOn: ["horses.astro", "find-breeders/horses.astro"],
    // Marketplace profile is public — no loginAs needed.
    // Hide the "Other verified breeders" footer — it surfaces validation
    // tenants (Seven Kingdoms, Riverdell) which look unprofessional in
    // marketing material.
    hideSelectors: ['section[aria-label*="Other verified"]'],
  },
];

export const MANIFEST_BY_ID: Record<string, ScreenshotEntry> = MANIFEST.reduce(
  (acc, entry) => {
    if (acc[entry.id]) {
      throw new Error(`Duplicate screenshot id: ${entry.id}`);
    }
    acc[entry.id] = entry;
    return acc;
  },
  {} as Record<string, ScreenshotEntry>,
);
