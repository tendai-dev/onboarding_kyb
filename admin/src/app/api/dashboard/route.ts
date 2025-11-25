import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Dashboard API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');
    
    // Build proxy URL - proxy will handle token injection and refresh
    const proxyPath = `/api/proxy/api/v1/projections/dashboard${partnerId ? `?partnerId=${partnerId}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);
    
    // Forward request to proxy with user identification headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      const user = session.user as any;
      if (user.email) headers['X-User-Email'] = user.email;
      if (user.name) headers['X-User-Name'] = user.name;
      if (user.id) headers['X-User-Id'] = user.id;
      if (user.role) headers['X-User-Role'] = user.role;
    }
    
    // Forward request through proxy (proxy handles token from httpOnly cookie)
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(30000), // Increased timeout to 30 seconds
    });

    if (!response.ok) {
      let errorText = '';
      let errorJson: any = null;
      try {
        errorText = await response.text();
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // Not JSON, use text as is
        }
      } catch {
        errorText = 'Failed to read error response';
      }
      
      logger.error(new Error(`Dashboard API error: ${response.status} ${response.statusText}`), 'Dashboard API error', {
        tags: { error_type: 'api_backend_error' },
        extra: {
          url: proxyUrl.toString(),
          errorText,
          errorJson,
        }
      });
      
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`, 
          details: errorJson?.message || errorJson?.error || errorText,
          backendError: errorJson,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Map snake_case backend response to camelCase frontend format
    const mappedData = {
      generatedAt: data.generated_at || data.generatedAt,
      partnerId: data.partner_id || data.partnerId,
      partnerName: data.partner_name || data.partnerName,
      cases: {
        totalCases: data.cases?.total_cases ?? data.cases?.totalCases ?? 0,
        activeCases: data.cases?.active_cases ?? data.cases?.activeCases ?? 0,
        completedCases: data.cases?.completed_cases ?? data.cases?.completedCases ?? 0,
        rejectedCases: data.cases?.rejected_cases ?? data.cases?.rejectedCases ?? 0,
        pendingReviewCases: data.cases?.pending_review_cases ?? data.cases?.pendingReviewCases ?? 0,
        overdueCases: data.cases?.overdue_cases ?? data.cases?.overdueCases ?? 0,
        individualCases: data.cases?.individual_cases ?? data.cases?.individualCases ?? 0,
        corporateCases: data.cases?.corporate_cases ?? data.cases?.corporateCases ?? 0,
        trustCases: data.cases?.trust_cases ?? data.cases?.trustCases ?? 0,
        partnershipCases: data.cases?.partnership_cases ?? data.cases?.partnershipCases ?? 0,
        newCasesThisMonth: data.cases?.new_cases_this_month ?? data.cases?.newCasesThisMonth ?? 0,
        newCasesLastMonth: data.cases?.new_cases_last_month ?? data.cases?.newCasesLastMonth ?? 0,
        newCasesGrowthPercentage: data.cases?.new_cases_growth_percentage ?? data.cases?.newCasesGrowthPercentage ?? 0,
        completedCasesThisMonth: data.cases?.completed_cases_this_month ?? data.cases?.completedCasesThisMonth ?? 0,
        completedCasesLastMonth: data.cases?.completed_cases_last_month ?? data.cases?.completedCasesLastMonth ?? 0,
        completedCasesGrowthPercentage: data.cases?.completed_cases_growth_percentage ?? data.cases?.completedCasesGrowthPercentage ?? 0,
      },
      performance: {
        averageCompletionTimeHours: data.performance?.average_completion_time_hours ?? data.performance?.averageCompletionTimeHours ?? 0,
        medianCompletionTimeHours: data.performance?.median_completion_time_hours ?? data.performance?.medianCompletionTimeHours ?? 0,
        completionRate: data.performance?.completion_rate ?? data.performance?.completionRate ?? 0,
        approvalRate: data.performance?.approval_rate ?? data.performance?.approvalRate ?? 0,
        rejectionRate: data.performance?.rejection_rate ?? data.performance?.rejectionRate ?? 0,
        slaComplianceRate: data.performance?.sla_compliance_rate ?? data.performance?.slaComplianceRate ?? 0,
        casesBreachingSla: data.performance?.cases_breaching_sla ?? data.performance?.casesBreachingSla ?? 0,
        averageResponseTimeHours: data.performance?.average_response_time_hours ?? data.performance?.averageResponseTimeHours ?? 0,
      },
      risk: {
        highRiskCases: data.risk?.high_risk_cases ?? data.risk?.highRiskCases ?? 0,
        mediumRiskCases: data.risk?.medium_risk_cases ?? data.risk?.mediumRiskCases ?? 0,
        lowRiskCases: data.risk?.low_risk_cases ?? data.risk?.lowRiskCases ?? 0,
        averageRiskScore: data.risk?.average_risk_score ?? data.risk?.averageRiskScore ?? 0,
        riskFactorDistribution: data.risk?.risk_factor_distribution ?? data.risk?.riskFactorDistribution ?? {},
        casesRequiringManualReview: data.risk?.cases_requiring_manual_review ?? data.risk?.casesRequiringManualReview ?? 0,
        escalatedCases: data.risk?.escalated_cases ?? data.risk?.escalatedCases ?? 0,
      },
      compliance: {
        amlScreeningsPending: data.compliance?.aml_screenings_pending ?? data.compliance?.amlScreeningsPending ?? 0,
        amlScreeningsCompleted: data.compliance?.aml_screenings_completed ?? data.compliance?.amlScreeningsCompleted ?? 0,
        pepMatches: data.compliance?.pep_matches ?? data.compliance?.pepMatches ?? 0,
        sanctionsMatches: data.compliance?.sanctions_matches ?? data.compliance?.sanctionsMatches ?? 0,
        adverseMediaMatches: data.compliance?.adverse_media_matches ?? data.compliance?.adverseMediaMatches ?? 0,
        documentsAwaitingVerification: data.compliance?.documents_awaiting_verification ?? data.compliance?.documentsAwaitingVerification ?? 0,
        documentsVerified: data.compliance?.documents_verified ?? data.compliance?.documentsVerified ?? 0,
        documentsRejected: data.compliance?.documents_rejected ?? data.compliance?.documentsRejected ?? 0,
        documentVerificationRate: data.compliance?.document_verification_rate ?? data.compliance?.documentVerificationRate ?? 0,
        auditEventsToday: data.compliance?.audit_events_today ?? data.compliance?.auditEventsToday ?? 0,
        criticalAuditEvents: data.compliance?.critical_audit_events ?? data.compliance?.criticalAuditEvents ?? 0,
      },
      recentActivities: (data.recent_activities || data.recentActivities || []).map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        caseId: activity.case_id || activity.caseId,
        userId: activity.user_id || activity.userId,
        userName: activity.user_name || activity.userName,
        timestamp: activity.timestamp,
        severity: activity.severity,
        icon: activity.icon,
        color: activity.color,
      })),
      dailyTrends: (data.daily_trends || data.dailyTrends || []).map((trend: any) => ({
        date: trend.date,
        newCases: trend.new_cases ?? trend.newCases ?? 0,
        completedCases: trend.completed_cases ?? trend.completedCases ?? 0,
        rejectedCases: trend.rejected_cases ?? trend.rejectedCases ?? 0,
        averageRiskScore: trend.average_risk_score ?? trend.averageRiskScore ?? 0,
        completionRate: trend.completion_rate ?? trend.completionRate ?? 0,
        highRiskCases: trend.high_risk_cases ?? trend.highRiskCases ?? 0,
      })),
    };
    
    return NextResponse.json(mappedData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(error, 'Dashboard API route error', {
      tags: { error_type: 'api_route_error' },
      extra: {
        name: error instanceof Error ? error.name : undefined,
      }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data', 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

