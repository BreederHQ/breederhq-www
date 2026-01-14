/**
 * Client-side tracking utilities
 * Use these functions to track events, conversions, and user behavior
 */

// Types
export interface TrackEventParams {
  category: string;
  action: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export interface TrackConversionParams {
  conversionType: 'signup' | 'trial_start' | 'demo_request' | 'contact' | 'download';
  value?: number;
  currency?: string;
  [key: string]: any;
}

// Google Analytics 4 Event Tracking
export function trackEvent(params: TrackEventParams) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', params.action, {
      event_category: params.category,
      event_label: params.label,
      value: params.value,
      ...params,
    });
  }

  // Also send to dataLayer for GTM
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: params.action,
      ...params,
    });
  }

  console.log('📊 Event tracked:', params);
}

// Conversion Tracking (for all platforms)
export function trackConversion(params: TrackConversionParams) {
  const { conversionType, value = 0, currency = 'USD', ...rest } = params;

  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with actual conversion IDs
      value: value,
      currency: currency,
      transaction_id: '',
    });
  }

  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    const metaEvent = conversionType === 'signup' ? 'CompleteRegistration' : 'Lead';
    window.fbq('track', metaEvent, { value, currency });
  }

  // LinkedIn
  if (typeof window !== 'undefined' && window.lintrk) {
    window.lintrk('track', { conversion_id: 'CONVERSION_ID' }); // Replace with actual ID
  }

  // Twitter
  if (typeof window !== 'undefined' && window.twq) {
    window.twq('track', 'SignUp', { value, currency });
  }

  trackEvent({
    category: 'Conversion',
    action: conversionType,
    value,
    ...rest,
  });

  console.log('🎯 Conversion tracked:', params);
}

// Track Outbound Links
export function trackOutboundLink(url: string, label?: string) {
  trackEvent({
    category: 'Outbound Link',
    action: 'click',
    label: label || url,
  });
}

// Track CTA Clicks
export function trackCTAClick(ctaName: string, location: string) {
  trackEvent({
    category: 'CTA',
    action: 'click',
    label: `${ctaName} - ${location}`,
  });
}

// Track Form Interactions
export function trackFormStart(formName: string) {
  trackEvent({
    category: 'Form',
    action: 'start',
    label: formName,
  });
}

export function trackFormSubmit(formName: string, success: boolean = true) {
  trackEvent({
    category: 'Form',
    action: success ? 'submit_success' : 'submit_error',
    label: formName,
  });
}

// Track Video Interactions
export function trackVideoPlay(videoName: string, location: string) {
  trackEvent({
    category: 'Video',
    action: 'play',
    label: `${videoName} - ${location}`,
  });
}

// Track Scroll Depth
export function initScrollTracking() {
  if (typeof window === 'undefined') return;

  const scrollDepths = [25, 50, 75, 100];
  const reached: { [key: number]: boolean } = {};

  window.addEventListener('scroll', () => {
    const scrollPercentage = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    scrollDepths.forEach((depth) => {
      if (scrollPercentage >= depth && !reached[depth]) {
        reached[depth] = true;
        trackEvent({
          category: 'Scroll Depth',
          action: `${depth}%`,
          label: window.location.pathname,
          value: depth,
        });
      }
    });
  });
}

// Track Time on Page
export function trackTimeOnPage() {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();

  const sendTimeOnPage = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000); // seconds
    trackEvent({
      category: 'Engagement',
      action: 'time_on_page',
      label: window.location.pathname,
      value: timeSpent,
    });
  };

  // Send on page leave
  window.addEventListener('beforeunload', sendTimeOnPage);

  // Also send at intervals for long sessions
  setTimeout(sendTimeOnPage, 30000); // 30 seconds
  setTimeout(sendTimeOnPage, 60000); // 1 minute
  setTimeout(sendTimeOnPage, 180000); // 3 minutes
}

// Extract UTM Parameters
export function getUTMParameters(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((param) => {
    const value = params.get(param);
    if (value) {
      utmParams[param] = value;
      // Store in sessionStorage for attribution
      sessionStorage.setItem(param, value);
    }
  });

  return utmParams;
}

// Get stored UTM parameters (for conversion attribution)
export function getStoredUTMParameters(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const utmParams: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((param) => {
    const value = sessionStorage.getItem(param);
    if (value) utmParams[param] = value;
  });

  return utmParams;
}

// Initialize all tracking
export function initTracking() {
  if (typeof window === 'undefined') return;

  // Store UTM parameters
  getUTMParameters();

  // Initialize scroll tracking
  initScrollTracking();

  // Initialize time on page tracking
  trackTimeOnPage();

  console.log('📊 Tracking initialized');
}

// TypeScript declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
    lintrk?: (...args: any[]) => void;
    twq?: (...args: any[]) => void;
  }
}
