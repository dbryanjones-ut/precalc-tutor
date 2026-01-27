/**
 * Type-safe environment variable access with validation
 *
 * This module provides runtime validation of environment variables
 * and type-safe access to them throughout the application.
 */

import { z } from 'zod';

// Define environment variable schema
const envSchema = z.object({
  // API Keys
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  MATHPIX_APP_ID: z.string().optional(),
  MATHPIX_API_KEY: z.string().optional(),

  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('PreCalc Tutor'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).default('60'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().positive()).default('60000'),
  AI_RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).default('30'),

  // Error Tracking
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),

  // Analytics
  NEXT_PUBLIC_VERCEL_ANALYTICS: z.string().transform((val) => val === 'true').default('false'),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_OCR: z.string().transform((val) => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_OFFLINE_MODE: z.string().transform((val) => val === 'true').default('true'),

  // Security
  SESSION_SECRET: z.string().optional(),
  CSRF_SECRET: z.string().optional(),
});

// Client-side environment variables (must start with NEXT_PUBLIC_)
const clientEnvSchema = envSchema.pick({
  NEXT_PUBLIC_APP_URL: true,
  NEXT_PUBLIC_APP_NAME: true,
  NEXT_PUBLIC_VERCEL_ANALYTICS: true,
  NEXT_PUBLIC_ENABLE_OCR: true,
  NEXT_PUBLIC_ENABLE_OFFLINE_MODE: true,
});

// Type inference
export type Env = z.infer<typeof envSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// Validate and parse environment variables
function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    // API Keys
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    MATHPIX_APP_ID: process.env.MATHPIX_APP_ID,
    MATHPIX_API_KEY: process.env.MATHPIX_API_KEY,

    // Application Configuration
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,

    // Rate Limiting
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
    AI_RATE_LIMIT_MAX: process.env.AI_RATE_LIMIT_MAX,

    // Error Tracking
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,

    // Analytics
    NEXT_PUBLIC_VERCEL_ANALYTICS: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS,

    // Feature Flags
    NEXT_PUBLIC_ENABLE_OCR: process.env.NEXT_PUBLIC_ENABLE_OCR,
    NEXT_PUBLIC_ENABLE_OFFLINE_MODE: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE,

    // Security
    SESSION_SECRET: process.env.SESSION_SECRET,
    CSRF_SECRET: process.env.CSRF_SECRET,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

// Validate client environment variables
function validateClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_VERCEL_ANALYTICS: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS,
    NEXT_PUBLIC_ENABLE_OCR: process.env.NEXT_PUBLIC_ENABLE_OCR,
    NEXT_PUBLIC_ENABLE_OFFLINE_MODE: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE,
  });

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

// Export validated environment variables
// This will throw an error at build time if validation fails
export const env = validateEnv();

// Export client-safe environment variables
export const clientEnv = validateClientEnv();

// Helper to check if we're in production
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Helper to get the app URL
export function getAppUrl() {
  return env.NEXT_PUBLIC_APP_URL;
}

// Helper to check feature flags
export const features = {
  ocr: env.NEXT_PUBLIC_ENABLE_OCR,
  offlineMode: env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE,
  analytics: env.NEXT_PUBLIC_VERCEL_ANALYTICS,
} as const;
