// Analytics & Tracking Configuration

export const analyticsConfig = {
  // Google Analytics 4
  ga4: {
    measurementId: import.meta.env.PUBLIC_GA4_MEASUREMENT_ID,
    enabled: !!import.meta.env.PUBLIC_GA4_MEASUREMENT_ID,
  },

  // Google Tag Manager
  gtm: {
    containerId: import.meta.env.PUBLIC_GTM_CONTAINER_ID,
    enabled: !!import.meta.env.PUBLIC_GTM_CONTAINER_ID,
  },

  // Microsoft Clarity (Session Recordings)
  clarity: {
    id: import.meta.env.PUBLIC_CLARITY_ID,
    enabled: !!import.meta.env.PUBLIC_CLARITY_ID,
  },

  // Hotjar (Heatmaps & Recordings)
  hotjar: {
    id: import.meta.env.PUBLIC_HOTJAR_ID,
    enabled: !!import.meta.env.PUBLIC_HOTJAR_ID,
  },

  // Social Media Pixels
  meta: {
    pixelId: import.meta.env.PUBLIC_META_PIXEL_ID,
    enabled: !!import.meta.env.PUBLIC_META_PIXEL_ID,
  },

  linkedin: {
    partnerId: import.meta.env.PUBLIC_LINKEDIN_PARTNER_ID,
    enabled: !!import.meta.env.PUBLIC_LINKEDIN_PARTNER_ID,
  },

  twitter: {
    pixelId: import.meta.env.PUBLIC_TWITTER_PIXEL_ID,
    enabled: !!import.meta.env.PUBLIC_TWITTER_PIXEL_ID,
  },

  // Sentry (Error Tracking)
  sentry: {
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    enabled: !!import.meta.env.PUBLIC_SENTRY_DSN && import.meta.env.NODE_ENV === 'production',
  },

  // Feature Flags
  enableInProduction: import.meta.env.NODE_ENV === 'production',
  enableInDevelopment: false, // Set to true to test in dev
};

// URLs
export const urlConfig = {
  site: import.meta.env.PUBLIC_SITE_URL || 'https://www.breederhq.com',
  app: import.meta.env.PUBLIC_APP_URL || 'https://app.breederhq.com',
  marketplace: import.meta.env.PUBLIC_MARKETPLACE_URL || 'https://marketplace.breederhq.com',
};
