/**
 * Visitor Intelligence API Endpoint
 * Identifies high-value companies visiting the site
 */

import type { APIRoute } from 'astro';

export const prerender = false; // This endpoint requires SSR

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { page } = body;

    // Get visitor IP from request headers (works with SSR)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               request.headers.get('cf-connecting-ip') || // Cloudflare
               '';

    if (!ip) {
      console.log('No IP address found in request headers');
      return new Response(
        JSON.stringify({ success: false, message: 'IP address not available' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Try Clearbit Reveal first
    const clearbitKey = import.meta.env.CLEARBIT_SECRET_KEY;
    if (clearbitKey) {
      try {
        const response = await fetch(
          `https://reveal.clearbit.com/v1/companies/find?ip=${encodeURIComponent(ip)}`,
          {
            headers: {
              Authorization: `Bearer ${clearbitKey}`,
            },
          }
        );

        if (response.ok) {
          const companyData = await response.json();

          // Check if high-value company (50+ employees)
          const isHighValue = companyData.metrics?.employees >= 50;

          if (isHighValue) {
            // Send Slack alert for high-value visitors
            await sendHighValueAlert(companyData, page);
          }

          return new Response(
            JSON.stringify({
              success: true,
              company: companyData,
              isHighValue,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (error) {
        console.error('Clearbit Reveal error:', error);
      }
    }

    // Try Albacross (free tier) if Clearbit not available
    const albacrossKey = import.meta.env.ALBACROSS_API_KEY;
    if (albacrossKey) {
      // Albacross uses client-side tracking script primarily
      // This endpoint would be for server-side lookups if needed
      console.log('Albacross tracking via client-side script');
    }

    return new Response(
      JSON.stringify({
        success: true,
        company: null,
        message: 'Visitor tracked, no company identified',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error tracking visitor:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to track visitor',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Send Slack alert for high-value company visits
async function sendHighValueAlert(company: any, page: string) {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🔥 High-Value Company Visiting Site!',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Company:*\n${company.name || 'Unknown'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Industry:*\n${company.category?.industry || 'Unknown'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Employees:*\n${company.metrics?.employees || 'Unknown'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Location:*\n${company.geo?.city || 'Unknown'}, ${company.geo?.state || 'Unknown'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Page:*\n${page}`,
              },
              {
                type: 'mrkdwn',
                text: `*Website:*\n${company.domain ? `https://${company.domain}` : 'Unknown'}`,
              },
            ],
          },
        ],
      }),
    });

    console.log('✅ High-value visitor alert sent to Slack');
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

// Optional: Add OPTIONS for CORS
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
