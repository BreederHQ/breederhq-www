/**
 * Server-side Lead Capture & Enrichment
 * Handles form submissions, enriches data, and distributes to multiple channels
 */

export interface LeadData {
  email: string;
  name?: string;
  phone?: string;
  phone_e164?: string;
  company?: string;
  message?: string;
  interest?: string;
  interests?: string[];
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

const INTEREST_LABELS: Record<string, string> = {
  manage_breeding: 'Managing my breeding operation',
  offer_services: 'Offering my services to breeders',
  org_membership: 'Helping my organization or club manage membership & records',
  find_breeder: 'Finding a breeder or available animal',
  list_animals: 'Listing animals for sale',
  genetic_health: 'Genetic testing & health records',
  just_browsing: 'Just browsing / tell me more',
};

function formatInterest(interest?: string): string | undefined {
  if (!interest) return undefined;
  return INTEREST_LABELS[interest] || interest;
}

function formatInterests(lead: { interests?: string[]; interest?: string }): string[] {
  const list = lead.interests && lead.interests.length > 0
    ? lead.interests
    : lead.interest ? [lead.interest] : [];
  return list.map((v) => INTEREST_LABELS[v] || v);
}

function formatPhoneDisplay(lead: { phone?: string; phone_e164?: string }): string {
  return lead.phone || lead.phone_e164 || 'Not provided';
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

  // Add interests if provided (multi-select supported)
  const interestList = formatInterests(lead);
  if (interestList.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Interested in:*\n${interestList.map((i) => `• ${i}`).join('\n')}`,
      },
    });
  }

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
      body: JSON.stringify({
        text: `<!here> 🚨 New Lead Submitted\nName: ${lead.name || 'Not provided'}\nEmail: ${lead.email}`,
        blocks,
      }),
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
      <li><strong>Phone:</strong> ${formatPhoneDisplay(lead)}${lead.phone_e164 && lead.phone && lead.phone !== lead.phone_e164 ? ` <em>(${lead.phone_e164})</em>` : ''}</li>
      <li><strong>Company:</strong> ${lead.company || lead.enrichment?.company?.name || 'Not provided'}</li>
      ${(() => {
        const list = formatInterests(lead);
        return list.length > 0 ? `<li><strong>Interested in:</strong><ul>${list.map((i) => `<li>${i}</li>`).join('')}</ul></li>` : '';
      })()}
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
      ...((() => {
        const list = formatInterests(lead);
        return list.length > 0 ? { bhq_interest: list.join('; ') } : {};
      })()),
      ...(lead.phone_e164 ? { phone: lead.phone_e164 } : {}),
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
 * Send a thoughtful auto-reply to the lead's email address.
 * Only fires for sources we explicitly opt-in (avoids surprise emails on the
 * legacy /contact form). Tailors the body to the chosen "interest" if present.
 */
const AUTO_REPLY_SOURCES = new Set([
  'lets_connect',
  'lets_connect_form',
  'lets_connect_page',
]);

interface InterestFollowUp {
  headline: string;
  body: string;
  nextSteps: { label: string; url: string }[];
}

const INTEREST_FOLLOWUPS: Record<string, InterestFollowUp> = {
  manage_breeding: {
    headline: 'Running a breeding operation',
    body: "We built BreederHQ for the day-to-day reality of managing a serious breeding program: heat cycles, pedigrees, health records, contracts, waitlists, and everything in between. While we get back to you, feel free to poke around the workflows below.",
    nextSteps: [
      { label: 'See all workflows', url: 'https://breederhq.com/workflows' },
      { label: 'Pricing', url: 'https://breederhq.com/pricing' },
      { label: 'Create a free account', url: 'https://accounts.breederhq.com/register?intent=breeder_dashboard' },
    ],
  },
  offer_services: {
    headline: 'Offering services to breeders',
    body: "BreederHQ has a growing marketplace where vets, farriers, trainers, transporters, photographers, and other professionals connect with serious breeders. We'd love to learn more about what you do and see if there's a good fit.",
    nextSteps: [
      { label: 'For service providers', url: 'https://breederhq.com/for-providers' },
      { label: 'Browse service categories', url: 'https://breederhq.com/services' },
    ],
  },
  org_membership: {
    headline: 'Helping your organization or club',
    body: "Breed clubs, registries, and breed associations have unique needs around membership, records, events, and verification. We're actively building tooling for organizations like yours and would love to compare notes.",
    nextSteps: [
      { label: 'For breed clubs', url: 'https://breederhq.com/for-breed-clubs' },
      { label: 'Identity & credentials', url: 'https://breederhq.com/trust' },
    ],
  },
  find_breeder: {
    headline: 'Finding a breeder or available animal',
    body: "The BreederHQ marketplace connects you with breeders across nine species. While we follow up personally, you're welcome to start browsing.",
    nextSteps: [
      { label: 'Find breeders', url: 'https://breederhq.com/find-breeders' },
      { label: 'For buyers', url: 'https://breederhq.com/buyers' },
    ],
  },
  list_animals: {
    headline: 'Listing animals for sale',
    body: "BreederHQ gives you a public storefront, waitlists, applications, and contracts that all stay connected to your breeding records. No spreadsheets, no double-entry.",
    nextSteps: [
      { label: 'See the breeder workflows', url: 'https://breederhq.com/workflows' },
      { label: 'Pricing', url: 'https://breederhq.com/pricing' },
      { label: 'Create a free account', url: 'https://accounts.breederhq.com/register?intent=breeder_dashboard' },
    ],
  },
  genetic_health: {
    headline: 'Genetic testing & health records',
    body: "We sync OFA, track CHIC readiness, store lab results, and surface what's missing before you breed. It's one of the parts of the platform we're proudest of.",
    nextSteps: [
      { label: 'Genetics & health testing', url: 'https://breederhq.com/workflows/genetics-and-health-testing' },
      { label: 'Identity & credentials', url: 'https://breederhq.com/trust' },
    ],
  },
  just_browsing: {
    headline: 'Just looking around',
    body: "No pressure at all. Here are a few good places to start if you want to get a feel for what BreederHQ is.",
    nextSteps: [
      { label: 'About BreederHQ', url: 'https://breederhq.com/about' },
      { label: 'All workflows', url: 'https://breederhq.com/workflows' },
      { label: 'Free tools', url: 'https://breederhq.com/tools' },
    ],
  },
};

const DEFAULT_FOLLOWUP: InterestFollowUp = {
  headline: 'Thanks for reaching out',
  body: "We received your note and a real person will read it. While you wait, feel free to look around.",
  nextSteps: [
    { label: 'See all workflows', url: 'https://breederhq.com/workflows' },
    { label: 'Browse the marketplace', url: 'https://breederhq.com/find-breeders' },
    { label: 'About BreederHQ', url: 'https://breederhq.com/about' },
  ],
};

export async function sendAutoReplyToLead(lead: EnrichedLead): Promise<boolean> {
  const resendApiKey = import.meta.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log('⚠️ Resend not configured, skipping auto-reply');
    return false;
  }

  if (!lead.source || !AUTO_REPLY_SOURCES.has(lead.source)) {
    return false;
  }

  // Build the picked-interest list (canonical order from input)
  const pickedKeys = lead.interests && lead.interests.length > 0
    ? lead.interests
    : lead.interest ? [lead.interest] : [];
  const primaryKey = pickedKeys[0];
  const secondaryKeys = pickedKeys.slice(1);

  const followUp = (primaryKey && INTEREST_FOLLOWUPS[primaryKey]) || DEFAULT_FOLLOWUP;
  const firstName = (lead.name || '').split(' ')[0] || 'there';

  // De-dupe next-step links across primary + secondary follow-ups
  const seenUrls = new Set<string>();
  const allNextSteps: { label: string; url: string }[] = [];
  for (const step of followUp.nextSteps) {
    if (!seenUrls.has(step.url)) {
      seenUrls.add(step.url);
      allNextSteps.push(step);
    }
  }
  for (const key of secondaryKeys) {
    const fu = INTEREST_FOLLOWUPS[key];
    if (!fu) continue;
    for (const step of fu.nextSteps) {
      if (!seenUrls.has(step.url)) {
        seenUrls.add(step.url);
        allNextSteps.push(step);
      }
    }
  }
  // Cap at 8 buttons to keep the email visually tidy
  const linksToRender = allNextSteps.slice(0, 8);

  const linksHtml = linksToRender
    .map(
      (s) =>
        `<a href="${s.url}" style="display:inline-block;margin:4px 8px 4px 0;padding:10px 16px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;color:#1f2937;text-decoration:none;font-weight:500;font-size:14px;">${s.label}</a>`
    )
    .join('');

  const secondaryHeadlinesHtml = secondaryKeys
    .map((k) => INTEREST_FOLLOWUPS[k]?.headline)
    .filter((h): h is string => !!h)
    .map((h) => `<li style="margin:2px 0;">${h}</li>`)
    .join('');

  const secondaryBlockHtml = secondaryHeadlinesHtml
    ? `<p style="margin:14px 0 4px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:hsl(24,95%,40%);">Also interested in</p>
                <ul style="margin:0;padding-left:20px;font-size:15px;color:#374151;">${secondaryHeadlinesHtml}</ul>`
    : '';

  const secondaryTextLines = secondaryKeys
    .map((k) => INTEREST_FOLLOWUPS[k]?.headline)
    .filter((h): h is string => !!h);

  const emailHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Thanks for connecting with BreederHQ</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:linear-gradient(135deg,hsl(24,95%,53%) 0%,hsl(24,95%,45%) 100%);padding:32px 32px 28px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.01em;">BreederHQ</h1>
              <p style="margin:8px 0 0;color:#fff7ed;font-size:14px;">Modern breeding management software</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827;">Hi ${firstName},</h2>
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">
                Thanks for reaching out through BreederHQ. We got it, and a real person (not a bot) will read it and respond, usually within one business day.
              </p>
              <div style="margin:24px 0;padding:20px;background-color:#fff7ed;border-left:4px solid hsl(24,95%,53%);border-radius:6px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:hsl(24,95%,40%);">You told us you're interested in</p>
                <p style="margin:0;font-size:17px;font-weight:600;color:#111827;">${followUp.headline}</p>
                <p style="margin:12px 0 0;font-size:15px;color:#374151;">${followUp.body}</p>
                ${secondaryBlockHtml}
              </div>
              <h3 style="margin:24px 0 12px;font-size:15px;font-weight:600;color:#111827;">A few good places to start</h3>
              <div style="margin:0 0 8px;">${linksHtml}</div>
              <p style="margin:32px 0 0;font-size:15px;color:#374151;">
                If you have anything else you'd like to share before we get back to you, just reply to this email. It goes straight to our inbox.
              </p>
              <p style="margin:16px 0 0;font-size:15px;color:#374151;">
                Talk soon,<br />
                <strong>The BreederHQ Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                BreederHQ &middot; <a href="https://breederhq.com" style="color:#6b7280;text-decoration:underline;">breederhq.com</a> &middot; <a href="mailto:info@breederhq.com" style="color:#6b7280;text-decoration:underline;">info@breederhq.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">
                You're receiving this because you submitted the Let's Connect form on breederhq.com. If this wasn't you, just ignore it. We won't add you to any list.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const emailText = `Hi ${firstName},

Thanks for reaching out through BreederHQ. We got your note, and a real person will read it and respond, usually within one business day.

You told us you're interested in: ${followUp.headline}
${followUp.body}
${secondaryTextLines.length > 0 ? `\nAlso interested in:\n${secondaryTextLines.map((h) => `- ${h}`).join('\n')}\n` : ''}
A few good places to start:
${linksToRender.map((s) => `- ${s.label}: ${s.url}`).join('\n')}

If you have anything else to share, just reply to this email.

Talk soon,
The BreederHQ Team

---
BreederHQ - https://breederhq.com - info@breederhq.com`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'BreederHQ <hello@mail.breederhq.com>',
        to: lead.email,
        reply_to: 'info@breederhq.com',
        subject: `Thanks for connecting, ${firstName}. We got your note.`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      console.error('Auto-reply email failed:', response.status, await response.text());
      return false;
    }

    console.log('✅ Auto-reply sent to lead:', lead.email);
    return true;
  } catch (error) {
    console.error('Failed to send auto-reply:', error);
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
    sendAutoReplyToLead(enrichedLead),
  ];

  const results = await Promise.allSettled(distributionPromises);

  // Log results
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  console.log(`✅ Lead distributed to ${successCount}/${results.length} channels`);

  return enrichedLead;
}
