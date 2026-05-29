/**
 * Contact Form API Endpoint
 * Handles form submissions with enrichment and multi-channel distribution
 */

import type { APIRoute } from 'astro';
import { processLead, type LeadData } from '../../lib/server/leadCapture';

export const prerender = false; // This endpoint requires SSR

const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;

function badRequest(error: string) {
  return new Response(JSON.stringify({ success: false, error }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clampString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const body = await request.json();

    // Server-side validation (mirrors client + acts as the source of truth)
    const email = clampString(body.email, 254)?.toLowerCase();
    if (!email) return badRequest('Email is required.');
    if (!EMAIL_RE.test(email)) return badRequest('Please enter a valid email address.');

    const name = clampString(body.name, 100);
    if (!name || name.length < 2 || !/\p{L}/u.test(name)) {
      return badRequest('Please enter your name.');
    }

    // Phone is optional but if provided must be plausible
    const phoneRaw = clampString(body.phone, 25);
    if (phoneRaw) {
      const digits = phoneRaw.replace(/\D/g, '');
      const isIntl = phoneRaw.startsWith('+');
      const valid = isIntl
        ? digits.length >= 7 && digits.length <= 15
        : digits.length === 10;
      if (!valid) return badRequest('Please enter a valid phone number.');
    }

    // Extract lead data
    const leadData: LeadData = {
      email,
      name,
      phone: phoneRaw,
      company: clampString(body.company, 120),
      message: clampString(body.message, 2000),
      interest: clampString(body.interest, 50),
      source: clampString(body.source, 50) || 'website_form',
      utm_source: clampString(body.utm_source, 100),
      utm_medium: clampString(body.utm_medium, 100),
      utm_campaign: clampString(body.utm_campaign, 100),
      utm_term: clampString(body.utm_term, 100),
      utm_content: clampString(body.utm_content, 100),
    };

    // Capture metadata from request
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    // Process lead (enrich + distribute)
    const enrichedLead = await processLead(leadData, {
      ip: ip || undefined,
      userAgent: userAgent || undefined,
      referrer: referrer || undefined,
    });

    console.log('✅ Lead processed successfully:', enrichedLead.email);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! We\'ll be in touch soon.',
        leadId: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

// Optional: Add OPTIONS for CORS if needed
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
