/**
 * Contact Form API Endpoint
 * Handles form submissions with lead capture and enrichment
 */

import type { APIRoute } from 'astro';
import { captureLead } from '../../lib/server/leadCapture';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.json();

    // Validate required fields
    if (!formData.email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Capture and process lead
    const enrichedLead = await captureLead(
      {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
        role: formData.role,
        interest: formData.interest,
        message: formData.message,
        source: formData.source || 'website_contact_form',
        utm_source: formData.utm_source,
        utm_medium: formData.utm_medium,
        utm_campaign: formData.utm_campaign,
        utm_term: formData.utm_term,
        utm_content: formData.utm_content,
      },
      request
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! We\'ll be in touch soon.',
        leadId: enrichedLead.timestamp,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
