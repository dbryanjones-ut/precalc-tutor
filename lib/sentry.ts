/**
 * Sentry error tracking configuration
 *
 * This module sets up Sentry for error tracking and performance monitoring.
 * To enable Sentry, install the SDK: npm install @sentry/nextjs
 */

// Uncomment when Sentry is installed
// import * as Sentry from '@sentry/nextjs';
// import { env, isProd } from './env';

export function initSentry() {
  // Uncomment when Sentry is installed
  /*
  if (!env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    enabled: isProd,

    // Performance monitoring
    tracesSampleRate: isProd ? 0.1 : 1.0, // 10% in production, 100% in dev

    // Error tracking
    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }

      // Don't send errors in development
      if (!isProd) {
        console.error('Sentry would have sent:', event, hint);
        return null;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network errors
      'NetworkError',
      'Network request failed',
      // User cancelled actions
      'AbortError',
    ],

    // Performance monitoring
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.vercel\.app/,
        ],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Session replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  });
  */

  console.log('Sentry initialization skipped (not installed)');
}

// Error boundary helper
export function captureException(error: Error, context?: Record<string, unknown>) {
  // Uncomment when Sentry is installed
  /*
  if (isProd) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error captured:', error, context);
  }
  */

  console.error('Error captured:', error, context);
}

// Performance monitoring helper
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  // Uncomment when Sentry is installed
  /*
  if (isProd) {
    Sentry.captureMessage(message, level);
  } else {
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](message);
  }
  */

  console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](message);
}
