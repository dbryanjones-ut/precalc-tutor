import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode for better development warnings
  reactStrictMode: true,

  // Production optimizations
  swcMinify: true,
  compress: true,

  // Performance optimizations
  optimizeFonts: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
              "style-src 'self' 'unsafe-inline'", // KaTeX requires inline styles
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.anthropic.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ],
      },
    ];
  },

  // Webpack configuration for bundle analysis
  webpack: (config, { isServer, dev }) => {
    // Production bundle analysis
    if (!dev && !isServer) {
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './bundle-report.html',
            openAnalyzer: false,
          })
        );
      }
    }

    // Optimize math libraries
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    return config;
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_NAME: 'PreCalc Tutor',
  },

  // TypeScript configuration
  typescript: {
    // Production builds will fail on type errors
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Production builds will fail on ESLint errors
    ignoreDuringBuilds: false,
  },

  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // Output configuration
  output: 'standalone', // For Docker deployments

  // Disable powered by header
  poweredByHeader: false,
};

export default nextConfig;
