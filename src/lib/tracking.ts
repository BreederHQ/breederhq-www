/**
 * Client-side tracking utilities
 * Sends events to multiple analytics platforms simultaneously
 */

// Type definitions for analytics events
export interface TrackingEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Initialize tracking (call this on page load)
export function initTracking() {
  if (!isBrowser) return;

  // Capture UTM parameters and store in sessionStorage
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {
    source: urlParams.get('utm_source'),
    medium: urlParams.get('utm_medium'),
    campaign: urlParams.get('utm_campaign'),
    term: urlParams.get('utm_term'),
    content: urlParams.get('utm_content'),
  };

  // Only store if at least one UTM parameter exists
  if (Object.values(utmParams).some(v => v !== null)) {
    sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
  }

  // Set up scroll depth tracking
  setupScrollTracking();

  // Set up time on page tracking
  setupTimeTracking();

  console.log('📊 Tracking initialized');
}

// Get stored UTM parameters
export function getUTMParams() {
  if (!isBrowser) return {};

  const stored = sessionStorage.getItem('utm_params');
  return stored ? JSON.parse(stored) : {};
}

// Track generic events
export function trackEvent(event: TrackingEvent) {
  if (!isBrowser) return;

  const { category, action, label, value } = event;

  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  // Google Tag Manager
  if (typeof window.dataLayer !== 'undefined') {
    window.dataLayer.push({
      event: 'custom_event',
      eventCategory: category,
      eventAction: action,
      eventLabel: label,
      eventValue: value,
    });
  }

  console.log('📊 Event tracked:', event);
}

// Track page views
export function trackPageView(path?: string) {
  if (!isBrowser) return;

  const pagePath = path || window.location.pathname;

  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }

  // Google Tag Manager
  if (typeof window.dataLayer !== 'undefined') {
    window.dataLayer.push({
      event: 'page_view',
      page: {
        path: pagePath,
        url: window.location.href,
        title: document.title,
      },
    });
  }

  console.log('📊 Page view tracked:', pagePath);
}

// Track CTA clicks
export function trackCTAClick(ctaName: string, location: string) {
  trackEvent({
    category: 'CTA',
    action: 'click',
    label: `${ctaName} - ${location}`,
  });
}

// Track form interactions
export function trackFormStart(formId: string) {
  trackEvent({
    category: 'Form',
    action: 'start',
    label: formId,
  });
}

export function trackFormSubmit(formId: string) {
  trackEvent({
    category: 'Form',
    action: 'submit',
    label: formId,
  });

  // Ad-platform conversion tracking (trackConversion) removed: it fired a
  // Google Ads tag with a placeholder AW-CONVERSION-ID that was never replaced,
  // so it did nothing. Re-add with a real conversion ID when one exists.
}

// Scroll depth tracking
function setupScrollTracking() {
  if (!isBrowser) return;

  const depths = [25, 50, 75, 100];
  const tracked: number[] = [];

  const trackScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    depths.forEach(depth => {
      if (scrollPercent >= depth && !tracked.includes(depth)) {
        tracked.push(depth);
        trackEvent({
          category: 'Engagement',
          action: 'scroll_depth',
          label: `${depth}%`,
          value: depth,
        });
      }
    });
  };

  window.addEventListener('scroll', trackScroll, { passive: true });
}

// Time on page tracking
function setupTimeTracking() {
  if (!isBrowser) return;

  const timeThresholds = [30, 60, 180]; // 30s, 1m, 3m
  const tracked: number[] = [];

  timeThresholds.forEach(threshold => {
    setTimeout(() => {
      if (!tracked.includes(threshold)) {
        tracked.push(threshold);
        trackEvent({
          category: 'Engagement',
          action: 'time_on_page',
          label: `${threshold}s`,
          value: threshold,
        });
      }
    }, threshold * 1000);
  });
}

// Type declarations for global analytics objects
declare global {
  interface Window {
    dataLayer: any[];
    lintrk: (action: string, data: any) => void;
  }
  function gtag(...args: any[]): void;
  function fbq(...args: any[]): void;
  function twq(...args: any[]): void;
}
