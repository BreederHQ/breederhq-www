/**
 * Performance Monitoring & Web Vitals
 * Tracks Core Web Vitals and sends to analytics
 */

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Track Core Web Vitals
 * These are the metrics Google uses for ranking
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Dynamically import web-vitals
  import('web-vitals').then(({ onCLS, onFID, onLCP, onFCP, onTTFB, onINP }) => {
    // Cumulative Layout Shift (CLS)
    onCLS(sendToAnalytics);

    // First Input Delay (FID) - being replaced by INP
    onFID(sendToAnalytics);

    // Largest Contentful Paint (LCP)
    onLCP(sendToAnalytics);

    // First Contentful Paint (FCP)
    onFCP(sendToAnalytics);

    // Time to First Byte (TTFB)
    onTTFB(sendToAnalytics);

    // Interaction to Next Paint (INP) - new metric
    onINP(sendToAnalytics);
  }).catch(err => {
    console.error('Failed to load web-vitals:', err);
  });
}

/**
 * Send metric to analytics platforms
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }

  // Send to dataLayer
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'web_vitals',
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
    });
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`⚡ ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
    });
  }
}

/**
 * Track page load performance
 */
export function trackPageLoad() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    // Wait for performance data to be available
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'page_load_metrics', {
          event_category: 'Performance',
          page_load_time: Math.round(pageLoadTime),
          connect_time: Math.round(connectTime),
          render_time: Math.round(renderTime),
          non_interaction: true,
        });
      }

      if (import.meta.env.DEV) {
        console.log('📊 Page Performance:', {
          pageLoadTime: `${Math.round(pageLoadTime)}ms`,
          connectTime: `${Math.round(connectTime)}ms`,
          renderTime: `${Math.round(renderTime)}ms`,
        });
      }
    }, 0);
  });
}

/**
 * Monitor resource loading
 */
export function trackResourceTiming() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const resources = window.performance.getEntriesByType('resource');

      // Group by resource type
      const resourceStats: Record<string, { count: number; totalSize: number; totalDuration: number }> = {};

      resources.forEach((resource: any) => {
        const type = resource.initiatorType || 'other';

        if (!resourceStats[type]) {
          resourceStats[type] = { count: 0, totalSize: 0, totalDuration: 0 };
        }

        resourceStats[type].count++;
        resourceStats[type].totalSize += resource.transferSize || 0;
        resourceStats[type].totalDuration += resource.duration || 0;
      });

      // Find slow resources (>1 second)
      const slowResources = resources.filter((r: any) => r.duration > 1000);

      if (slowResources.length > 0 && window.gtag) {
        window.gtag('event', 'slow_resources_detected', {
          event_category: 'Performance',
          event_label: slowResources.length,
          non_interaction: true,
        });
      }

      if (import.meta.env.DEV) {
        console.log('📦 Resource Stats:', resourceStats);
        if (slowResources.length > 0) {
          console.warn('⚠️ Slow Resources (>1s):', slowResources);
        }
      }
    }, 0);
  });
}

/**
 * Detect and report JavaScript errors
 */
export function initErrorTracking() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'javascript_error', {
        event_category: 'Error',
        event_label: event.message,
        error_stack: event.error?.stack || 'No stack trace',
        non_interaction: true,
      });
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.error('❌ JS Error:', event.message, event.error);
    }
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (window.gtag) {
      window.gtag('event', 'unhandled_rejection', {
        event_category: 'Error',
        event_label: event.reason?.toString() || 'Unknown rejection',
        non_interaction: true,
      });
    }

    if (import.meta.env.DEV) {
      console.error('❌ Unhandled Rejection:', event.reason);
    }
  });
}

/**
 * Initialize all performance monitoring
 */
export function initPerformanceMonitoring() {
  initWebVitals();
  trackPageLoad();
  trackResourceTiming();
  initErrorTracking();

  if (import.meta.env.DEV) {
    console.log('⚡ Performance monitoring initialized');
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
