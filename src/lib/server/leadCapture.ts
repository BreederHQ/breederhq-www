/**
 * Server-side Lead Capture & Enrichment
 * Handles form submissions, enriches data, and distributes to multiple channels
 */

export interface LeadData {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  message?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface EnrichedLead extends LeadData {
  enrichment?: {
    person?: {
      name?: string;
      jobTitle?: string;
      linkedIn?: string;
      location?: string;
    };
    company?: {
      name?: string;
      domain?: string;
      industry?: string;
      employees?: number;
      location?: string;
      revenue?: string;
    };
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  metadata?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    timestamp: string;
  };
}

interface ClearbitPersonResponse {
  id?: string;
  name?: {
    fullName?: string;
  };
  employment?: {
    title?: string;
    domain?: string;
  };
  linkedin?: {
    handle?: string;
  };
  location?: string;
}

interface ClearbitCompanyResponse {
  id?: string;
  name?: string;
  domain?: string;
  category?: {
    industry?: string;
  };
  metrics?: {
    employees?: number;
    estimatedAnnualRevenue?: string;
  };
  geo?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface ClearbitCombinedResponse {
  person?: ClearbitPersonResponse;
  company?: ClearbitCompanyResponse;
}

/**
 * Enrich lead with Clearbit person data
 */
export async function enrichWithClearbitPerson(email: string): Promise<ClearbitPersonResponse | null> {
  const clearbitKey = import.meta.env.CLEARBIT_SECRET_KEY;

  if (!clearbitKey) {
    console.log('⚠️ Clearbit not configured, skipping person enrichment');
    return null;
  }

  try {
    const response = await fetch(
      `https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${clearbitKey}`,
        },
      }
    );

    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      console.log('Clearbit person not found for:', email);
      return null;
    } else {
      console.error('Clearbit person enrichment failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Failed to enrich person with Clearbit:', error);
    return null;
  }
}

/**
 * Enrich lead with Clearbit company data
 */
export async function enrichWithClearbitCompany(domain: string): Promise<ClearbitCompanyResponse | null> {
  const clearbitKey = import.meta.env.CLEARBIT_SECRET_KEY;

  if (!clearbitKey) {
    console.log('⚠️ Clearbit not configured, skipping company enrichment');
    return null;
  }

  try {
    const response = await fetch(
      `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          Authorization: `Bearer ${clearbitKey}`,
        },
      }
    );

    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      console.log('Clearbit company not found for:', domain);
      return null;
    } else {
      console.error('Clearbit company enrichment failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Failed to enrich company with Clearbit:', error);
    return null;
  }
}

/**
 * Enrich lead with Clearbit combined API (person + company)
 */
export async function enrichWithClearbit(email: string): Promise<ClearbitCombinedResponse | null> {
  const clearbitKey = import.meta.env.CLEARBIT_SECRET_KEY;

  if (!clearbitKey) {
    console.log('⚠️ Clearbit not configured, skipping enrichment');
    return null;
  }

  try {
    const response = await fetch(
      `https://person.clearbit.com/v2/combined/find?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${clearbitKey}`,
        },
      }
    );

    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      console.log('Clearbit data not found for:', email);
      return null;
    } else {
      console.error('Clearbit enrichment failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Failed to enrich with Clearbit:', error);
    return null;
  }
}

/**
 * Send lead notification to Slack
 */
