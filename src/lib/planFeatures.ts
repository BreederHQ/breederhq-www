/**
 * Shared plan/feature data used by /pricing/compare AND /features.
 * Keeping both pages bound to one source of truth so badging never drifts.
 *
 * Tier semantics: `true` means "included at this tier or higher".
 * For Limits rows, the values are display strings (e.g. "Unlimited", "5 GB").
 */

export type FeatureRow = {
  name: string;
  standard: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
  note?: string;
};

export type FeatureCategory = {
  name: string;
  features: FeatureRow[];
};

export const planCategories: FeatureCategory[] = [
  {
    name: 'Animals',
    features: [
      { name: 'Animal Profiles & Status Tracking', standard: true, pro: true, enterprise: true },
      { name: 'Health Records & Vaccinations', standard: true, pro: true, enterprise: true },
      { name: 'Offspring Records', standard: true, pro: true, enterprise: true },
      { name: 'Registry & Documents', standard: true, pro: true, enterprise: true },
      { name: 'Media Gallery', standard: true, pro: true, enterprise: true },
      { name: 'Breeding History (Data Entry)', standard: true, pro: true, enterprise: true },
      { name: 'Cycle Info', standard: true, pro: true, enterprise: true },
      { name: 'Medication Tracking & Withdrawal', standard: true, pro: true, enterprise: true },
      { name: 'Lineage & Pedigree Explorer', standard: false, pro: true, enterprise: true },
      { name: 'Genetics Tab', standard: false, pro: true, enterprise: true },
      { name: 'Nutrition Tracking', standard: false, pro: true, enterprise: true },
      { name: 'Titles & Competitions', standard: false, pro: true, enterprise: true },
      { name: 'Breeding Profile & Analytics', standard: false, pro: true, enterprise: true },
      { name: 'Privacy Controls & Sharing', standard: false, pro: true, enterprise: true },
      { name: 'Activity Log', standard: false, pro: true, enterprise: true },
      { name: 'Dairy Production Tracking', standard: false, pro: true, enterprise: true, note: 'Goats' },
      { name: 'Fiber/Wool Production Tracking', standard: false, pro: true, enterprise: true, note: 'Sheep & Goats' },
      { name: 'Document Watermarking', standard: false, pro: true, enterprise: true },
      { name: 'Network Animals & Share Codes', standard: false, pro: true, enterprise: true },
      { name: 'Ovulation Pattern Analysis', standard: false, pro: false, enterprise: true, note: 'Horses' },
      { name: 'Document Access Log', standard: false, pro: false, enterprise: true },
      { name: 'Team Tab', standard: false, pro: false, enterprise: true },
      { name: 'Bulk Operations', standard: false, pro: false, enterprise: true },
      { name: 'Animal Audit Tab (per-animal change log)', standard: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Breeding',
    features: [
      { name: 'Individual Breeding Plans', standard: true, pro: true, enterprise: true },
      { name: 'Breeding Calendar', standard: true, pro: true, enterprise: true },
      { name: 'What-If Planning (Schedule Alignment)', standard: true, pro: true, enterprise: true },
      { name: 'Breeding Attempts', standard: true, pro: true, enterprise: true },
      { name: 'Group Breeding Plans', standard: true, pro: true, enterprise: true, note: 'Sheep & Goats' },
      { name: 'Genetics Lab (7 Analysis Tabs)', standard: false, pro: true, enterprise: true, note: 'Overview, Compare, Punnett Squares, Health Analysis, Color Preview, What\'s Missing, Pedigree' },
      { name: 'Find a Match (Network Search)', standard: false, pro: true, enterprise: true, note: 'Cross-tenant search for genetically compatible matches' },
      { name: 'Mare Status & Reproductive Tracking', standard: false, pro: true, enterprise: true, note: 'Horses' },
      { name: 'Foaling Management & Calendar', standard: false, pro: true, enterprise: true, note: 'Horses' },
      { name: 'Pre-Foaling Monitor', standard: false, pro: true, enterprise: true, note: 'Horses' },
      { name: 'Post-Foaling Heat Tracker', standard: false, pro: true, enterprise: true, note: 'Horses' },
      { name: 'Supplement Protocols', standard: false, pro: true, enterprise: true },
      { name: 'Birth Checklist', standard: false, pro: true, enterprise: true },
      { name: 'Follicle Exams & Progesterone Tests', standard: false, pro: true, enterprise: true, note: 'Horses' },
      { name: 'Goal-Based Breeding (Reverse Phenotype Lookup)', standard: false, pro: true, enterprise: true },
      { name: 'Offspring Simulator', standard: false, pro: true, enterprise: true },
      { name: 'Breeding Program Rules', standard: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Offspring',
    features: [
      { name: 'Offspring Tracking & Management', standard: true, pro: true, enterprise: true },
      { name: 'Weight & Growth Tracking', standard: true, pro: true, enterprise: true },
      { name: 'Collar & ID Management', standard: true, pro: true, enterprise: true },
      { name: 'Rearing Protocols (ENS, ESI, Rule of 7s)', standard: false, pro: true, enterprise: true, note: 'Built-in dog protocols; Protocol Builder for any species' },
      { name: 'Neonatal Care', standard: false, pro: true, enterprise: true },
      { name: 'Temperament Testing (Volhard PAT)', standard: false, pro: true, enterprise: true, note: 'Dogs' },
      { name: 'Gun Dog Aptitude Program', standard: false, pro: true, enterprise: true, note: 'Dogs' },
      { name: 'Group Analytics, Nutrition & Finances', standard: false, pro: true, enterprise: true },
      { name: 'Custom Protocol Import/Export', standard: false, pro: true, enterprise: true },
      { name: 'Community Protocol Sharing', standard: false, pro: true, enterprise: true },
      { name: 'Completion Certificates', standard: false, pro: true, enterprise: true },
    ]
  },
  {
    name: 'Contacts & CRM',
    features: [
      { name: 'Contact Profiles & Notes', standard: true, pro: true, enterprise: true },
      { name: 'Animals & Documents Tab', standard: true, pro: true, enterprise: true },
      { name: 'Portal Tab', standard: true, pro: true, enterprise: true },
      { name: 'CSV Export', standard: true, pro: true, enterprise: true },
      { name: 'Events & Reminders', standard: false, pro: true, enterprise: true },
      { name: 'Compliance Tracking', standard: false, pro: true, enterprise: true },
      { name: 'Messages & Quick DM', standard: false, pro: true, enterprise: true },
      { name: 'Finances Tab', standard: false, pro: true, enterprise: true },
      { name: 'Activity Feed', standard: false, pro: true, enterprise: true },
      { name: 'Email Composer & Templates', standard: false, pro: true, enterprise: true },
      { name: 'Follow-Ups & Document Bundles', standard: false, pro: true, enterprise: true },
      { name: 'CRM Analytics Dashboard', standard: false, pro: false, enterprise: true },
      { name: 'Lead Scoring', standard: false, pro: false, enterprise: true },
      { name: 'Follow-Up Automation', standard: false, pro: false, enterprise: true },
      { name: 'Contact Audit Tab (per-contact change log)', standard: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Finance & Contracts',
    features: [
      { name: 'Invoices & Expenses', standard: true, pro: true, enterprise: true },
      { name: 'Payouts & Stripe Integration', standard: true, pro: true, enterprise: true },
      { name: 'Contracts & System Templates', standard: true, pro: true, enterprise: true },
      { name: 'E-Signatures', standard: false, pro: true, enterprise: true },
      { name: 'Custom Contract Templates', standard: false, pro: true, enterprise: true },
      { name: 'AI Contract Import (upload your existing PDF)', standard: false, pro: true, enterprise: true },
      { name: 'Contract Audit Trail', standard: false, pro: true, enterprise: true },
      { name: 'Advanced Reporting & Analytics', standard: false, pro: true, enterprise: true },
    ]
  },
  {
    name: 'Marketplace & Commerce',
    features: [
      { name: 'All Listing Types (Animal, Breeding, Service, Program)', standard: true, pro: true, enterprise: true },
      { name: 'Booking Management', standard: true, pro: true, enterprise: true },
      { name: 'Breeding Programs', standard: true, pro: true, enterprise: true },
      { name: 'Free Breeder Service Listings', standard: true, pro: true, enterprise: true },
      { name: 'Boosts & Featured Listings', standard: true, pro: true, enterprise: true },
    ]
  },
  {
    name: 'Buyer Portal',
    features: [
      { name: 'Portal Access & Dashboard', standard: true, pro: true, enterprise: true },
      { name: 'Messaging', standard: true, pro: true, enterprise: true },
      { name: 'Contract Signing', standard: true, pro: true, enterprise: true },
      { name: 'Documents & Financial Summary', standard: true, pro: true, enterprise: true },
      { name: 'Offspring Tracking', standard: true, pro: true, enterprise: true },
      { name: 'Real-Time Messaging', standard: false, pro: true, enterprise: true },
      { name: 'Scheduling & Booking', standard: false, pro: true, enterprise: true },
      { name: 'Training Protocols & Certificates', standard: false, pro: true, enterprise: true },
      { name: 'Buyer Health Data Access', standard: false, pro: true, enterprise: true },
    ]
  },
  {
    name: 'Marketing & Communications',
    features: [
      { name: 'Business Hours', standard: true, pro: true, enterprise: true },
      { name: 'Communications Hub', standard: false, pro: true, enterprise: true },
      { name: 'BreederHQ Email Address', standard: false, pro: true, enterprise: true, note: 'Dedicated email for inbound and outbound messaging' },
      { name: 'Document Bundles', standard: false, pro: true, enterprise: true },
      { name: 'Auto-Replies (Rule-Based Automation)', standard: false, pro: true, enterprise: true },
      { name: 'Outreach Hub (Plan & Program Announcements)', standard: false, pro: true, enterprise: true, note: 'Write once, publish to email, portal, and marketplace' },
      { name: 'Email-on-Publish to Buyers & Waitlist', standard: false, pro: true, enterprise: true },
      { name: 'Public Marketplace Profile Announcements', standard: false, pro: true, enterprise: true },
      { name: 'Audience Preview & Reach Metrics', standard: false, pro: true, enterprise: true, note: 'Eligible / emailed / seen counts per announcement' },
      { name: 'Scout AI Drafting + Tone Adjustment', standard: false, pro: true, enterprise: true, note: 'Friendly, Professional, Excited, Concise' },
      { name: 'Scout AI Quiet Guidance', standard: false, pro: true, enterprise: true, note: 'Suggested announcements based on program activity' },
      { name: 'Facebook & Instagram Publishing', standard: false, pro: true, enterprise: true, note: 'Connect Facebook Page + Instagram Business once, post from the composer' },
      { name: 'UTM Tracking on Social Posts', standard: false, pro: true, enterprise: true },
    ]
  },
  {
    name: 'Dashboard',
    features: [
      { name: 'Basic Dashboard Views', standard: true, pro: true, enterprise: true },
      { name: 'Waitlist Gauge', standard: false, pro: true, enterprise: true },
      { name: 'Financial Snapshot', standard: false, pro: true, enterprise: true },
      { name: 'KPI Panel', standard: false, pro: true, enterprise: true },
      { name: 'Horse-Specific Dashboard Widgets', standard: false, pro: true, enterprise: true, note: 'Horses' },
      { name: 'Protocol Progress', standard: false, pro: true, enterprise: true },
      { name: 'Ovulation Tracker', standard: false, pro: false, enterprise: true, note: 'Horses' },
      { name: 'Foaling Analytics', standard: false, pro: false, enterprise: true, note: 'Horses' },
      { name: 'Genetic Intelligence (COI Heatmap, Diversity Scoring)', standard: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Bloodlines & Pedigrees',
    features: [
      { name: 'Multi-Generation Pedigree Visualization', standard: true, pro: true, enterprise: true },
      { name: 'COI Calculation & Risk Levels', standard: true, pro: true, enterprise: true },
      { name: 'Common Ancestor Tracking', standard: true, pro: true, enterprise: true },
      { name: 'Cross-Tenant Network Animal Linking', standard: true, pro: true, enterprise: true },
      { name: 'Titles & Competitions Explorer', standard: false, pro: true, enterprise: true },
      { name: 'Interactive Pedigree Explorer', standard: false, pro: true, enterprise: true },
    ]
  },
  {
    name: 'Scout AI & Help',
    features: [
      { name: 'Ask Scout AI anything about your program', standard: false, pro: true, enterprise: true, note: 'Plain-English Q&A across animals, plans, finances, contacts, offspring, medications, and waitlist' },
      { name: 'Sourced answers', standard: false, pro: true, enterprise: true, note: 'Every Scout AI response cites the actual records it pulled from' },
      { name: 'Scout AI Repro Insight', standard: false, pro: true, enterprise: true, note: 'Dogs' },
      { name: 'Health report generator', standard: false, pro: true, enterprise: true, note: 'Scout AI builds PIN-protected PDF reports for vets and buyers; 72-hour expiring share links, no account needed' },
      { name: 'CSV & print export from any answer', standard: false, pro: true, enterprise: true, note: 'Download or print anything Scout AI returns' },
      { name: 'Context-aware question suggestions', standard: false, pro: true, enterprise: true, note: 'Scout AI suggests relevant questions based on the page you are on' },
      { name: 'Conversation memory', standard: false, pro: true, enterprise: true, note: 'Resume across sessions, browse history, build on past threads' },
      { name: 'Help Assistant (Knowledge-Base AI)', standard: true, pro: true, enterprise: true, note: 'General breeding and platform questions answered from the help center, on every plan' },
      { name: 'Help Center (Article Search)', standard: true, pro: true, enterprise: true },
      { name: 'Interactive Feature Tours', standard: true, pro: true, enterprise: true },
    ]
  },
  {
    name: 'Admin & Settings',
    features: [
      { name: 'Account Management & Security', standard: true, pro: true, enterprise: true },
      { name: 'Notification Settings', standard: true, pro: true, enterprise: true },
      { name: 'Privacy & Sharing', standard: true, pro: true, enterprise: true },
      { name: 'Module Settings (Breeding, Offspring)', standard: true, pro: true, enterprise: true },
      { name: 'Tag Manager', standard: true, pro: true, enterprise: true },
      { name: 'Food Products', standard: true, pro: true, enterprise: true },
      { name: 'Data Management & Export', standard: true, pro: true, enterprise: true },
      { name: 'Accessibility Settings', standard: true, pro: true, enterprise: true },
      { name: 'AI & Privacy Controls', standard: false, pro: true, enterprise: true },
      { name: 'Staff Management', standard: false, pro: true, enterprise: true },
      { name: 'Organization-Wide Audit Trail', standard: false, pro: false, enterprise: true },
      { name: 'Multi-Location Management', standard: false, pro: false, enterprise: true },
      { name: 'API Access (for third-party integrations)', standard: false, pro: false, enterprise: true },
      { name: 'Team Management (with role-based access)', standard: false, pro: false, enterprise: true },
    ]
  },
  {
    name: 'Limits',
    features: [
      { name: 'Animals', standard: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Contacts', standard: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Breeding Plans', standard: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Marketplace Listings', standard: '5', pro: '50', enterprise: 'Unlimited' },
      { name: 'Storage', standard: '500 MB', pro: '5 GB', enterprise: '25 GB' },
      { name: 'SMS Notifications', standard: '50/mo', pro: '500/mo', enterprise: '5,000/mo' },
      { name: 'Support', standard: 'Email', pro: 'Priority', enterprise: 'Dedicated' },
    ]
  },
];

/**
 * Returns the earliest tier a feature is available in.
 * Used by /features to label each card with a single tier badge.
 */
export function earliestTier(f: FeatureRow): 'standard' | 'pro' | 'enterprise' {
  if (f.standard === true) return 'standard';
  if (f.pro === true) return 'pro';
  return 'enterprise';
}

export const featuresTaglines: Record<string, string> = {
  'Animals': 'Records that match how breeders actually think.',
  'Breeding': 'Plan it, predict it, prove it.',
  'Offspring': 'From day-one weights to placement-ready.',
  'Contacts & CRM': 'A breeder-shaped CRM, not a generic sales tool.',
  'Finance & Contracts': 'Invoices, e-signatures, and the audit trail buyers expect.',
  'Marketplace & Commerce': 'Animal, breeding, service, and program listings.',
  'Buyer Portal': 'Where your buyers actually live.',
  'Marketing & Communications': 'Outreach that hits email, portal, marketplace, and socials.',
  'Dashboard': 'A configurable home page for your whole operation.',
  'Bloodlines & Pedigrees': 'Multi-generation pedigrees with real COI math.',
  'Scout AI & Help': 'A data-aware assistant that actually knows your program.',
  'Admin & Settings': 'Security, staff, audit, API. The boring critical stuff.',
  'Limits': 'What scales with each plan.',
};
