import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { securityAudit } from '@/lib/securityAudit';
import { rateLimiter } from '@/lib/rateLimit';

/**
 * Security Monitoring Dashboard API
 * Provides insights into security events and rate limiting
 * IMPORTANT: This endpoint should be restricted to admin users in production
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: In production, restrict to admin users only
    // For now, allow any authenticated user to view their own security events
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // In production, you should check if user has admin role
      // const isAdmin = await checkAdminRole(session.user.email);
      // if (!isAdmin) {
      //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      // }
      console.warn('[Security Monitoring] Production access - implement admin check');
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const type = searchParams.get('type');

    // Get security events
    let events = type 
      ? securityAudit.getEventsByType(type as any, limit)
      : securityAudit.getRecentEvents(limit);

    // Get rate limiting stats
    const rateLimitStats = rateLimiter.getStats();

    // Get failed authorization attempts (potential attacks)
    const failedAuthorizations = securityAudit.getFailedAuthorizations(50);

    // Calculate security metrics
    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
    const errorEvents = events.filter(e => e.severity === 'ERROR').length;
    const warningEvents = events.filter(e => e.severity === 'WARNING').length;
    const failedAuthCount = failedAuthorizations.length;

    // Group events by type
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get unique users with failed authorizations
    const suspiciousUsers = new Set(
      failedAuthorizations
        .filter(e => e.userEmail)
        .map(e => e.userEmail!)
    );

    return NextResponse.json({
      summary: {
        totalEvents,
        criticalEvents,
        errorEvents,
        warningEvents,
        failedAuthorizationAttempts: failedAuthCount,
        suspiciousUsers: suspiciousUsers.size,
      },
      rateLimiting: {
        totalKeys: rateLimitStats.totalKeys,
        blockedKeys: rateLimitStats.blockedKeys,
        activeRequests: rateLimitStats.activeRequests,
      },
      eventsByType,
      recentEvents: events.slice(0, 20), // Last 20 events
      failedAuthorizations: failedAuthorizations.slice(0, 10), // Last 10 failed attempts
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Security Monitoring] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Clear security audit logs (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: Only allow in development or for admin users
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // In production, check admin role
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const clearType = searchParams.get('type'); // 'audit' or 'ratelimit' or 'all'

    if (clearType === 'audit' || clearType === 'all') {
      securityAudit.clear();
    }

    if (clearType === 'ratelimit' || clearType === 'all') {
      rateLimiter.clear();
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearType || 'all'} security data`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Security Monitoring] Error clearing data:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