export async function sendToSlack(lead: EnrichedLead): Promise<boolean> {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('⚠️ Slack webhook not configured, skipping notification');
    return false;
  }

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🎯 New Lead Submitted!',
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${lead.name || 'Not provided'}` },
        { type: 'mrkdwn', text: `*Email:*\n${lead.email}` },
        { type: 'mrkdwn', text: `*Phone:*\n${lead.phone || 'Not provided'}` },
        { type: 'mrkdwn', text: `*Company:*\n${lead.company || lead.enrichment?.company?.name || 'Not provided'}` },
      ],
    },
  ];

  // Add message if provided
  if (lead.message) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Message:*\n${lead.message}`,
      },
    });
  }

  // Add enrichment data if available
  if (lead.enrichment?.company) {
    const company = lead.enrichment.company;
    const companyInfo: string[] = [];

    if (company.name) companyInfo.push(`*Company:* ${company.name}`);
    if (company.industry) companyInfo.push(`*Industry:* ${company.industry}`);
    if (company.employees) companyInfo.push(`*Employees:* ${company.employees}`);
    if (company.location) companyInfo.push(`*Location:* ${company.location}`);

    if (companyInfo.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Company Insights:*\n${companyInfo.join('\n')}`,
        },
      });
    }
  }

  if (lead.enrichment?.person?.jobTitle) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Job Title:* ${lead.enrichment.person.jobTitle}`,
      },
    });
  }

  // Add UTM attribution if available
  if (lead.utm?.source || lead.utm?.campaign) {
    const utmInfo: string[] = [];
    if (lead.utm.source) utmInfo.push(`*Source:* ${lead.utm.source}`);
    if (lead.utm.campaign) utmInfo.push(`*Campaign:* ${lead.utm.campaign}`);
    if (lead.utm.medium) utmInfo.push(`*Medium:* ${lead.utm.medium}`);

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Attribution:*\n${utmInfo.join('\n')}`,
      },
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error('Slack notification failed:', response.status, await response.text());
      return false;
    }

    console.log('✅ Slack notification sent');
    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

/**
 * Send email notification via Resend
 */
export async function sendToResend(lead: EnrichedLead): Promise<boolean> {
  const resendApiKey = import.meta.env.RESEND_API_KEY;
  const notificationEmail = import.meta.env.NOTIFICATION_EMAIL;

  if (!resendApiKey || !notificationEmail) {
    console.log('⚠️ Resend not configured, skipping email notification');
    return false;
  }

  const emailHtml = `
    <h2>🎯 New Lead from BreederHQ Website</h2>

    <h3>Contact Information:</h3>
    <ul>
      <li><strong>Name:</strong> ${lead.name || 'Not provided'}</li>
      <li><strong>Email:</strong> ${lead.email}</li>
      <li><strong>Phone:</strong> ${lead.phone || 'Not provided'}</li>
      <li><strong>Company:</strong> ${lead.company || lead.enrichment?.company?.name || 'Not provided'}</li>
    </ul>

    ${lead.message ? `
      <h3>Message:</h3>
      <p>${lead.message}</p>
    ` : ''}

    ${lead.enrichment?.person ? `
      <h3>Person Intelligence:</h3>
      <ul>
        ${lead.enrichment.person.jobTitle ? `<li><strong>Job Title:</strong> ${lead.enrichment.person.jobTitle}</li>` : ''}
        ${lead.enrichment.person.location ? `<li><strong>Location:</strong> ${lead.enrichment.person.location}</li>` : ''}
        ${lead.enrichment.person.linkedIn ? `<li><strong>LinkedIn:</strong> ${lead.enrichment.person.linkedIn}</li>` : ''}
      </ul>
    ` : ''}

    ${lead.enrichment?.company ? `
      <h3>Company Intelligence:</h3>
      <ul>
        ${lead.enrichment.company.name ? `<li><strong>Company:</strong> ${lead.enrichment.company.name}</li>` : ''}
        ${lead.enrichment.company.industry ? `<li><strong>Industry:</strong> ${lead.enrichment.company.industry}</li>` : ''}
        ${lead.enrichment.company.employees ? `<li><strong>Employees:</strong> ${lead.enrichment.company.employees}</li>` : ''}
        ${lead.enrichment.company.location ? `<li><strong>Location:</strong> ${lead.enrichment.company.location}</li>` : ''}
        ${lead.enrichment.company.domain ? `<li><strong>Website:</strong> ${lead.enrichment.company.domain}</li>` : ''}
      </ul>
    ` : ''}

    ${lead.utm?.source || lead.source ? `
      <h3>Source Information:</h3>
      <ul>
        <li><strong>Source:</strong> ${lead.source || 'Direct'}</li>
        ${lead.utm?.source ? `<li><strong>UTM Source:</strong> ${lead.utm.source}</li>` : ''}
        ${lead.utm?.campaign ? `<li><strong>UTM Campaign:</strong> ${lead.utm.campaign}</li>` : ''}
        ${lead.utm?.medium ? `<li><strong>UTM Medium:</strong> ${lead.utm.medium}</li>` : ''}
        ${lead.utm?.term ? `<li><strong>UTM Term:</strong> ${lead.utm.term}</li>` : ''}
        ${lead.utm?.content ? `<li><strong>UTM Content:</strong> ${lead.utm.content}</li>` : ''}
      </ul>
    ` : ''}

    <p><em>Received: ${lead.metadata?.timestamp || new Date().toISOString()}</em></p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'BreederHQ Leads <leads@mail.breederhq.com>',
        to: notificationEmail,
        subject: `🎯 New Lead: ${lead.name || lead.email}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      console.error('Resend email failed:', response.status, await response.text());
      return false;
    }

    console.log('✅ Email notification sent');
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

/**
 * Send lead to HubSpot CRM
 */
export async function sendToHubSpot(lead: EnrichedLead): Promise<boolean> {
  const hubspotApiKey = import.meta.env.HUBSPOT_API_KEY;

  if (!hubspotApiKey) {
    console.log('⚠️ HubSpot not configured, skipping');
    return false;
  }

  const nameParts = lead.name?.split(' ') || [];
  const firstname = nameParts[0] || '';
  const lastname = nameParts.slice(1).join(' ') || '';

  const contactData = {
    properties: {
      email: lead.email,
      firstname,
      lastname,
      phone: lead.phone || '',
      company: lead.company || lead.enrichment?.company?.name || '',
      message: lead.message || '',
      hs_lead_status: 'NEW',
      leadsource: lead.source || 'website',
      ...(lead.utm?.source && { utm_source: lead.utm.source }),
      ...(lead.utm?.campaign && { utm_campaign: lead.utm.campaign }),
      ...(lead.utm?.medium && { utm_medium: lead.utm.medium }),
      ...(lead.utm?.term && { utm_term: lead.utm.term }),
      ...(lead.utm?.content && { utm_content: lead.utm.content }),
      ...(lead.enrichment?.person?.jobTitle && { jobtitle: lead.enrichment.person.jobTitle }),
      ...(lead.enrichment?.company?.industry && { industry: lead.enrichment.company.industry }),
    },
  };

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hubspotApiKey}`,
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      console.error('HubSpot submission failed:', response.status, await response.text());
      return false;
    }

    console.log('✅ Lead sent to HubSpot');
    return true;
  } catch (error) {
    console.error('Failed to send to HubSpot:', error);
    return false;
  }
}

