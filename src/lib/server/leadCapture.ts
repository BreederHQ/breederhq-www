/**
 * Server-Side Lead Capture & Intelligence
 * Handles form submissions, enrichment, and notifications
 */

interface LeadData {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  role?: string;
  interest?: string;
  message?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface EnrichedLeadData extends LeadData {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  pageUrl?: string;
  timestamp: string;
  enrichment?: {
    company?: any;
    person?: any;
  };
}

/**
 * Capture and enrich lead data
 */
export async function captureLead(
  leadData: LeadData,
  request: Request
): Promise<EnrichedLeadData> {
  const enrichedData: EnrichedLeadData = {
    ...leadData,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip'),
    userAgent: request.headers.get('user-agent') || undefined,
    referrer: request.headers.get('referer') || undefined,
    pageUrl: request.url,
    timestamp: new Date().toISOString(),
  };

  // Enrich with Clearbit (if available)
  if (import.meta.env.CLEARBIT_SECRET_KEY && leadData.email) {
    try {
      enrichedData.enrichment = await enrichWithClearbit(leadData.email);
    } catch (error) {
      console.error('Clearbit enrichment failed:', error);
    }
  }

  // Send to all destinations in parallel
  await Promise.allSettled([
    sendToHubSpot(enrichedData),
    sendToSlack(enrichedData),
    sendToZapier(enrichedData),
    sendToCRM(enrichedData),
  ]);

  return enrichedData;
}

/**
 * Enrich lead data with Clearbit
 */
async function enrichWithClearbit(email: string) {
  const apiKey = import.meta.env.CLEARBIT_SECRET_KEY;
  if (!apiKey) return null;

  const response = await fetch(`https://person.clearbit.com/v2/combined/find?email=${email}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Clearbit API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send lead to HubSpot
 */
async function sendToHubSpot(lead: EnrichedLeadData) {
  const apiKey = import.meta.env.HUBSPOT_API_KEY;
  if (!apiKey) return;

  const hubspotData = {
    properties: {
      email: lead.email,
      firstname: lead.name?.split(' ')[0],
      lastname: lead.name?.split(' ').slice(1).join(' '),
      phone: lead.phone,
      company: lead.company || lead.enrichment?.company?.name,
      jobtitle: lead.role || lead.enrichment?.person?.employment?.title,
      message: lead.message,
      lead_source: lead.source,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
    },
  };

  try {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts?hapikey=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hubspotData),
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`);
    }

    console.log('✅ Lead sent to HubSpot');
  } catch (error) {
    console.error('❌ HubSpot error:', error);
  }
}

/**
 * Send notification to Slack
 */
async function sendToSlack(lead: EnrichedLeadData) {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const companyInfo = lead.enrichment?.company;
  const personInfo = lead.enrichment?.person;

  const message = {
    text: '🎯 New Lead Captured!',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎯 New Lead from BreederHQ.com',
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name:*\n${lead.name || 'N/A'}` },
          { type: 'mrkdwn', text: `*Email:*\n${lead.email}` },
          { type: 'mrkdwn', text: `*Phone:*\n${lead.phone || 'N/A'}` },
          { type: 'mrkdwn', text: `*Company:*\n${lead.company || companyInfo?.name || 'N/A'}` },
        ],
      },
      ...(lead.message ? [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${lead.message}`,
        },
      }] : []),
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Source:*\n${lead.source || 'Direct'}` },
          { type: 'mrkdwn', text: `*UTM Campaign:*\n${lead.utm_campaign || 'N/A'}` },
        ],
      },
      ...(companyInfo ? [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Company Insights:*\n• ${companyInfo.metrics?.employees || 'Unknown'} employees\n• ${companyInfo.category?.industry || 'Unknown'} industry\n• ${companyInfo.location || 'Unknown location'}`,
        },
      }] : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Page: ${lead.pageUrl} | IP: ${lead.ipAddress || 'Unknown'}`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    console.log('✅ Notification sent to Slack');
  } catch (error) {
    console.error('❌ Slack error:', error);
  }
}

/**
 * Send to Zapier (for additional integrations)
 */
async function sendToZapier(lead: EnrichedLeadData) {
  const webhookUrl = import.meta.env.ZAPIER_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook error: ${response.status}`);
    }

    console.log('✅ Lead sent to Zapier');
  } catch (error) {
    console.error('❌ Zapier error:', error);
  }
}

/**
 * Send to your CRM/Database
 */
async function sendToCRM(lead: EnrichedLeadData) {
  // TODO: Implement your CRM integration here
  // This could be your own API endpoint that stores leads in your database

  const apiUrl = import.meta.env.PUBLIC_APP_URL;
  if (!apiUrl) return;

  try {
    const response = await fetch(`${apiUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status}`);
    }

    console.log('✅ Lead sent to CRM');
  } catch (error) {
    console.error('❌ CRM error:', error);
  }
}

/**
 * Track high-value visitor (for visitor intelligence)
 */
export async function trackHighValueVisitor(request: Request) {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip');
  if (!ipAddress) return;

  // Use Clearbit Reveal API to identify company
  const apiKey = import.meta.env.CLEARBIT_SECRET_KEY;
  if (!apiKey) return;

  try {
    const response = await fetch(`https://reveal.clearbit.com/v1/companies/find?ip=${ipAddress}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const company = await response.json();

      // Check if high-value company (based on employee count, industry, etc.)
      const isHighValue =
        company.metrics?.employees > 50 ||
        company.metrics?.annualRevenue > 1000000;

      if (isHighValue) {
        // Send notification to Slack
        await sendHighValueVisitorNotification(company, request);
      }

      return company;
    }
  } catch (error) {
    console.error('Visitor tracking error:', error);
  }
}

/**
 * Send high-value visitor notification
 */
async function sendHighValueVisitorNotification(company: any, request: Request) {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = {
    text: '🔥 High-Value Visitor Alert!',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔥 High-Value Company Visiting Site',
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Company:*\n${company.name}` },
          { type: 'mrkdwn', text: `*Industry:*\n${company.category?.industry || 'Unknown'}` },
          { type: 'mrkdwn', text: `*Employees:*\n${company.metrics?.employees || 'Unknown'}` },
          { type: 'mrkdwn', text: `*Page:*\n${request.url}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Website:* ${company.domain}\n*Location:* ${company.location}`,
        },
      },
    ],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}
