import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 *
 * Returns the current health status of the application.
 * Used by Docker, Kubernetes, load balancers, and monitoring systems.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Basic health checks
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    // Check if critical environment variables are set
    const envChecks = {
      anthropicApiKey: !!process.env.ANTHROPIC_API_KEY,
    };

    const allEnvChecksPass = Object.values(envChecks).every(Boolean);

    if (!allEnvChecksPass) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'Some environment variables are missing',
          checks,
          envChecks,
          responseTime: Date.now() - startTime,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        checks,
        envChecks,
        responseTime: Date.now() - startTime,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
      { status: 503 }
    );
  }
}

// HEAD request for simple health checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