/**
 * Send lead to Zapier webhook
 */
export async function sendToZapier(lead: EnrichedLead): Promise<boolean> {
  const zapierWebhookUrl = import.meta.env.ZAPIER_WEBHOOK_URL;

  if (!zapierWebhookUrl) {
    console.log('⚠️ Zapier webhook not configured, skipping');
    return false;
  }

  try {
    const response = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lead,
        timestamp: lead.metadata?.timestamp || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Zapier webhook failed:', response.status, await response.text());
      return false;
    }

    console.log('✅ Lead sent to Zapier');
    return true;
  } catch (error) {
    console.error('Failed to send to Zapier:', error);
    return false;
  }
}

/**
 * Main function to process lead: enrich and distribute to all channels
 */
export async function processLead(
  leadData: LeadData,
  metadata?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
  }
): Promise<EnrichedLead> {
  console.log('📥 Processing lead:', leadData.email);

  // Prepare enriched lead object
  const enrichedLead: EnrichedLead = {
    ...leadData,
    utm: {
      source: leadData.utm_source,
      medium: leadData.utm_medium,
      campaign: leadData.utm_campaign,
      term: leadData.utm_term,
      content: leadData.utm_content,
    },
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  };

  // Step 1: Enrich with Clearbit
  try {
    const clearbitData = await enrichWithClearbit(leadData.email);

    if (clearbitData) {
      enrichedLead.enrichment = {
        person: clearbitData.person ? {
          name: clearbitData.person.name?.fullName,
          jobTitle: clearbitData.person.employment?.title,
          linkedIn: clearbitData.person.linkedin?.handle,
          location: clearbitData.person.location,
        } : undefined,
        company: clearbitData.company ? {
          name: clearbitData.company.name,
          domain: clearbitData.company.domain,
          industry: clearbitData.company.category?.industry,
          employees: clearbitData.company.metrics?.employees,
          location: clearbitData.company.geo
            ? `${clearbitData.company.geo.city || ''}, ${clearbitData.company.geo.state || ''}, ${clearbitData.company.geo.country || ''}`.trim()
            : undefined,
          revenue: clearbitData.company.metrics?.estimatedAnnualRevenue,
        } : undefined,
      };

      console.log('✅ Lead enriched with Clearbit data');
    }
  } catch (error) {
    console.error('Clearbit enrichment error:', error);
    // Continue processing even if enrichment fails
  }

  // Step 2: Distribute to all channels (run in parallel)
  const distributionPromises = [
    sendToSlack(enrichedLead),
    sendToResend(enrichedLead),
    sendToHubSpot(enrichedLead),
    sendToZapier(enrichedLead),
  ];

  const results = await Promise.allSettled(distributionPromises);

  // Log results
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  console.log(`✅ Lead distributed to ${successCount}/${results.length} channels`);

  return enrichedLead;
}
