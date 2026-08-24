/**
 * Shared capability data for /features.
 *
 * Flat, not tiered. Public access is a single offer (BreederHQ Launch), so a
 * per-tier matrix would describe products that cannot be bought. Capabilities
 * that only exist for multi-user, multi-location operations are not listed
 * here at all — those belong to the large-scale/registry conversation at
 * /contact, which is deliberately not a published feature list.
 */

export type FeatureRow = {
  name: string;
  note?: string;
};

export type FeatureCategory = {
  name: string;
  features: FeatureRow[];
};

export const planCategories: FeatureCategory[] = [
  {
    name: "Animals",
    features: [
      { name: "Animal Profiles & Status Tracking" },
      { name: "Health Records & Vaccinations" },
      { name: "Offspring Records" },
      { name: "Registry & Documents" },
      { name: "Media Gallery" },
      { name: "Breeding History (Data Entry)" },
      { name: "Cycle Info" },
      { name: "Medication Tracking & Withdrawal" },
      { name: "Lineage & Pedigree Explorer" },
      { name: "Genetics Tab" },
      { name: "Nutrition Tracking" },
      { name: "Titles & Competitions" },
      { name: "Breeding Profile & Analytics" },
      { name: "Privacy Controls & Sharing" },
      { name: "Activity Log" },
      { name: "Dairy Production Tracking", note: "Goats" },
      { name: "Fiber/Wool Production Tracking", note: "Sheep & Goats" },
      { name: "Document Watermarking" },
      { name: "Network Animals & Share Codes" },
      { name: "Ovulation Pattern Analysis", note: "Horses" },
    ],
  },
  {
    name: "Breeding",
    features: [
      { name: "Individual Breeding Plans" },
      { name: "Breeding Calendar" },
      { name: "What-If Planning (Schedule Alignment)" },
      { name: "Breeding Attempts" },
      { name: "Group Breeding Plans", note: "Sheep & Goats" },
      {
        name: "Genetics Lab (7 Analysis Tabs)",
        note: "Overview, Compare, Punnett Squares, Health Analysis, Color Preview, What's Missing, Pedigree",
      },
      {
        name: "Find a Match (Network Search)",
        note: "Cross-tenant search for genetically compatible matches",
      },
      { name: "Mare Status & Reproductive Tracking", note: "Horses" },
      { name: "Foaling Management & Calendar", note: "Horses" },
      { name: "Pre-Foaling Monitor", note: "Horses" },
      { name: "Post-Foaling Heat Tracker", note: "Horses" },
      { name: "Supplement Protocols" },
      { name: "Birth Checklist" },
      { name: "Follicle Exams & Progesterone Tests", note: "Horses" },
      { name: "Goal-Based Breeding (Reverse Phenotype Lookup)" },
      { name: "Offspring Simulator" },
      { name: "Breeding Program Rules" },
    ],
  },
  {
    name: "Offspring",
    features: [
      { name: "Offspring Tracking & Management" },
      { name: "Weight & Growth Tracking" },
      { name: "Collar & ID Management" },
      {
        name: "Rearing Protocols (ENS, ESI, Rule of 7s)",
        note: "Built-in dog protocols; Protocol Builder for any species",
      },
      { name: "Neonatal Care" },
      { name: "Temperament Testing (Volhard PAT)", note: "Dogs" },
      { name: "Gun Dog Aptitude Program", note: "Dogs" },
      { name: "Group Analytics, Nutrition & Finances" },
      { name: "Custom Protocol Import/Export" },
      { name: "Community Protocol Sharing" },
      { name: "Completion Certificates" },
    ],
  },
  {
    name: "Contacts & CRM",
    features: [
      { name: "Contact Profiles & Notes" },
      { name: "Animals & Documents Tab" },
      { name: "Portal Tab" },
      { name: "CSV Export" },
      { name: "Events & Reminders" },
      { name: "Compliance Tracking" },
      { name: "Messages & Quick DM" },
      { name: "Finances Tab" },
      { name: "Activity Feed" },
      { name: "Email Composer & Templates" },
      { name: "Follow-Ups & Document Bundles" },
      { name: "CRM Analytics Dashboard" },
      { name: "Lead Scoring" },
      { name: "Follow-Up Automation" },
    ],
  },
  {
    name: "Finance & Contracts",
    features: [
      { name: "Invoices & Expenses" },
      { name: "Payouts & Stripe Integration" },
      { name: "Contracts & System Templates" },
      { name: "E-Signatures" },
      { name: "Custom Contract Templates" },
      { name: "AI Contract Import (upload your existing PDF)" },
      { name: "Contract Audit Trail" },
      { name: "Advanced Reporting & Analytics" },
    ],
  },
  {
    name: "Marketplace & Commerce",
    features: [
      { name: "All Listing Types (Animal, Breeding, Service, Program)" },
      { name: "Booking Management" },
      { name: "Breeding Programs" },
      { name: "Free Breeder Service Listings" },
      { name: "Boosts & Featured Listings" },
    ],
  },
  {
    name: "Buyer Portal",
    features: [
      { name: "Portal Access & Dashboard" },
      { name: "Messaging" },
      { name: "Contract Signing" },
      { name: "Documents & Financial Summary" },
      { name: "Offspring Tracking" },
      { name: "Real-Time Messaging" },
      { name: "Scheduling & Booking" },
      { name: "Training Protocols & Certificates" },
      { name: "Buyer Health Data Access" },
    ],
  },
  {
    name: "Marketing & Communications",
    features: [
      { name: "Business Hours" },
      { name: "Communications Hub" },
      {
        name: "BreederHQ Email Address",
        note: "Dedicated email for inbound and outbound messaging",
      },
      { name: "Document Bundles" },
      { name: "Auto-Replies (Rule-Based Automation)" },
      {
        name: "Outreach Hub (Plan & Program Announcements)",
        note: "Write once, publish to email, portal, and marketplace",
      },
      { name: "Email-on-Publish to Buyers & Waitlist" },
      { name: "Public Marketplace Profile Announcements" },
      {
        name: "Audience Preview & Reach Metrics",
        note: "Eligible / emailed / seen counts per announcement",
      },
      {
        name: "Scout AI Drafting + Tone Adjustment",
        note: "Friendly, Professional, Excited, Concise",
      },
      {
        name: "Scout AI Quiet Guidance",
        note: "Suggested announcements based on program activity",
      },
      {
        name: "Facebook & Instagram Publishing",
        note: "Connect Facebook Page + Instagram Business once, post from the composer",
      },
      { name: "UTM Tracking on Social Posts" },
    ],
  },
  {
    name: "Dashboard",
    features: [
      { name: "Basic Dashboard Views" },
      { name: "Waitlist Gauge" },
      { name: "Financial Snapshot" },
      { name: "KPI Panel" },
      { name: "Horse-Specific Dashboard Widgets", note: "Horses" },
      { name: "Protocol Progress" },
      { name: "Ovulation Tracker", note: "Horses" },
      { name: "Foaling Analytics", note: "Horses" },
      { name: "Genetic Intelligence (COI Heatmap, Diversity Scoring)" },
    ],
  },
  {
    name: "Bloodlines & Pedigrees",
    features: [
      { name: "Multi-Generation Pedigree Visualization" },
      { name: "COI Calculation & Risk Levels" },
      { name: "Common Ancestor Tracking" },
      { name: "Cross-Tenant Network Animal Linking" },
      { name: "Titles & Competitions Explorer" },
      { name: "Interactive Pedigree Explorer" },
    ],
  },
  {
    name: "Scout AI & Help",
    features: [
      {
        name: "Ask Scout AI anything about your program",
        note: "Plain-English Q&A across animals, plans, finances, contacts, offspring, medications, and waitlist",
      },
      {
        name: "Sourced answers",
        note: "Every Scout AI response cites the actual records it pulled from",
      },
      { name: "Scout AI Repro Insight", note: "Dogs" },
      {
        name: "Health report generator",
        note: "Scout AI builds PIN-protected PDF reports for vets and buyers; 72-hour expiring share links, no account needed",
      },
      {
        name: "CSV & print export from any answer",
        note: "Download or print anything Scout AI returns",
      },
      {
        name: "Context-aware question suggestions",
        note: "Scout AI suggests relevant questions based on the page you are on",
      },
      {
        name: "Conversation memory",
        note: "Resume across sessions, browse history, build on past threads",
      },
      {
        name: "Help Assistant (Knowledge-Base AI)",
        note: "General breeding and platform questions answered from the help center, on every plan",
      },
      { name: "Help Center (Article Search)" },
      { name: "Interactive Feature Tours" },
    ],
  },
  {
    name: "Admin & Settings",
    features: [
      { name: "Account Management & Security" },
      { name: "Notification Settings" },
      { name: "Privacy & Sharing" },
      { name: "Module Settings (Breeding, Offspring)" },
      { name: "Tag Manager" },
      { name: "Food Products" },
      { name: "Data Management & Export" },
      { name: "Accessibility Settings" },
      { name: "AI & Privacy Controls" },
      { name: "Staff Management" },
    ],
  },
];

export const featuresTaglines: Record<string, string> = {
  Animals: "Records that match how breeders actually think.",
  Breeding: "Plan it, predict it, prove it.",
  Offspring: "From day-one weights to placement-ready.",
  "Contacts & CRM": "A breeder-shaped CRM, not a generic sales tool.",
  "Finance & Contracts":
    "Invoices, e-signatures, and the audit trail buyers expect.",
  "Marketplace & Commerce": "Animal, breeding, service, and program listings.",
  "Buyer Portal": "Where your buyers actually live.",
  "Marketing & Communications":
    "Outreach that hits email, portal, marketplace, and socials.",
  Dashboard: "A configurable home page for your whole operation.",
  "Bloodlines & Pedigrees": "Multi-generation pedigrees with real COI math.",
  "Scout AI & Help": "A data-aware assistant that actually knows your program.",
  "Admin & Settings": "Security, staff, audit, API. The boring critical stuff.",
};
