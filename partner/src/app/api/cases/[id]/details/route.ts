/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  logOwnershipValidationSuccess,
  logOwnershipValidationFailure,
  logDataAccess,
} from '@/lib/securityAudit';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rateLimit';
import { validateCaseId } from '@/lib/requestValidation';

// Entity configuration is now part of onboarding-api (port 8001)
// In Docker, use service name 'onboarding-api', otherwise localhost
const isDocker = process.env.NODE_ENV === 'production' || process.env.VERCEL !== '1';
const dockerFallback = isDocker ? 'http://onboarding-api:8001' : 'http://localhost:8001';
const ENTITY_CONFIG_API_BASE =
  process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL ||
  process.env.ENTITY_CONFIG_API_BASE_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.PROXY_TARGET ||
  process.env.ONBOARDING_TARGET ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  dockerFallback;

/**
 * Case details API route - routes through centralized proxy for BFF pattern
 * All token handling is done by the proxy, ensuring sessionId never exposed to client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // In Next.js 15+, params might be a Promise
  const resolvedParams = params instanceof Promise ? await params : params;
  const { id } = resolvedParams;

  if (!id) {
    return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
  }

  // SECURITY: Validate case ID format to prevent injection attacks
  const caseIdValidation = validateCaseId(id);
  if (!caseIdValidation.valid) {
    return NextResponse.json(
      { 
        error: 'Invalid case ID',
        details: caseIdValidation.reason 
      },
      { status: 400 }
    );
  }

  const isGuid = caseIdValidation.isGuid;

  try {
    const session = await getServerSession(authOptions);
    
    // SECURITY: Rate limiting - prevent enumeration attacks
    const rateLimitKey = session?.user?.email || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = checkRateLimit(rateLimitKey, 60, 60000); // 60 requests per minute
    
    if (rateLimitResult) {
      return NextResponse.json(rateLimitResult.body, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    // Get user email from session for ownership validation
    let userEmail = '';
    let userPartnerId: string | null = null;
    if (session?.user) {
      userEmail = session.user.email || '';
    }

    // Fallback to headers if session doesn't have email (for compatibility)
    if (!userEmail) {
      userEmail =
        request.headers.get('X-User-Email') || request.headers.get('x-user-email') || '';
    }

    // Get partnerId from backend (single source of truth) for ownership validation
    // Backend uses MD5 hash, frontend must NOT generate locally (UUID v5 mismatch)
    if (userEmail) {
      try {
        // Build headers for backend call
        const backendHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        };
        
        // Forward cookies for session-based authentication
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
          backendHeaders['Cookie'] = cookieHeader;
        }
        
        // Forward user identification headers
        if (session?.user) {
          const user = session.user as any;
          if (user.name) backendHeaders['X-User-Name'] = user.name;
          if (user.id) backendHeaders['X-User-Id'] = user.id;
        }
        
        // Call backend to get PartnerId (single source of truth)
        const internalBaseUrl = process.env.NODE_ENV === 'production' 
          ? 'http://localhost:3000' 
          : (process.env.NEXTAUTH_URL || request.url.split('/api')[0]);
        const partnerIdUrl = new URL('/api/proxy/api/v1/partner/id', internalBaseUrl);
        
        const partnerIdResponse = await fetch(partnerIdUrl.toString(), {
          method: 'GET',
          headers: backendHeaders,
          cache: 'no-store',
        });
        
        if (partnerIdResponse.ok) {
          const partnerIdData = await partnerIdResponse.json();
          userPartnerId = partnerIdData.partnerId || partnerIdData.partner_id;
          console.info('[API Route] 👤 User identification (from backend):', {
            email: userEmail,
            partnerId: userPartnerId,
          });
        } else {
          console.warn('[API Route] ⚠️ Could not get PartnerId from backend:', partnerIdResponse.status);
          // Don't fail - we'll still try to fetch the case, ownership check will be skipped if no partnerId
        }
      } catch (error) {
        console.error('[API Route] Failed to get PartnerId from backend:', error);
        // Don't fail the request - ownership validation will be skipped if partnerId is null
      }
    }

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // CRITICAL: Forward cookies for session-based authentication
    // The proxy uses auth() which reads from httpOnly cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Add user identification headers (proxy will inject token from Redis)
    if (session?.user) {
      const user = session.user as any;
      if (user.email) headers['X-User-Email'] = user.email;
      if (user.name) headers['X-User-Name'] = user.name;
      if (user.id) headers['X-User-Id'] = user.id;
    }

    // Forward user identification headers from request
    const userHeaders = [
      'X-User-Id',
      'X-User-Email',
      'X-User-Name',
      'X-User-Role',
    ] as const;
    for (const headerName of userHeaders) {
      const value =
        request.headers.get(headerName) || request.headers.get(headerName.toLowerCase());
      if (value) {
        // eslint-disable-next-line security/detect-object-injection
        headers[headerName] = value;
      }
    }

    // Try Projections API first via proxy
    // Use relative URL for internal server-side fetch to avoid SSL issues
    let proxyPath: string;
    if (isGuid) {
      proxyPath = `/api/proxy/api/v1/projections/cases/${id}`;
    } else {
      // For case numbers, try by-number endpoint
      proxyPath = `/api/proxy/api/v1/cases/by-number/${encodeURIComponent(id)}`;
    }

    // Construct internal URL - use http://localhost for server-side calls to avoid SSL errors
    // In Docker/production, use http://localhost:3000 for internal server-side fetch
    // This avoids SSL errors when making internal API calls
    const internalBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3000' 
      : (process.env.NEXTAUTH_URL || request.url.split('/api')[0]);
    const proxyUrl = new URL(proxyPath, internalBaseUrl);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Try Projections API first via proxy (proxy handles token from httpOnly cookie)
      let response = await fetch(proxyUrl.toString(), {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If Projections API returns 404, try Onboarding API as fallback via proxy
      if (response.status === 404) {
        const onboardingProxyPath = isGuid
          ? `/api/proxy/api/v1/cases/${id}`
          : `/api/proxy/api/v1/cases/by-number/${encodeURIComponent(id)}`;

        // Use same base URL construction for consistency
        const onboardingProxyUrl = new URL(onboardingProxyPath, internalBaseUrl);
        const onboardingController = new AbortController();
        const onboardingTimeoutId = setTimeout(() => onboardingController.abort(), 10000);

        try {
          response = await fetch(onboardingProxyUrl.toString(), {
            method: 'GET',
            headers,
            cache: 'no-store',
            signal: onboardingController.signal,
          });
          clearTimeout(onboardingTimeoutId);
        } catch (onboardingError) {
          clearTimeout(onboardingTimeoutId);
          throw onboardingError;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        // Return the actual error response from the backend
        return NextResponse.json(data, { status: response.status });
      }

      // Validate ownership if user is logged in
      if (userPartnerId && userEmail) {
        const casePartnerId = data.partnerId || data.partner_id;

        // Log ownership validation details for debugging
        console.info('[API Route] 🔍 Ownership validation check:', {
          casePartnerId,
          userPartnerId,
          caseId: id,
          userEmail,
          match: casePartnerId?.toLowerCase() === userPartnerId.toLowerCase(),
        });

        // SECURITY: Enforce ownership validation
        if (!casePartnerId) {
          console.error('[API Route] ❌ Case has no partnerId - cannot validate ownership');
          logOwnershipValidationFailure(userEmail, 'case', id, {
            reason: 'missing_partner_id',
          });
          return NextResponse.json(
            { 
              error: 'Forbidden',
              details: 'Case ownership cannot be verified'
            },
            { status: 403 }
          );
        }

        if (casePartnerId.toLowerCase() !== userPartnerId.toLowerCase()) {
          console.error('[API Route] ❌ Ownership validation FAILED:', {
            casePartnerId,
            userPartnerId,
            caseId: id,
          });
          logOwnershipValidationFailure(userEmail, 'case', id, {
            casePartnerId,
            userPartnerId,
            reason: 'partner_id_mismatch',
          });
          return NextResponse.json(
            { 
              error: 'Forbidden',
              details: 'You do not have permission to access this case'
            },
            { status: 403 }
          );
        }

        console.info('[API Route] ✅ Ownership validation PASSED');
        logOwnershipValidationSuccess(userEmail, 'case', id);
        logDataAccess(userEmail, 'case', id, 'READ');
      } else {
        // No user session - require authentication
        console.error('[API Route] ❌ No user session - authentication required');
        const { logAuthenticationFailure } = await import('@/lib/securityAudit');
        logAuthenticationFailure({ resource: 'case', resourceId: id });
        
        // Add security headers to error response
        const headers = new Headers();
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'DENY');
        headers.set('Content-Type', 'application/json');
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Unauthorized',
            details: 'Authentication required to access case details'
          }),
          { status: 401, headers }
        );
      }

      // Extract form configuration identifiers from case metadata
      // The metadata can be in different formats depending on the API response
      // Backend uses snake_case (metadata_json), but we also check camelCase variants
      let metadata: Record<string, any> = {};
      const rawMetadata = data.metadata_json || data.metadataJson || data.metadata;
      
      console.info('[API Route] 🔍 Metadata extraction:', {
        hasMetadataJson: !!data.metadata_json,
        hasMetadataJsonCamel: !!data.metadataJson,
        hasMetadata: !!data.metadata,
        rawMetadataType: typeof rawMetadata,
        rawMetadataLength: typeof rawMetadata === 'string' ? rawMetadata.length : 'N/A',
      });
      
      if (rawMetadata) {
        metadata =
          typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : rawMetadata;
        console.info('[API Route] ✅ Parsed metadata keys:', Object.keys(metadata).slice(0, 10));
      }

      // Ensure metadata is an object
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        metadata = {};
      }

      // Clean up duplicated values (handle space-separated or comma-separated strings)
      // The backend sometimes duplicates values like "abc123 abc123" or "abc123, abc123"
      const cleanValue = (value: unknown): string | null => {
        if (value === null || value === undefined) return null;
        const str = String(value).trim();
        if (!str || str === 'null' || str === 'undefined') return null;
        
        // Check for space-separated duplicates (e.g., "abc123 abc123")
        const parts = str.split(' ');
        if (parts.length === 2 && parts[0] === parts[1]) {
          return parts[0].trim();
        }
        
        // Check for comma-separated duplicates
        if (str.includes(',')) {
          return str.split(',')[0].trim();
        }
        
        return str;
      };

      const rawFormConfigId = metadata?.form_config_id || metadata?.formConfigId;
      const rawFormVersion = metadata?.form_version || metadata?.formVersion;
      const rawEntityTypeCode =
        metadata?.entity_type_code || metadata?.entityTypeCode || data.entityType;

      const formConfigId = cleanValue(rawFormConfigId);
      const formVersion = cleanValue(rawFormVersion);
      const entityTypeCode = cleanValue(rawEntityTypeCode);
      
      console.info('[API Route] 📋 Extracted form config:', {
        rawFormConfigId,
        rawFormVersion,
        rawEntityTypeCode,
        cleanedFormConfigId: formConfigId,
        cleanedFormVersion: formVersion,
        cleanedEntityTypeCode: entityTypeCode,
      });

      // Fetch entity configuration schema if identifiers are available
      // Make this non-blocking - use Promise.race to timeout quickly if backend is slow
      let formSchema = null;
      if (formConfigId || entityTypeCode) {
        try {
          let entityConfigUrl: string | null = null;

          if (formConfigId) {
            // Fetch by form config ID (most specific) - this is the entity type ID
            entityConfigUrl = `${ENTITY_CONFIG_API_BASE}/api/v1/entity-types/${formConfigId}`;
            if (formVersion) {
              entityConfigUrl += `?version=${encodeURIComponent(formVersion)}&includeRequirements=true`;
            } else {
              entityConfigUrl += `?includeRequirements=true`;
            }
          } else if (entityTypeCode) {
            // Fetch by entity type code (fallback)
            // First get all entity types and find the one matching the code
            const allTypesUrl = `${ENTITY_CONFIG_API_BASE}/api/v1/entity-types?includeRequirements=true`;
            let allTypesResponse;
            try {
              allTypesResponse = await fetch(allTypesUrl, {
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(15000), // Increased timeout to 15s for slow backend
              });
            } catch (fetchError) {
              console.warn(`[API Route] Failed to fetch entity types list (non-critical):`, fetchError);
              allTypesResponse = null;
            }

            if (allTypesResponse?.ok) {
              const allTypes = await allTypesResponse.json();
              const matchingType = Array.isArray(allTypes)
                ? allTypes.find((et: { code?: string }) => {
                    const code = et.code?.toLowerCase()?.trim();
                    const searchCode = entityTypeCode.toLowerCase().trim();
                    return (
                      code === searchCode ||
                      code?.replace(/_/g, '') === searchCode.replace(/_/g, '') ||
                      code?.replace(/-/g, '_') === searchCode.replace(/-/g, '_')
                    );
                  })
                : null;

              if (matchingType?.id) {
                entityConfigUrl = `${ENTITY_CONFIG_API_BASE}/api/v1/entity-types/${matchingType.id}?includeRequirements=true`;
              } else {
                console.warn(
                  `Entity type with code "${entityTypeCode}" not found. Available codes:`,
                  Array.isArray(allTypes)
                    ? allTypes.map((et: Record<string, unknown>) => et.code).join(', ')
                    : 'none'
                );
              }
            }
          }

          if (entityConfigUrl) {
            console.info(`[API Route] Fetching entity config from: ${entityConfigUrl}`);
            // Use Promise.race to timeout quickly if backend is slow - don't block the response
            const fetchPromise = fetch(entityConfigUrl, {
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(8000), // 8s max wait - matches Promise.race timeout
            });
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Entity config fetch timeout')), 8000); // 8s max wait
            });
            
            try {
              const entityConfigResponse = await Promise.race([fetchPromise, timeoutPromise]);
              
              if (entityConfigResponse.ok) {
                formSchema = await entityConfigResponse.json();
                console.info(
                  `[API Route] ✅ Successfully fetched form schema for ${formConfigId || entityTypeCode}`
                );
                
                // Also fetch wizard configuration for this entity type
                // This ensures we use the wizard config that matches the form schema version
                if (formSchema?.id) {
                  try {
                    const wizardConfigUrl = `${ENTITY_CONFIG_API_BASE}/api/v1/wizardconfigurations/by-entity-type/${formSchema.id}`;
                    console.info(`[API Route] Fetching wizard config from: ${wizardConfigUrl}`);
                    const wizardResponse = await fetch(wizardConfigUrl, {
                      headers: { 'Content-Type': 'application/json' },
                      signal: AbortSignal.timeout(5000),
                    });
                    if (wizardResponse.ok) {
                      const wizardConfig = await wizardResponse.json();
                      // Attach wizard configuration to form schema so frontend doesn't need separate fetch
                      formSchema.wizardConfiguration = wizardConfig;
                      console.info(`[API Route] ✅ Successfully fetched wizard configuration with ${wizardConfig?.steps?.length || 0} steps`);
                    } else {
                      console.warn(`[API Route] ⚠️ No wizard configuration found for entity type ${formSchema.id}`);
                    }
                  } catch (wizardError) {
                    console.warn(`[API Route] ⚠️ Error fetching wizard config (non-critical):`, wizardError);
                  }
                }
              } else {
                const errorText = await entityConfigResponse.text();
                console.warn(
                  `[API Route] ❌ Failed to fetch entity configuration: ${entityConfigResponse.status} - ${errorText}`
                );
              }
            } catch (timeoutError) {
              console.warn(
                `[API Route] ⚠️ Entity config fetch timed out or failed (non-critical, continuing without schema):`,
                timeoutError instanceof Error ? timeoutError.message : String(timeoutError)
              );
              // Continue without schema - frontend can still render
            }
          } else {
            console.warn(
              `[API Route] ⚠️ No entity config URL constructed. formConfigId: ${formConfigId}, entityTypeCode: ${entityTypeCode}`
            );
          }
        } catch (schemaError) {
          const errorMessage = schemaError instanceof Error ? schemaError.message : String(schemaError);
          console.warn('[API Route] ⚠️ Error fetching form schema (non-critical, continuing):', errorMessage);
          // Continue without schema - frontend can still render with fallback
          // Don't throw - this is a non-critical enhancement
        }
      } else {
        console.warn(
          `[API Route] ⚠️ No formConfigId or entityTypeCode available. formConfigId: ${formConfigId}, entityTypeCode: ${entityTypeCode}`
        );
      }

      // Structure the response - Projections API returns data at root level
      // Extract all the case fields from the root data object with comprehensive fallbacks
      const caseData = {
        // Applicant fields - with multiple fallback sources
        applicantFirstName:
          data.applicantFirstName ||
          data.applicant_first_name ||
          metadata.applicant_first_name ||
          metadata.applicantFirstName ||
          '',
        applicantLastName:
          data.applicantLastName ||
          data.applicant_last_name ||
          metadata.applicant_last_name ||
          metadata.applicantLastName ||
          '',
        applicantEmail:
          data.applicantEmail ||
          data.applicant_email ||
          metadata.applicant_email ||
          metadata.applicantEmail ||
          metadata.email ||
          data.email ||
          '',
        applicantPhone:
          data.applicantPhone ||
          data.applicant_phone ||
          metadata.applicant_phone ||
          metadata.applicantPhone ||
          metadata.phone ||
          data.phone ||
          '',
        applicantDateOfBirth:
          data.applicantDateOfBirth ||
          data.applicant_date_of_birth ||
          metadata.applicant_date_of_birth ||
          metadata.applicantDateOfBirth ||
          metadata.date_of_birth ||
          '',
        applicantNationality:
          data.applicantNationality ||
          data.applicant_nationality ||
          metadata.applicant_nationality ||
          metadata.applicantNationality ||
          metadata.nationality ||
          '',
        applicantAddress:
          data.applicantAddress ||
          data.applicant_address ||
          metadata.applicant_address ||
          metadata.applicantAddress ||
          metadata.address ||
          '',
        applicantCity:
          data.applicantCity ||
          data.applicant_city ||
          metadata.applicant_city ||
          metadata.applicantCity ||
          metadata.city ||
          '',
        applicantCountry:
          data.applicantCountry ||
          data.applicant_country ||
          metadata.applicant_country ||
          metadata.applicantCountry ||
          metadata.country ||
          '',
        // Business fields - with multiple fallback sources
        businessLegalName:
          data.businessLegalName ||
          data.business_legal_name ||
          metadata.legal_name ||
          metadata.businessLegalName ||
          metadata.legalName ||
          metadata.companyname ||
          metadata.company_name ||
          '',
        businessRegistrationNumber:
          data.businessRegistrationNumber ||
          data.business_registration_number ||
          metadata.registration_number ||
          metadata.registrationNumber ||
          metadata.business_registration_number ||
          '',
        businessTaxId:
          data.businessTaxId ||
          data.business_tax_id ||
          metadata.tax_id ||
          metadata.taxId ||
          metadata.tax_number ||
          metadata.taxNumber ||
          '',
        businessCountryOfRegistration:
          data.businessCountryOfRegistration ||
          data.business_country_of_registration ||
          metadata.country_of_incorporation ||
          metadata.countryOfIncorporation ||
          metadata.country_of_registration ||
          metadata.countryOfRegistration ||
          data.country ||
          metadata.country ||
          '',
        businessAddress:
          data.businessAddress ||
          data.business_address ||
          metadata.business_address ||
          metadata.businessAddress ||
          '',
        registeredAddress: (() => {
          // Check if address is an object (from backend Business.RegisteredAddress)
          const business = data.business || {};
          const registeredAddr = business.registeredAddress || business.RegisteredAddress;
          if (registeredAddr && typeof registeredAddr === 'object') {
            // Serialize address object to string
            const parts = [
              registeredAddr.street || registeredAddr.Street,
              registeredAddr.street2 || registeredAddr.Street2,
              registeredAddr.city || registeredAddr.City,
              registeredAddr.state || registeredAddr.State,
              registeredAddr.postalCode || registeredAddr.PostalCode,
              registeredAddr.country || registeredAddr.Country,
            ].filter(Boolean);
            if (parts.length > 0) {
              return parts.join(', ');
            }
          }
          
          // Check string values
          return (
            data.registeredAddress ||
            data.registered_address ||
            metadata.registered_address ||
            metadata.registeredAddress ||
            metadata['Registered Address'] ||
            data.businessAddress ||
            data.business_address ||
            metadata.business_address ||
            metadata.businessAddress ||
            ''
          );
        })(),
        businessCity:
          data.businessCity ||
          data.business_city ||
          metadata.business_city ||
          metadata.businessCity ||
          metadata.city ||
          '',
        businessIndustry:
          data.businessIndustry ||
          data.business_industry ||
          metadata.business_industry ||
          metadata.businessIndustry ||
          metadata.industry ||
          metadata.nature_of_business ||
          metadata.natureOfBusiness ||
          '',
        businessNumberOfEmployees:
          data.businessNumberOfEmployees ||
          data.business_number_of_employees ||
          metadata.number_of_employees ||
          metadata.numberOfEmployees ||
          '',
        businessAnnualRevenue:
          data.businessAnnualRevenue ||
          data.business_annual_revenue ||
          metadata.annual_revenue ||
          metadata.annualRevenue ||
          '',
        businessWebsite:
          data.businessWebsite ||
          data.business_website ||
          metadata.business_website ||
          metadata.businessWebsite ||
          metadata.website ||
          '',
        // Include metadata for comprehensive access
        metadata: metadata,
      };

      const responseData = {
        ...data,
        formSchema: formSchema,
        formConfigId: formConfigId,
        formVersion: formVersion,
        entityTypeCode: entityTypeCode,
        // Include structured caseData for frontend
        caseData: caseData,
        // Also include metadata at root for easy access
        metadata: metadata,
      };

      console.info(
        '[API Route] ✅ Returning response with formSchema:',
        formSchema ? 'present' : 'null',
        'caseData keys:',
        Object.keys(caseData).length,
        'metadata keys:',
        Object.keys(metadata).length
      );

      // Log full data structure for debugging
      console.info('[API Route] 📋 Full Projections API Response Structure:');
      console.info('  - Root data keys:', Object.keys(data).slice(0, 30));
      console.info('  - Root data sample:', {
        id: data.id,
        caseId: data.caseId || data.case_number,
        status: data.status,
        businessLegalName: data.businessLegalName,
        applicantFirstName: data.applicantFirstName,
        applicantEmail: data.applicantEmail,
        businessRegistrationNumber: data.businessRegistrationNumber,
        businessCountryOfRegistration: data.businessCountryOfRegistration,
      });
      console.info('  - Metadata full content:', JSON.stringify(metadata, null, 2));
      console.info('  - caseData sample:', {
        businessLegalName: caseData.businessLegalName,
        applicantFirstName: caseData.applicantFirstName,
        applicantEmail: caseData.applicantEmail,
        businessRegistrationNumber: caseData.businessRegistrationNumber,
        registeredAddress: caseData.registeredAddress,
        businessCountryOfRegistration: caseData.businessCountryOfRegistration,
      });
      // Log all root data keys that might contain address or registration info
      const addressKeys = Object.keys(data).filter(k => 
        k.toLowerCase().includes('address') || 
        k.toLowerCase().includes('registration') ||
        k.toLowerCase().includes('reg_number')
      );
      console.info('  - Root data keys containing "address" or "registration":', addressKeys);
      if (addressKeys.length > 0) {
        const addressValues = Object.fromEntries(
          addressKeys.map(k => [k, data[k]])
        );
        console.info('  - Values for address/registration keys:', addressValues);
      }

      // Add security headers to successful response
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', 'application/json');
      responseHeaders.set('X-Content-Type-Options', 'nosniff');
      responseHeaders.set('X-Frame-Options', 'DENY');
      responseHeaders.set('X-XSS-Protection', '1; mode=block');
      responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Add rate limit headers
      const rateLimitHeaders = getRateLimitHeaders(rateLimitKey, 60);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      return new NextResponse(JSON.stringify(responseData), {
        status: 200,
        headers: responseHeaders,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error proxying case request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for connection errors
    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('aborted') ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      return NextResponse.json(
        {
          error: 'Backend service unavailable',
          details: `Cannot connect to backend services. Please ensure they are running.`,
          originalError: errorMessage,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch case',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
