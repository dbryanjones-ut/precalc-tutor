/**
 * Analytics and performance monitoring
 *
 * This module provides helpers for tracking user interactions and performance metrics.
 * To enable Vercel Analytics, install: npm install @vercel/analytics
 */

import { clientEnv } from './env';

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent) {
  if (!clientEnv.NEXT_PUBLIC_VERCEL_ANALYTICS) {
    console.log('[Analytics]', event.name, event.properties);
    return;
  }

  // Uncomment when @vercel/analytics is installed
  /*
  import('@vercel/analytics').then(({ track }) => {
    track(event.name, event.properties);
  });
  */

  console.log('[Analytics]', event.name, event.properties);
}

/**
 * Track page view
 */
export function trackPageView(page: string) {
  trackEvent({
    name: 'page_view',
    properties: { page },
  });
}

/**
 * Track user interaction
 */
export function trackInteraction(action: string, properties?: Record<string, unknown>) {
  trackEvent({
    name: 'user_interaction',
    properties: { action, ...properties },
  });
}

/**
 * Track AI usage
 */
export function trackAIUsage(feature: string, properties?: Record<string, unknown>) {
  trackEvent({
    name: 'ai_usage',
    properties: { feature, ...properties },
  });
}

/**
 * Track performance metric
 */
export function trackPerformance(metric: string, value: number, unit = 'ms') {
  trackEvent({
    name: 'performance',
    properties: { metric, value, unit },
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: Record<string, unknown>) {
  trackEvent({
    name: 'error',
    properties: {
      message: error.message,
      stack: error.stack,
      ...context,
    },
  });
}

/**
 * Web Vitals tracking
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  label: string;
  value: number;
}) {
  if (!clientEnv.NEXT_PUBLIC_VERCEL_ANALYTICS) {
    console.log('[Web Vitals]', metric);
    return;
  }

  // Track Core Web Vitals
  if (['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'].includes(metric.name)) {
    trackPerformance(metric.name, metric.value);
  }
}

/**
 * Track conversion
 */
export function trackConversion(goal: string, value?: number) {
  trackEvent({
    name: 'conversion',
    properties: { goal, value },
  });
}

/**
 * Initialize analytics
 */
export function initAnalytics() {
  if (clientEnv.NEXT_PUBLIC_VERCEL_ANALYTICS) {
    console.log('[Analytics] Vercel Analytics enabled');
  } else {
    console.log('[Analytics] Analytics disabled (development mode)');
  }

  // Track initial page load performance
  if (typeof window !== 'undefined' && window.performance) {
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      trackPerformance('page_load', pageLoadTime);
      trackPerformance('server_response', connectTime);
      trackPerformance('render', renderTime);
    });
  }
}
