import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Applications API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(request: NextRequest) {
  logger.debug('[Applications API Route] GET request received', { url: request.url });
  try {
    const session = await auth();
    logger.debug('[Applications API Route] Session', { authenticated: !!session });
    const searchParams = request.nextUrl.searchParams;

    // Convert frontend pagination params (page, pageSize) to backend params (skip, take)
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Build backend query params
    const backendParams = new URLSearchParams();
    backendParams.set('skip', skip.toString());
    backendParams.set('take', take.toString());

    // Forward other query params (status, searchTerm, etc.)
    if (searchParams.has('status')) {
      backendParams.set('status', searchParams.get('status')!);
    }
    if (searchParams.has('searchTerm')) {
      backendParams.set('searchTerm', searchParams.get('searchTerm')!);
    }
    if (searchParams.has('riskLevel')) {
      backendParams.set('riskLevel', searchParams.get('riskLevel')!);
    }
    if (searchParams.has('assignedTo')) {
      backendParams.set('assignedTo', searchParams.get('assignedTo')!);
    }
    if (searchParams.has('isOverdue')) {
      backendParams.set('isOverdue', searchParams.get('isOverdue')!);
    }
    if (searchParams.has('requiresManualReview')) {
      backendParams.set(
        'requiresManualReview',
        searchParams.get('requiresManualReview')!
      );
    }
    if (searchParams.has('fromDate')) {
      backendParams.set('fromDate', searchParams.get('fromDate')!);
    }
    if (searchParams.has('toDate')) {
      backendParams.set('toDate', searchParams.get('toDate')!);
    }
    if (searchParams.has('sortBy')) {
      backendParams.set('sortBy', searchParams.get('sortBy')!);
    }
    if (searchParams.has('sortDirection')) {
      backendParams.set('sortDirection', searchParams.get('sortDirection')!);
    }

    // Note: We intentionally do NOT pass partnerId for admin portal - admin should see all applications
    // Only pass partnerId if explicitly provided (for partner-specific views)
    if (searchParams.has('partnerId')) {
      backendParams.set('partnerId', searchParams.get('partnerId')!);
    }

    const queryString = backendParams.toString();
    logger.debug('[Applications API Route] Query params', {
      original: searchParams.toString(),
      converted: queryString,
      page,
      pageSize,
      skip,
      take,
    });

    // Build proxy URL - proxy will handle token injection and refresh
    // The backend endpoint is /api/v1/projections/cases (from ProjectionsController)
    // The proxy routes /api/proxy/api/v1/projections/cases to the backend
    const proxyPath = `/api/proxy/api/v1/projections/cases${queryString ? `?${queryString}` : ''}`;
    const proxyUrl = new URL(proxyPath, request.url);

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      const user = session.user as Record<string, unknown>;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role);
    }

    // Forward request through proxy (proxy handles token from httpOnly cookie)
    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // If projections API returns 404 or 503, try fallback to direct cases API
      // This ensures newly created cases are visible even before projections sync
      if (response.status === 404 || response.status === 503) {
        logger.debug(
          '[Applications API Route] Projections API unavailable, trying direct cases API fallback',
          { status: response.status }
        );

        try {
          // Build fallback URL to direct cases API (use same converted params)
          const fallbackPath = `/api/proxy/api/v1/cases${queryString ? `?${queryString}` : ''}`;
          const fallbackUrl = new URL(fallbackPath, request.url);

          const fallbackResponse = await fetch(fallbackUrl.toString(), {
            method: 'GET',
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(10000),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();

            // Transform onboarding API response to match projection format
            // Handle both flat and nested structures from cases API
            // Note: id should be the GUID (item.id), caseId is the display case number
            let transformedItems = (fallbackData.items || fallbackData.Items || []).map(
              (item: any) => ({
                id: item.id || item.caseId, // Use GUID (id) first, fallback to caseId only if id is missing
                caseId: item.caseNumber || item.case_number || '', // Case number for display
                type: item.type || '',
                status: item.status || '',
                partnerId: item.partnerId || item.partner_id || '',
                applicantFirstName:
                  item.applicantFirstName ||
                  item.applicant_first_name ||
                  item.applicant?.firstName ||
                  item.applicant?.first_name ||
                  '',
                applicantLastName:
                  item.applicantLastName ||
                  item.applicant_last_name ||
                  item.applicant?.lastName ||
                  item.applicant?.last_name ||
                  '',
                applicantEmail:
                  item.applicantEmail ||
                  item.applicant_email ||
                  item.applicant?.email ||
                  '',
                applicantCountry:
                  item.applicantCountry ||
                  item.applicant_country ||
                  item.applicant?.residentialAddress?.country ||
                  item.applicant?.residential_address?.country ||
                  '',
                businessLegalName:
                  item.businessLegalName ||
                  item.business_legal_name ||
                  item.business?.legalName ||
                  item.business?.legal_name ||
                  '',
                businessCountryOfRegistration:
                  item.businessCountryOfRegistration ||
                  item.business_country_of_registration ||
                  item.business?.countryOfRegistration ||
                  item.business?.country_of_registration ||
                  '',
                createdAt: item.createdAt || item.created_at || '',
                updatedAt: item.updatedAt || item.updated_at || '',
                assignedTo: item.assignedTo || item.assigned_to,
                assignedToName: item.assignedToName || item.assigned_to_name,
                riskLevel: item.riskLevel || item.risk_level || '',
                progressPercentage:
                  item.progressPercentage || item.progress_percentage || 0,
              })
            );

            // Filter out applications submitted by the current admin user as a partner
            if (session?.user?.email) {
              const userEmail = (session.user.email as string).toLowerCase().trim();
              const originalCount = transformedItems.length;
              transformedItems = transformedItems.filter((item: any) => {
                const applicantEmail = item.applicantEmail?.toLowerCase().trim();
                return applicantEmail !== userEmail;
              });

              if (originalCount !== transformedItems.length) {
                logger.debug(
                  '[Applications API Route] Filtered out own partner applications (fallback)',
                  {
                    originalCount,
                    filteredCount: transformedItems.length,
                    userEmail,
                  }
                );
              }
            }

            return NextResponse.json({
              items: transformedItems,
              totalCount: transformedItems.length,
              page: page,
              pageSize: pageSize,
            });
          }
        } catch (fallbackError) {
          logger.debug('[Applications API Route] Fallback to cases API also failed', {
            error:
              fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          });
          // Continue to return error response below
        }
      }

      let errorText = '';
      try {
        errorText = await response.text();
      } catch (readError) {
        errorText = `Failed to read error response: ${readError instanceof Error ? readError.message : 'Unknown error'}`;
      }

      logger.error(
        new Error(`Backend error: ${response.status} ${response.statusText}`),
        '[Applications API Route] Backend error',
        {
          tags: { error_type: 'api_backend_error' },
          extra: {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            url: proxyUrl.toString(),
          },
        }
      );

      return NextResponse.json(
        {
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText || 'No error details available',
          status: response.status,
        },
        { status: response.status }
      );
    }

    let data;
    try {
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        logger.warn('[Applications API Route] Empty response from backend');
        return NextResponse.json({ items: [], totalCount: 0, page: 1, pageSize: 50 });
      }
      data = JSON.parse(responseText);

      // Transform backend response format to frontend format
      // Backend returns: { Items, TotalCount, Skip, Take }
      // Frontend expects: { items, totalCount, page, pageSize }
      let items = data.Items || data.items || [];

      // Enrich projections that have missing company names or assignedTo
      // Check if any items need enrichment (missing businessLegalName/applicant names or assignedToName)
      const itemsNeedingEnrichment = items.filter((item: any) => {
        const hasCompanyName =
          item.businessLegalName ||
          item.business_legal_name ||
          (item.applicantFirstName && item.applicantLastName) ||
          (item.applicant_first_name && item.applicant_last_name);
        const hasAssignedTo =
          item.assignedToName ||
          item.assigned_to_name ||
          item.assignedTo ||
          item.assigned_to;
        return !hasCompanyName || !hasAssignedTo;
      });

      // If we have items needing enrichment, try to get details from cases API
      if (itemsNeedingEnrichment.length > 0 && itemsNeedingEnrichment.length <= 10) {
        // Only enrich if we have a reasonable number (max 10 to avoid performance issues)
        try {
          const caseIds = itemsNeedingEnrichment
            .map((item: any) => item.caseId || item.case_number || item.id)
            .filter((id: string) => id && id.trim().length > 0);

          if (caseIds.length > 0) {
            // Fetch case details in parallel (limit to 10 to avoid overwhelming the API)
            const enrichmentPromises = caseIds
              .slice(0, 10)
              .map(async (caseId: string) => {
                try {
                  const casePath = `/api/proxy/api/v1/cases/${encodeURIComponent(caseId)}`;
                  const caseUrl = new URL(casePath, request.url);
                  const caseResponse = await fetch(caseUrl.toString(), {
                    method: 'GET',
                    headers,
                    cache: 'no-store',
                    signal: AbortSignal.timeout(3000),
                  });

                  if (caseResponse.ok) {
                    const caseData = await caseResponse.json();
                    return { caseId, caseData };
                  }
                } catch (err) {
                  logger.debug('[Applications API Route] Failed to enrich case', {
                    caseId,
                    error: err instanceof Error ? err.message : 'Unknown error',
                  });
                }
                return null;
              });

            const enrichments = await Promise.all(enrichmentPromises);
            const enrichmentMap = new Map(
              enrichments
                .filter((e): e is { caseId: string; caseData: any } => e !== null)
                .map((e) => [e.caseId, e.caseData])
            );

            // Enrich items with case data
            items = items.map((item: any) => {
              const caseId = item.caseId || item.case_number || item.id;
              const caseData = enrichmentMap.get(caseId);

              if (caseData) {
                // Only enrich missing fields
                if (!item.businessLegalName && !item.business_legal_name) {
                  item.businessLegalName =
                    caseData.businessLegalName ||
                    caseData.business_legal_name ||
                    caseData.business?.legalName ||
                    caseData.business?.legal_name ||
                    '';
                }
                if (!item.applicantFirstName && !item.applicant_first_name) {
                  item.applicantFirstName =
                    caseData.applicantFirstName ||
                    caseData.applicant_first_name ||
                    caseData.applicant?.firstName ||
                    caseData.applicant?.first_name ||
                    '';
                }
                if (!item.applicantLastName && !item.applicant_last_name) {
                  item.applicantLastName =
                    caseData.applicantLastName ||
                    caseData.applicant_last_name ||
                    caseData.applicant?.lastName ||
                    caseData.applicant?.last_name ||
                    '';
                }
                if (!item.assignedToName && !item.assigned_to_name) {
                  item.assignedToName =
                    caseData.assignedToName || caseData.assigned_to_name || '';
                }
              }
              return item;
            });
          }
        } catch (enrichmentError) {
          logger.debug(
            '[Applications API Route] Enrichment failed, continuing with original data',
            {
              error:
                enrichmentError instanceof Error
                  ? enrichmentError.message
                  : 'Unknown error',
            }
          );
          // Continue with original items if enrichment fails
        }
      }

      // If projections returned empty results but we know cases exist, try fallback
      // This handles the case where projections table is out of sync
      if (items.length === 0 && (data.totalCount === 0 || data.TotalCount === 0)) {
        logger.debug(
          '[Applications API Route] Projections returned empty results, checking if fallback needed',
          { totalCount: data.totalCount || data.TotalCount }
        );

        // Try fallback to direct cases API to ensure we show cases even if projections are empty
        try {
          const fallbackPath = `/api/proxy/api/v1/cases${queryString ? `?${queryString}` : ''}`;
          const fallbackUrl = new URL(fallbackPath, request.url);

          const fallbackResponse = await fetch(fallbackUrl.toString(), {
            method: 'GET',
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(10000),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const fallbackItems = fallbackData.items || fallbackData.Items || [];

            // If fallback has cases but projections don't, trigger sync and use fallback data
            if (fallbackItems.length > 0) {
              logger.warn(
                '[Applications API Route] Projections empty but cases exist - using fallback and triggering sync',
                {
                  extra: { fallbackCount: fallbackItems.length },
                }
              );

              // Trigger sync in background (non-blocking)
              void fetch('/api/proxy/api/v1/sync?forceFullSync=false', {
                method: 'POST',
                headers,
              }).catch((err) => {
                logger.debug('[Applications API Route] Background sync trigger failed', {
                  extra: { error: err instanceof Error ? err.message : 'Unknown error' },
                });
              });

              // Transform and return fallback data
              // Handle both flat and nested structures from cases API
              // Note: id should be the GUID (item.id), caseId is the display case number
              let transformedItems = fallbackItems.map((item: any) => ({
                id: item.id || item.caseId, // Use GUID (id) first, fallback to caseId only if id is missing
                caseId: item.caseNumber || item.case_number || '', // Case number for display
                type: item.type || '',
                status: item.status || '',
                partnerId: item.partnerId || item.partner_id || '',
                applicantFirstName:
                  item.applicantFirstName ||
                  item.applicant_first_name ||
                  item.applicant?.firstName ||
                  item.applicant?.first_name ||
                  '',
                applicantLastName:
                  item.applicantLastName ||
                  item.applicant_last_name ||
                  item.applicant?.lastName ||
                  item.applicant?.last_name ||
                  '',
                applicantEmail:
                  item.applicantEmail ||
                  item.applicant_email ||
                  item.applicant?.email ||
                  '',
                applicantCountry:
                  item.applicantCountry ||
                  item.applicant_country ||
                  item.applicant?.residentialAddress?.country ||
                  item.applicant?.residential_address?.country ||
                  '',
                businessLegalName:
                  item.businessLegalName ||
                  item.business_legal_name ||
                  item.business?.legalName ||
                  item.business?.legal_name ||
                  '',
                businessCountryOfRegistration:
                  item.businessCountryOfRegistration ||
                  item.business_country_of_registration ||
                  item.business?.countryOfRegistration ||
                  item.business?.country_of_registration ||
                  '',
                createdAt: item.createdAt || item.created_at || '',
                updatedAt: item.updatedAt || item.updated_at || '',
                assignedTo: item.assignedTo || item.assigned_to,
                assignedToName: item.assignedToName || item.assigned_to_name,
                riskLevel: item.riskLevel || item.risk_level || '',
                progressPercentage:
                  item.progressPercentage || item.progress_percentage || 0,
              }));

              // Filter out applications submitted by the current admin user as a partner
              if (session?.user?.email) {
                const userEmail = (session.user.email as string).toLowerCase().trim();
                transformedItems = transformedItems.filter((item: any) => {
                  const applicantEmail = item.applicantEmail?.toLowerCase().trim();
                  return applicantEmail !== userEmail;
                });
              }

              return NextResponse.json({
                items: transformedItems,
                totalCount: transformedItems.length,
                page: page,
                pageSize: pageSize,
              });
            }
          }
        } catch (fallbackError) {
          logger.debug('[Applications API Route] Fallback check failed', {
            error:
              fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          });
        }
      }

      // Filter out applications submitted by the current admin user as a partner
      // This prevents admins from seeing their own partner-submitted applications
      if (session?.user?.email) {
        const userEmail = (session.user.email as string).toLowerCase().trim();
        const originalCount = items.length;
        items = items.filter((item: any) => {
          const applicantEmail = item.applicantEmail?.toLowerCase().trim();
          // Exclude if applicant email matches current admin user's email
          return applicantEmail !== userEmail;
        });

        if (originalCount !== items.length) {
          logger.debug('[Applications API Route] Filtered out own partner applications', {
            originalCount,
            filteredCount: items.length,
            userEmail,
          });
        }
      }

      const transformedData = {
        items: items,
        totalCount: items.length, // Use filtered count for totalCount
        page: page,
        pageSize: pageSize,
      };

      logger.debug('[Applications API Route] Response transformed', {
        itemsCount: transformedData.items.length,
        totalCount: transformedData.totalCount,
      });

      return NextResponse.json(transformedData);
    } catch (parseError) {
      logger.error(parseError, '[Applications API Route] Failed to parse response', {
        tags: { error_type: 'api_parse_error' },
        extra: { url: proxyUrl.toString() },
      });
      return NextResponse.json(
        {
          error: 'Invalid response from backend',
          message:
            parseError instanceof Error ? parseError.message : 'Failed to parse response',
        },
        { status: 502 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(error, '[Applications API Route] Request error', {
      tags: { error_type: 'api_request_error' },
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch applications',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
