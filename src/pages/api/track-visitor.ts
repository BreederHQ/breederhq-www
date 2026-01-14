/**
 * Visitor Intelligence API Endpoint
 * Identifies high-value visitors and sends notifications
 */

import type { APIRoute } from 'astro';
import { trackHighValueVisitor } from '../../lib/server/leadCapture';

export const POST: APIRoute = async ({ request }) => {
  try {
    const company = await trackHighValueVisitor(request);

    return new Response(
      JSON.stringify({
        success: true,
        company: company || null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Visitor tracking error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track visitor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
