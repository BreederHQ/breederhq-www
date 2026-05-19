/**
 * Build-time data fetchers for marketplace embeds on the marketing site.
 *
 * Astro's static build runs these fetches at build time - no runtime cost,
 * no client JS needed. The marketing site stays fully static, but with live
 * marketplace data baked in.
 *
 * If the marketplace API is unreachable (e.g. local dev without an API
 * running, or transient network failure during deploy), these helpers return
 * empty arrays so the build doesn't fail. The pages render their static
 * fallback copy instead of breaker errors.
 */

const MARKETPLACE_API =
  process.env.MARKETPLACE_API_URL || "https://app.breederhq.com";

export interface BreederCard {
  tenantSlug: string;
  businessName: string;
  city: string | null;
  state: string | null;
  breeds: Array<{ name: string; species: string }>;
  logoUrl: string | null;
  bannerImageUrl: string | null;
  primarySpecies: string | null;
  /**
   * Profile Indicators (account-history facts) + provider self-attestations
   * surfaced on cards to lift CTR. None of these are BreederHQ editorial
   * judgments; see LEGAL-CLARITY-REMEDIATION-2026-06.
   */
  badges?: {
    quickResponder?: boolean;
    healthTesting?: boolean;
    experiencedBreeder?: boolean;
  };
  availabilityStatus?: {
    acceptingInquiries?: boolean;
    waitlistOpen?: boolean;
    availableNowCount?: number;
    upcomingLittersCount?: number;
  };
}

// CATTLE is the remaining stealth species and is intentionally excluded
// from the public marketplace surface. ALPACA and LLAMA were promoted to
// public 2026-05-07 and are included across the public www species and
// breeder-directory surfaces.
export type SpeciesKey =
  | "DOG"
  | "CAT"
  | "HORSE"
  | "GOAT"
  | "RABBIT"
  | "SHEEP"
  | "ALPACA"
  | "LLAMA";

/**
 * Fetch all public breeders, optionally filtered to a single species.
 * Empty array on any failure - caller is responsible for fallback copy.
 */
export async function fetchBreeders(
  species?: SpeciesKey,
): Promise<BreederCard[]> {
  try {
    const url = `${MARKETPLACE_API}/api/v1/marketplace/breeders`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: BreederCard[] };
    const all = data.items || [];
    if (!species) return all;
    // Both primarySpecies and breeds[].species can come back lowercase OR
    // PascalCase from the API depending on which model fed them. Normalize
    // both sides so 'dog' and 'Dog' match the SpeciesKey 'DOG'.
    const want = species.toUpperCase();
    return all.filter((b) => {
      const primary = (b.primarySpecies || '').toUpperCase();
      if (primary === want) return true;
      return (b.breeds || []).some(
        (br) => (br.species || '').toUpperCase() === want,
      );
    });
  } catch {
    return [];
  }
}
