import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerAccessToken } from '@/lib/get-server-token';

const PROJECTIONS_API_BASE = process.env.PROJECTIONS_API_BASE_URL || 'http://localhost:8007';
const ONBOARDING_API_BASE = process.env.ONBOARDING_API_BASE_URL || 'http://localhost:8001';

// Proxy to backend APIs to get full application details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    
    // Get access token from Redis (not from session)
    const accessToken = await getServerAccessToken(request);
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Azure AD token from Redis if available
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward development headers for authentication middleware
    const userHeaders = ['X-User-Id', 'X-User-Email', 'X-User-Name', 'X-User-Role'];
    for (const headerName of userHeaders) {
      const value = request.headers.get(headerName) || request.headers.get(headerName.toLowerCase());
      if (value) {
        headers[headerName] = value;
      } else if (session?.user) {
        const user = session.user as any;
        if (headerName === 'X-User-Email' && user.email) headers[headerName] = user.email;
        if (headerName === 'X-User-Name' && user.name) headers[headerName] = user.name;
        if (headerName === 'X-User-Id' && user.id) headers[headerName] = user.id;
        if (headerName === 'X-User-Role' && user.role) headers[headerName] = user.role;
      }
    }

    // Try to get by GUID first (if id is a GUID format)
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // First, try projections API (read model - faster, but might not be synced yet)
    if (isGuid) {
      // Try direct GET by ID first (projections API searches by caseId, not GUID)
      // So we'll skip this and go to search
    }

    // Use the projections API search endpoint which works for both caseId and GUID
    const searchUrl = `${PROJECTIONS_API_BASE}/api/v1/cases?searchTerm=${encodeURIComponent(id)}&take=10`;
    
    console.log(`[Admin Application Details] Searching projections API: ${searchUrl}`);

    let response = await fetch(searchUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    let foundInProjections = false;
    let projectionData = null;

    if (response.ok) {
      const searchData = await response.json();
      
      // Check if we found the application in search results
      if (searchData.items && Array.isArray(searchData.items) && searchData.items.length > 0) {
        // Try exact match first (caseId or id)
        let found = searchData.items.find((item: any) => 
          item.caseId === id || item.id === id || item.id?.toLowerCase() === id.toLowerCase()
        );
        
        // If not found, try case-insensitive match
        if (!found) {
          found = searchData.items.find((item: any) => 
            item.caseId?.toLowerCase() === id.toLowerCase() || 
            item.id?.toLowerCase() === id.toLowerCase()
          );
        }
        
        if (found) {
          foundInProjections = true;
          projectionData = found;
        }
      }
    }

    // If found in projections, return it
    if (foundInProjections && projectionData) {
      return NextResponse.json(projectionData);
    }

    // If not found in projections API, try onboarding API directly (source of truth)
    // This handles cases where the projection hasn't synced yet
    if (isGuid) {
      try {
        console.log(`[Admin Application Details] Not found in projections, trying onboarding API: ${ONBOARDING_API_BASE}/api/v1/cases/${id}`);
        
        const onboardingUrl = `${ONBOARDING_API_BASE}/api/v1/cases/${id}`;
        const onboardingResponse = await fetch(onboardingUrl, {
          method: 'GET',
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        });

        if (onboardingResponse.ok) {
          const onboardingData = await onboardingResponse.json();
          
          console.log(`[Admin Application Details] Found in onboarding API, transforming data...`);
          
          // Transform onboarding API response to match projection format
          // The onboarding API returns snake_case, we need to transform it
          const transformed = {
            id: onboardingData.id || id,
            caseId: onboardingData.case_number || onboardingData.caseNumber || '',
            type: onboardingData.type || '',
            status: onboardingData.status || '',
            partnerId: onboardingData.partner_id || onboardingData.partnerId || '',
            partnerName: onboardingData.partner_name || onboardingData.partnerName || '',
            partnerReferenceId: onboardingData.partner_reference_id || onboardingData.partnerReferenceId || '',
            applicantFirstName: onboardingData.applicant?.first_name || onboardingData.applicant?.firstName || '',
            applicantLastName: onboardingData.applicant?.last_name || onboardingData.applicant?.lastName || '',
            applicantEmail: onboardingData.applicant?.email || '',
            applicantPhone: onboardingData.applicant?.phone_number || onboardingData.applicant?.phoneNumber || '',
            applicantDateOfBirth: onboardingData.applicant?.date_of_birth || onboardingData.applicant?.dateOfBirth,
            applicantNationality: onboardingData.applicant?.nationality || '',
            applicantAddress: onboardingData.applicant?.residential_address?.street || onboardingData.applicant?.residentialAddress?.street || '',
            applicantCity: onboardingData.applicant?.residential_address?.city || onboardingData.applicant?.residentialAddress?.city || '',
            applicantCountry: onboardingData.applicant?.residential_address?.country || onboardingData.applicant?.residentialAddress?.country || '',
            businessLegalName: onboardingData.business?.legal_name || onboardingData.business?.legalName || '',
            businessRegistrationNumber: onboardingData.business?.registration_number || onboardingData.business?.registrationNumber || '',
            businessTaxId: onboardingData.business?.tax_id || onboardingData.business?.taxId || '',
            businessCountryOfRegistration: onboardingData.business?.country_of_registration || onboardingData.business?.countryOfRegistration || '',
            businessAddress: onboardingData.business?.registered_address?.street || onboardingData.business?.registeredAddress?.street || '',
            businessCity: onboardingData.business?.registered_address?.city || onboardingData.business?.registeredAddress?.city || '',
            businessIndustry: onboardingData.business?.industry || '',
            businessNumberOfEmployees: onboardingData.business?.number_of_employees || onboardingData.business?.numberOfEmployees,
            businessAnnualRevenue: onboardingData.business?.annual_revenue || onboardingData.business?.annualRevenue,
            businessWebsite: onboardingData.business?.website || '',
            createdAt: onboardingData.created_at || onboardingData.createdAt || new Date().toISOString(),
            updatedAt: onboardingData.updated_at || onboardingData.updatedAt || new Date().toISOString(),
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

          console.log(`[Admin Application Details] Successfully transformed and returning data`);
          return NextResponse.json(transformed);
        } else {
          const errorText = await onboardingResponse.text();
          console.error(`[Admin Application Details] Onboarding API returned ${onboardingResponse.status}:`, errorText);
        }
      } catch (e) {
        console.error('[Admin Application Details] Error fetching from onboarding API:', e);
        // Fall through to 404
      }
    }

    // If not found in either API, return 404
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[Admin Application Details] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch application details', 
        message: errorMessage,
        details: isConnectionError ? `Cannot connect to backend services. Please ensure they are running.` : undefined
      },
      { status: 500 }
    );
  }
}

