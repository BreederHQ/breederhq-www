/**
 * Founders tour "one thing" relay.
 *
 * The booked-tour card on /pricing posts the applicant's answer here. The work
 * lives in relayTourFocus (src/lib/server/tourFocusRelay.ts), which this route
 * hands its environment and the caller's address so the relay itself reads
 * neither and can be tested.
 *
 * The answer is the applicant's own words and is never logged.
 */

import type { APIContext, APIRoute } from 'astro';
import { relayTourFocus } from '../../lib/server/tourFocusRelay';

export const prerender = false; // This endpoint requires SSR

/**
 * The caller's address for the flood brake: Astro's clientAddress, which the
 * site's adapter (@astrojs/vercel) supplies. It reads the first
 * x-forwarded-for value and keeps it only when it is shaped like an IP. On
 * Vercel the edge writes that header itself, replacing any value the client
 * sent, so the first entry is the connecting address and not the caller's
 * choice. Raw request headers are deliberately not read here: off the Vercel
 * edge they are whatever the caller sent. The getter throws when the adapter
 * has no address; the relay then puts the caller in its shared no-address
 * bucket, and its all-callers cap holds either way.
 */
function clientAddressOf(context: APIContext): string | undefined {
  try {
    return context.clientAddress || undefined;
  } catch {
    return undefined;
  }
}

export const POST: APIRoute = (context) =>
  relayTourFocus(context.request, {
    apiUrl: import.meta.env.PLATFORM_API_URL,
    secret: import.meta.env.MARKETING_LEAD_SECRET,
    clientIp: clientAddressOf(context),
  });
