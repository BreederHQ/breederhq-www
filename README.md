# BreederHQ Marketing Website

Modern, high-performance marketing website for BreederHQ with enterprise-level visitor intelligence and analytics.

Built with Astro 5 + Tailwind CSS 4.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation

**All documentation is in the `.docs` folder** (excluded from git/deployment):

- **[Quick Start Guide](.docs/QUICK-START.md)** - Get up and running in 15 minutes
- **[Strategic Advantages](.docs/STRATEGIC-ADVANTAGES.md)** - All features & capabilities
- **[Implementation Summary](.docs/IMPLEMENTATION-SUMMARY.md)** - What was built & why
- **[Architecture](.docs/ARCHITECTURE.md)** - Technical details & data flow

## 🎯 What's Built In

✅ **Visitor Intelligence** - See which companies visit your site
✅ **Lead Enrichment** - Auto-enrich contacts with company data
✅ **Multi-Channel Distribution** - Slack, HubSpot, Zapier, your CRM
✅ **Session Recordings** - Watch user sessions (Microsoft Clarity)
✅ **Conversion Tracking** - GA4, Meta, LinkedIn, Twitter pixels
✅ **Performance Monitoring** - Core Web Vitals tracking
✅ **SEO Optimization** - Comprehensive meta tags & structured data

## 🛠️ Tech Stack

- **Framework**: Astro 5.x
- **Styling**: Tailwind CSS 4.x
- **Hosting**: Vercel
- **Analytics**: GA4, Microsoft Clarity
- **Language**: TypeScript

## 📦 Project Structure

```
breederhq-www/
├── .docs/              # Documentation (gitignored)
├── src/
│   ├── components/     # Reusable components
│   │   ├── Analytics.astro
│   │   ├── SEOHead.astro
│   │   ├── ContactForm.astro
│   │   └── CTAButton.astro
│   ├── layouts/        # Page layouts
│   ├── pages/          # Routes & API endpoints
│   │   ├── api/
│   │   │   ├── contact.ts
│   │   │   └── track-visitor.ts
│   │   └── *.astro
│   ├── lib/            # Utilities
│   │   ├── tracking.ts
│   │   ├── performance.ts
│   │   └── server/
│   ├── config/         # Configuration
│   └── styles/         # Global styles
├── public/             # Static assets
├── .env.example        # Environment template
└── package.json
```

## 🔧 Configuration

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys (see [Quick Start](.docs/QUICK-START.md))

3. Deploy to Vercel:
   ```bash
   vercel
   vercel env add PUBLIC_GA4_MEASUREMENT_ID
   vercel --prod
   ```

### Required Vercel Environment Variables for Lead Notifications

| Variable | Required | What it does |
|----------|----------|-------------|
| `SLACK_WEBHOOK_URL` | Yes | Posts "New Lead Submitted!" to Slack `#leads` channel |
| `RESEND_API_KEY` | Yes | Sends email notifications via Resend |
| `NOTIFICATION_EMAIL` | Yes | Email address that receives lead notifications (e.g., `leads@breederhq.com`) |
| `CLEARBIT_SECRET_KEY` | Optional | Enriches leads with company/person data |
| `HUBSPOT_API_KEY` | Optional | Auto-creates CRM contacts |
| `ZAPIER_WEBHOOK_URL` | Optional | Forwards leads to Zapier |

If any required variable is missing, that notification channel silently skips. Check Vercel dashboard > Settings > Environment Variables if notifications stop working.

## 📊 Features

### Analytics & Tracking
- Google Analytics 4 with custom events
- Microsoft Clarity (FREE session recordings)
- Multi-platform conversion tracking
- Core Web Vitals monitoring

### Lead Capture
- Smart contact forms with validation
- Automatic lead enrichment (Clearbit)
- Real-time Slack notifications (`#leads` channel)
- Email notifications via Resend (`NOTIFICATION_EMAIL`)
- CRM integration (HubSpot, Zapier)

### Visitor Intelligence
- Company identification
- High-value visitor alerts
- Behavioral tracking
- UTM attribution

## 💰 Cost

**Free Tier** (everything you need to start):
- Google Analytics 4
- Microsoft Clarity
- Slack webhooks
- Social media pixels
- Vercel hosting

**Paid Tier** (when ready to scale):
- Clearbit Reveal: $99/month (see which companies visit)
- HubSpot Starter: $45/month (CRM)

## 📝 License

Proprietary - BreederHQ, Inc.

---

**For detailed setup instructions, see [.docs/QUICK-START.md](.docs/QUICK-START.md)**
