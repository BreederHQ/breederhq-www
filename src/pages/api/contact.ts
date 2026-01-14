/**
 * Contact Form API Endpoint
 * Handles form submissions with enrichment and multi-channel distribution
 */

import type { APIRoute } from 'astro';
import { processLead, type LeadData } from '../../lib/server/leadCapture';

export const prerender = false; // This endpoint requires SSR

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Extract lead data
    const leadData: LeadData = {
      email: body.email,
      name: body.name,
      phone: body.phone,
      company: body.company,
      message: body.message,
      source: body.source || 'website_form',
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      utm_term: body.utm_term,
      utm_content: body.utm_content,
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
