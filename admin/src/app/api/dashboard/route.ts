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
    // Use NEXTAUTH_URL or request origin for base URL to avoid SSL issues
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const proxyPath = `/api/proxy/api/v1/projections/dashboard${partnerId ? `?partnerId=${partnerId}` : ''}`;
    const proxyUrl = new URL(proxyPath, baseUrl);

    // Forward request to proxy with user identification headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      interface User {
        email?: string;
        name?: string;
        id?: string;
        role?: string;
      }
      const user: User = session.user as User;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role);
    }

    // Forward request through proxy (proxy handles token from httpOnly cookie)
    // Use 50s timeout (shorter than nginx's 60s) to fail faster and get better error messages
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(50000), // 50 seconds - shorter than nginx's 60s timeout
    });

    if (!response.ok) {
      let errorText = '';
      interface ErrorJson {
        message?: string;
        error?: string;
        [key: string]: unknown;
      }
      let errorJson: ErrorJson | null = null;
      try {
        errorText = await response.text();
        try {
          errorJson = JSON.parse(errorText) as ErrorJson;
        } catch {
          // Not JSON, use text as is
        }
      } catch {
        errorText = 'Failed to read error response';
      }

      logger.error(
        new Error(`Dashboard API error: ${response.status} ${response.statusText}`),
        'Dashboard API error',
        {
          tags: { error_type: 'api_backend_error' },
          extra: {
            url: proxyUrl.toString(),
            errorText,
            errorJson,
          },
        }
      );

      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorJson?.message || errorJson?.error || errorText,
          backendError: errorJson,
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as Record<string, unknown>;

    // Map snake_case backend response to camelCase frontend format
    const dataObj = data as Record<string, unknown>;
    const casesObj = (dataObj.cases || {}) as Record<string, unknown>;
    const performanceObj = (dataObj.performance || {}) as Record<string, unknown>;
    const riskObj = (dataObj.risk || {}) as Record<string, unknown>;
    const complianceObj = (dataObj.compliance || {}) as Record<string, unknown>;
    const mappedData = {
      generatedAt: dataObj.generated_at || dataObj.generatedAt,
      partnerId: dataObj.partner_id || dataObj.partnerId,
      partnerName: dataObj.partner_name || dataObj.partnerName,
      cases: {
        totalCases: casesObj.total_cases ?? casesObj.totalCases ?? 0,
        activeCases: casesObj.active_cases ?? casesObj.activeCases ?? 0,
        completedCases: casesObj.completed_cases ?? casesObj.completedCases ?? 0,
        rejectedCases: casesObj.rejected_cases ?? casesObj.rejectedCases ?? 0,
        pendingReviewCases:
          casesObj.pending_review_cases ?? casesObj.pendingReviewCases ?? 0,
        overdueCases: casesObj.overdue_cases ?? casesObj.overdueCases ?? 0,
        individualCases: casesObj.individual_cases ?? casesObj.individualCases ?? 0,
        corporateCases: casesObj.corporate_cases ?? casesObj.corporateCases ?? 0,
        trustCases: casesObj.trust_cases ?? casesObj.trustCases ?? 0,
        partnershipCases: casesObj.partnership_cases ?? casesObj.partnershipCases ?? 0,
        newCasesThisMonth:
          casesObj.new_cases_this_month ?? casesObj.newCasesThisMonth ?? 0,
        newCasesLastMonth:
          casesObj.new_cases_last_month ?? casesObj.newCasesLastMonth ?? 0,
        newCasesGrowthPercentage:
          casesObj.new_cases_growth_percentage ?? casesObj.newCasesGrowthPercentage ?? 0,
        completedCasesThisMonth:
          casesObj.completed_cases_this_month ?? casesObj.completedCasesThisMonth ?? 0,
        completedCasesLastMonth:
          casesObj.completed_cases_last_month ?? casesObj.completedCasesLastMonth ?? 0,
        completedCasesGrowthPercentage:
          casesObj.completed_cases_growth_percentage ??
          casesObj.completedCasesGrowthPercentage ??
          0,
      },
      performance: {
        averageCompletionTimeHours:
          performanceObj.average_completion_time_hours ??
          performanceObj.averageCompletionTimeHours ??
          0,
        medianCompletionTimeHours:
          performanceObj.median_completion_time_hours ??
          performanceObj.medianCompletionTimeHours ??
          0,
        completionRate:
          performanceObj.completion_rate ?? performanceObj.completionRate ?? 0,
        approvalRate: performanceObj.approval_rate ?? performanceObj.approvalRate ?? 0,
        rejectionRate: performanceObj.rejection_rate ?? performanceObj.rejectionRate ?? 0,
        slaComplianceRate:
          performanceObj.sla_compliance_rate ?? performanceObj.slaComplianceRate ?? 0,
        casesBreachingSla:
          performanceObj.cases_breaching_sla ?? performanceObj.casesBreachingSla ?? 0,
        averageResponseTimeHours:
          performanceObj.average_response_time_hours ??
          performanceObj.averageResponseTimeHours ??
          0,
      },
      risk: {
        highRiskCases: riskObj.high_risk_cases ?? riskObj.highRiskCases ?? 0,
        mediumRiskCases: riskObj.medium_risk_cases ?? riskObj.mediumRiskCases ?? 0,
        lowRiskCases: riskObj.low_risk_cases ?? riskObj.lowRiskCases ?? 0,
        averageRiskScore: riskObj.average_risk_score ?? riskObj.averageRiskScore ?? 0,
        riskFactorDistribution:
          riskObj.risk_factor_distribution ?? riskObj.riskFactorDistribution ?? {},
        casesRequiringManualReview:
          riskObj.cases_requiring_manual_review ??
          riskObj.casesRequiringManualReview ??
          0,
        escalatedCases: riskObj.escalated_cases ?? riskObj.escalatedCases ?? 0,
      },
      compliance: {
        amlScreeningsPending:
          complianceObj.aml_screenings_pending ?? complianceObj.amlScreeningsPending ?? 0,
        amlScreeningsCompleted:
          complianceObj.aml_screenings_completed ??
          complianceObj.amlScreeningsCompleted ??
          0,
        pepMatches: complianceObj.pep_matches ?? complianceObj.pepMatches ?? 0,
        sanctionsMatches:
          complianceObj.sanctions_matches ?? complianceObj.sanctionsMatches ?? 0,
        adverseMediaMatches:
          complianceObj.adverse_media_matches ?? complianceObj.adverseMediaMatches ?? 0,
        documentsAwaitingVerification:
          complianceObj.documents_awaiting_verification ??
          complianceObj.documentsAwaitingVerification ??
          0,
        documentsVerified:
          complianceObj.documents_verified ?? complianceObj.documentsVerified ?? 0,
        documentsRejected:
          complianceObj.documents_rejected ?? complianceObj.documentsRejected ?? 0,
        documentVerificationRate:
          complianceObj.document_verification_rate ??
          complianceObj.documentVerificationRate ??
          0,
        auditEventsToday:
          complianceObj.audit_events_today ?? complianceObj.auditEventsToday ?? 0,
        criticalAuditEvents:
          complianceObj.critical_audit_events ?? complianceObj.criticalAuditEvents ?? 0,
      },
      recentActivities: (Array.isArray(dataObj.recent_activities)
        ? dataObj.recent_activities
        : Array.isArray(dataObj.recentActivities)
          ? dataObj.recentActivities
          : []
      ).map((activity: Record<string, unknown>) => ({
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
      dailyTrends: (Array.isArray(dataObj.daily_trends)
        ? dataObj.daily_trends
        : Array.isArray(dataObj.dailyTrends)
          ? dataObj.dailyTrends
          : []
      ).map((trend: Record<string, unknown>) => ({
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
    
    // Check if it's a timeout error
    const isTimeout = errorMessage.includes('timeout') || 
                      errorMessage.includes('aborted') ||
                      errorMessage.includes('AbortError') ||
                      (error instanceof Error && error.name === 'AbortError');

    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'Dashboard API route error',
      {
        tags: { 
          error_type: isTimeout ? 'api_timeout_error' : 'api_route_error',
          timeout: String(isTimeout),
        },
        extra: {
          name: error instanceof Error ? error.name : undefined,
          isTimeout,
        },
      }
    );

    // Return 504 Gateway Timeout for timeout errors
    if (isTimeout) {
      return NextResponse.json(
        {
          error: 'Dashboard request timed out',
          message: 'The dashboard data request took too long to complete. This may be due to a large dataset or backend service issues.',
          suggestion: 'Please try again in a moment, or contact support if the issue persists.',
        },
        { status: 504 }
      );
    }

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
