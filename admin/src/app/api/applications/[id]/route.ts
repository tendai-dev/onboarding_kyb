import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { isGuid } from '@/lib/statusMapping';

/**
 * Application Details API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */

// Proxy to backend APIs to get full application details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  try {
    const session = await auth();

    // Build headers
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
      const user = session.user as User;
      if (user.email) headers['X-User-Email'] = String(user.email);
      if (user.name) headers['X-User-Name'] = String(user.name);
      if (user.id) headers['X-User-Id'] = String(user.id);
      if (user.role) headers['X-User-Role'] = String(user.role);
    }

    // Try to get by GUID first (if id is a GUID format)
    // Use the projections API search endpoint which works for both caseId and GUID
    // Route through proxy
    const searchPath = `/api/proxy/projections/v1/cases?searchTerm=${encodeURIComponent(id)}&take=10`;
    const searchUrl = new URL(searchPath, request.url);

    logger.debug('[Admin Application Details] Searching projections API via proxy', {
      url: searchUrl.toString(),
    });

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    let foundInProjections = false;
    interface ProjectionData {
      id?: string;
      caseNumber?: string;
      [key: string]: unknown;
    }
    let projectionData: ProjectionData | null = null;

    if (response.ok) {
      const searchData = await response.json();

      // Check if we found the application in search results
      if (
        searchData.items &&
        Array.isArray(searchData.items) &&
        searchData.items.length > 0
      ) {
        // Try exact match first (caseId or id)
        let found = searchData.items.find((item: unknown) => {
          const itemData = item as ProjectionData;
          const itemCaseId = String(itemData.caseId || itemData.caseNumber || '');
          const itemId = String(itemData.id || '');
          return (
            itemCaseId === id ||
            itemId === id ||
            itemId.toLowerCase() === id.toLowerCase()
          );
        });

        // If not found, try case-insensitive match
        if (!found) {
          found = searchData.items.find((item: unknown) => {
            const itemData = item as ProjectionData;
            const itemCaseId = String(
              itemData.caseId || itemData.caseNumber || ''
            ).toLowerCase();
            const itemId = String(itemData.id || '').toLowerCase();
            return itemCaseId === id.toLowerCase() || itemId === id.toLowerCase();
          });
        }

        if (found) {
          foundInProjections = true;
          projectionData = found as ProjectionData;
        }
      }
    }

    // If found in projections, return it
    if (foundInProjections && projectionData) {
      return NextResponse.json(projectionData);
    }

    // If not found in projections API, try onboarding API directly (source of truth)
    // This handles cases where the projection hasn't synced yet
    // Try GUID lookup first, then case number lookup
    if (isGuid(id)) {
      try {
        logger.debug(
          '[Admin Application Details] Not found in projections, trying onboarding API by GUID',
          { path: `/api/proxy/api/v1/cases/${id}` }
        );

        // Route through proxy
        const onboardingPath = `/api/proxy/api/v1/cases/${id}`;
        const onboardingUrl = new URL(onboardingPath, request.url);
        const onboardingResponse = await fetch(onboardingUrl.toString(), {
          method: 'GET',
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        });

        if (onboardingResponse.ok) {
          const onboardingData = await onboardingResponse.json();

          logger.debug(
            '[Admin Application Details] Found in onboarding API, transforming data'
          );

          // Transform onboarding API response to match projection format
          // The onboarding API returns snake_case, we need to transform it
          const transformed = {
            id: onboardingData.id || id,
            caseId: onboardingData.case_number || onboardingData.caseNumber || '',
            type: onboardingData.type || '',
            status: onboardingData.status || '',
            partnerId: onboardingData.partner_id || onboardingData.partnerId || '',
            partnerName: onboardingData.partner_name || onboardingData.partnerName || '',
            partnerReferenceId:
              onboardingData.partner_reference_id ||
              onboardingData.partnerReferenceId ||
              '',
            applicantFirstName:
              onboardingData.applicant?.first_name ||
              onboardingData.applicant?.firstName ||
              '',
            applicantLastName:
              onboardingData.applicant?.last_name ||
              onboardingData.applicant?.lastName ||
              '',
            applicantEmail: onboardingData.applicant?.email || '',
            applicantPhone:
              onboardingData.applicant?.phone_number ||
              onboardingData.applicant?.phoneNumber ||
              '',
            applicantDateOfBirth:
              onboardingData.applicant?.date_of_birth ||
              onboardingData.applicant?.dateOfBirth,
            applicantNationality: onboardingData.applicant?.nationality || '',
            applicantAddress:
              onboardingData.applicant?.residential_address?.street ||
              onboardingData.applicant?.residentialAddress?.street ||
              '',
            applicantCity:
              onboardingData.applicant?.residential_address?.city ||
              onboardingData.applicant?.residentialAddress?.city ||
              '',
            applicantCountry:
              onboardingData.applicant?.residential_address?.country ||
              onboardingData.applicant?.residentialAddress?.country ||
              '',
            businessLegalName:
              onboardingData.business?.legal_name ||
              onboardingData.business?.legalName ||
              '',
            businessRegistrationNumber:
              onboardingData.business?.registration_number ||
              onboardingData.business?.registrationNumber ||
              '',
            businessTaxId:
              onboardingData.business?.tax_id || onboardingData.business?.taxId || '',
            businessCountryOfRegistration:
              onboardingData.business?.country_of_registration ||
              onboardingData.business?.countryOfRegistration ||
              '',
            businessAddress:
              onboardingData.business?.registered_address?.street ||
              onboardingData.business?.registeredAddress?.street ||
              '',
            businessCity:
              onboardingData.business?.registered_address?.city ||
              onboardingData.business?.registeredAddress?.city ||
              '',
            businessIndustry: onboardingData.business?.industry || '',
            businessNumberOfEmployees:
              onboardingData.business?.number_of_employees ||
              onboardingData.business?.numberOfEmployees,
            businessAnnualRevenue:
              onboardingData.business?.annual_revenue ||
              onboardingData.business?.annualRevenue,
            businessWebsite: onboardingData.business?.website || '',
            createdAt:
              onboardingData.created_at ||
              onboardingData.createdAt ||
              new Date().toISOString(),
            updatedAt:
              onboardingData.updated_at ||
              onboardingData.updatedAt ||
              new Date().toISOString(),
            progressPercentage: 0,
            totalSteps: 0,
            completedSteps: 0,
            checklistStatus: '',
            checklistCompletionPercentage: 0,
            checklistTotalItems: 0,
            checklistCompletedItems: 0,
            checklistRequiredItems: 0,
            checklistCompletedRequiredItems: 0,
            riskLevel: 'Medium',
            riskScore: 0,
            riskStatus: '',
            riskFactorCount: 0,
            documentCount: 0,
            verifiedDocumentCount: 0,
            pendingDocumentCount: 0,
            rejectedDocumentCount: 0,
            requiresManualReview: false,
            hasComplianceIssues: false,
            metadataJson: JSON.stringify(onboardingData.metadata || {}),
          };

          logger.debug(
            '[Admin Application Details] Successfully transformed and returning data'
          );
          return NextResponse.json(transformed);
        } else {
          const errorText = await onboardingResponse.text();
          logger.warn(
            '[Admin Application Details] Onboarding API by GUID returned error',
            {
              tags: { error_type: 'api_backend_error' },
              extra: { status: onboardingResponse.status, errorText, id },
            }
          );
          // Don't throw - will try case number lookup below if not a GUID
        }
      } catch (e) {
        logger.warn(
          '[Admin Application Details] Error fetching from onboarding API by GUID',
          {
            tags: { error_type: 'api_fetch_error' },
            extra: { error: e instanceof Error ? e.message : String(e), id },
          }
        );
        // Fall through to try case number lookup
      }
    }

    // If not a GUID or GUID lookup failed, try case number lookup
    if (!isGuid(id) || !foundInProjections) {
      try {
        logger.debug('[Admin Application Details] Trying onboarding API by case number', {
          path: `/api/proxy/api/v1/cases/by-number/${id}`,
        });

        // Route through proxy
        const onboardingPath = `/api/proxy/api/v1/cases/by-number/${encodeURIComponent(id)}`;
        const onboardingUrl = new URL(onboardingPath, request.url);
        const onboardingResponse = await fetch(onboardingUrl.toString(), {
          method: 'GET',
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        });

        if (onboardingResponse.ok) {
          const onboardingData = await onboardingResponse.json();

          logger.debug(
            '[Admin Application Details] Found in onboarding API by case number, transforming data'
          );

          // Transform onboarding API response to match projection format
          // The onboarding API returns snake_case, we need to transform it
          const transformed = {
            id: onboardingData.id || id,
            caseId: onboardingData.case_number || onboardingData.caseNumber || id,
            type: onboardingData.type || '',
            status: onboardingData.status || '',
            partnerId: onboardingData.partner_id || onboardingData.partnerId || '',
            partnerName: onboardingData.partner_name || onboardingData.partnerName || '',
            partnerReferenceId:
              onboardingData.partner_reference_id ||
              onboardingData.partnerReferenceId ||
              '',
            applicantFirstName:
              onboardingData.applicant?.first_name ||
              onboardingData.applicant?.firstName ||
              '',
            applicantLastName:
              onboardingData.applicant?.last_name ||
              onboardingData.applicant?.lastName ||
              '',
            applicantEmail: onboardingData.applicant?.email || '',
            applicantPhone:
              onboardingData.applicant?.phone_number ||
              onboardingData.applicant?.phoneNumber ||
              '',
            applicantDateOfBirth:
              onboardingData.applicant?.date_of_birth ||
              onboardingData.applicant?.dateOfBirth,
            applicantNationality: onboardingData.applicant?.nationality || '',
            applicantAddress:
              onboardingData.applicant?.residential_address?.street ||
              onboardingData.applicant?.residentialAddress?.street ||
              '',
            applicantCity:
              onboardingData.applicant?.residential_address?.city ||
              onboardingData.applicant?.residentialAddress?.city ||
              '',
            applicantCountry:
              onboardingData.applicant?.residential_address?.country ||
              onboardingData.applicant?.residentialAddress?.country ||
              '',
            businessLegalName:
              onboardingData.business?.legal_name ||
              onboardingData.business?.legalName ||
              '',
            businessRegistrationNumber:
              onboardingData.business?.registration_number ||
              onboardingData.business?.registrationNumber ||
              '',
            businessTaxId:
              onboardingData.business?.tax_id || onboardingData.business?.taxId || '',
            businessCountryOfRegistration:
              onboardingData.business?.country_of_registration ||
              onboardingData.business?.countryOfRegistration ||
              '',
            businessAddress:
              onboardingData.business?.registered_address?.street ||
              onboardingData.business?.registeredAddress?.street ||
              '',
            businessCity:
              onboardingData.business?.registered_address?.city ||
              onboardingData.business?.registeredAddress?.city ||
              '',
            businessIndustry: onboardingData.business?.industry || '',
            businessNumberOfEmployees:
              onboardingData.business?.number_of_employees ||
              onboardingData.business?.numberOfEmployees,
            businessAnnualRevenue:
              onboardingData.business?.annual_revenue ||
              onboardingData.business?.annualRevenue,
            businessWebsite: onboardingData.business?.website || '',
            createdAt:
              onboardingData.created_at ||
              onboardingData.createdAt ||
              new Date().toISOString(),
            updatedAt:
              onboardingData.updated_at ||
              onboardingData.updatedAt ||
              new Date().toISOString(),
            progressPercentage: 0,
            totalSteps: 0,
            completedSteps: 0,
            checklistStatus: '',
            checklistCompletionPercentage: 0,
            checklistTotalItems: 0,
            checklistCompletedItems: 0,
            checklistRequiredItems: 0,
            checklistCompletedRequiredItems: 0,
            riskLevel: 'Medium',
            riskScore: 0,
            riskStatus: '',
            riskFactorCount: 0,
            documentCount: 0,
            verifiedDocumentCount: 0,
            pendingDocumentCount: 0,
            rejectedDocumentCount: 0,
            requiresManualReview: false,
            hasComplianceIssues: false,
            metadataJson: JSON.stringify(onboardingData.metadata || {}),
          };

          logger.debug(
            '[Admin Application Details] Successfully transformed and returning data (by case number)'
          );
          return NextResponse.json(transformed);
        } else {
          const errorText = await onboardingResponse.text();
          logger.warn(
            '[Admin Application Details] Onboarding API by case number returned error',
            {
              tags: { error_type: 'api_backend_error' },
              extra: { status: onboardingResponse.status, errorText, id },
            }
          );
        }
      } catch (e) {
        logger.warn(
          '[Admin Application Details] Error fetching from onboarding API by case number',
          {
            tags: { error_type: 'api_fetch_error' },
            extra: { error: e instanceof Error ? e.message : String(e), id },
          }
        );
        // Fall through to 404
      }
    }

    // If not found in either API, return 404 with helpful message
    logger.warn('[Admin Application Details] Application not found in any API', {
      tags: { error_type: 'application_not_found' },
      extra: {
        id,
        isGuid: isGuid(id),
        searchedProjections: true,
        searchedOnboardingByGuid: isGuid(id),
        searchedOnboardingByCaseNumber: true,
      },
    });
    return NextResponse.json(
      {
        error: 'Application not found',
        message: `No application found with ID: ${id}`,
        details: 'The application may not exist or may have been deleted.',
      },
      { status: 404 }
    );
  } catch (error) {
    logger.error(error, '[Admin Application Details] Unexpected error', {
      tags: { error_type: 'api_route_error' },
      extra: {
        id,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError =
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('Failed to fetch');

    return NextResponse.json(
      {
        error: 'Failed to fetch application details',
        message: errorMessage,
        details: isConnectionError
          ? 'Cannot connect to backend services. Please ensure they are running and try again.'
          : 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
