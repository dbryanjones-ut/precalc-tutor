import { NextResponse } from 'next/server';

/**
 * Metrics endpoint
 *
 * Returns application metrics in Prometheus format.
 * Can be scraped by monitoring systems like Prometheus, Grafana, or Datadog.
 */
export async function GET() {
  try {
    const metrics = {
      // Application metrics
      app_uptime_seconds: process.uptime(),
      app_memory_usage_bytes: process.memoryUsage().heapUsed,
      app_memory_total_bytes: process.memoryUsage().heapTotal,
      app_cpu_usage_percent: process.cpuUsage().user / 1000000, // Convert to seconds

      // Node.js metrics
      nodejs_version: process.version,
      nodejs_active_handles: (process as unknown as { _getActiveHandles: () => unknown[] })._getActiveHandles?.()?.length || 0,
      nodejs_active_requests: (process as unknown as { _getActiveRequests: () => unknown[] })._getActiveRequests?.()?.length || 0,

      // Environment
      environment: process.env.NODE_ENV,
      timestamp: Date.now(),
    };

    // Return in JSON format (can be converted to Prometheus format if needed)
    return NextResponse.json(metrics, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
