/**
 * Founders intro-call check-in relay.
 *
 * The answer page an applicant reaches from her day-before email posts her
 * "I'll Be There" or "I Need A New Time" here. The work lives in
 * relayIntroCallAnswer (src/lib/server/introCallAnswerRelay.ts), which this
 * route hands its environment and the caller's address so the relay itself
 * reads neither and can be tested.
 */

import type { APIContext, APIRoute } from 'astro';
import { relayIntroCallAnswer } from '../../lib/server/introCallAnswerRelay';

export const prerender = false; // This endpoint requires SSR

/**
 * The caller's address for the flood brake: Astro's clientAddress, which the
 * site's adapter (@astrojs/vercel) supplies. On Vercel the edge writes
 * x-forwarded-for itself, so the first entry is the connecting address and not
 * the caller's choice. Raw request headers are deliberately not read here. The
 * getter throws when the adapter has no address; the relay then puts the caller
 * in its shared no-address bucket, and its all-callers cap holds either way.
 */
function clientAddressOf(context: APIContext): string | undefined {
  try {
    return context.clientAddress || undefined;
  } catch {
    return undefined;
  }
}

export const POST: APIRoute = (context) =>
  relayIntroCallAnswer(context.request, {
    apiUrl: import.meta.env.PLATFORM_API_URL,
    secret: import.meta.env.MARKETING_LEAD_SECRET,
    clientIp: clientAddressOf(context),
  });
