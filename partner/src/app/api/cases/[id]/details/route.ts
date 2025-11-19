import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getTokenSession } from '@/lib/redis-session';

const ONBOARDING_API_BASE = process.env.ONBOARDING_API_BASE_URL || 'http://localhost:8001';
const PROJECTIONS_API_BASE = process.env.PROJECTIONS_API_BASE_URL || 'http://localhost:8007';
const ENTITY_CONFIG_API_BASE = process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || process.env.ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003';

// Proxy to backend APIs - get tokens from Redis (not from client)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
  }

  // Determine if it's a GUID or case number
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isGuid = guidRegex.test(id);
  
  // SECURITY: Get user email from NextAuth session (not from headers)
  // Try to get user info from session token
  let userEmail = '';
  let userPartnerId: string | null = null;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.user) {
      userEmail = (token.user as any).email || '';
    }
  } catch (error) {
    console.warn('Failed to get user from session:', error);
  }
  
  // Fallback to headers if session doesn't have email (for compatibility)
  if (!userEmail) {
    userEmail = request.headers.get('X-User-Email') || 
                request.headers.get('x-user-email') || 
                '';
  }
  
  // Generate partnerId from email if available (for ownership validation)
  if (userEmail) {
    // Use the same UUID v5 generation as frontend
    const crypto = require('crypto');
    const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const namespaceBytes = Buffer.from(NAMESPACE_UUID.replace(/-/g, ''), 'hex');
    const emailBytes = Buffer.from(userEmail.toLowerCase(), 'utf8');
    const hash = crypto.createHash('sha1').update(Buffer.concat([namespaceBytes, emailBytes])).digest();
    hash[6] = (hash[6] & 0x0f) | 0x50; // Version 5
    hash[8] = (hash[8] & 0x3f) | 0x80; // Variant
    userPartnerId = [
      hash.toString('hex', 0, 4),
      hash.toString('hex', 4, 6),
      hash.toString('hex', 6, 8),
      hash.toString('hex', 8, 10),
      hash.toString('hex', 10, 16)
    ].join('-');
    console.log('[API Route] 👤 User identification:', { email: userEmail, partnerId: userPartnerId });
  }

  // Try Projections API first (has more complete data), then fallback to Onboarding API
  let targetUrl: string;
  if (isGuid) {
    targetUrl = `${PROJECTIONS_API_BASE}/api/v1/cases/${id}`;
  } else {
    // For case numbers, try by-number endpoint
    targetUrl = `${PROJECTIONS_API_BASE}/api/v1/cases/by-number/${encodeURIComponent(id)}`;
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // SECURITY: Get token from Redis (not from client request)
  let accessToken: string | null = null;
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.sessionId) {
      const tokenSession = await getTokenSession(token.sessionId as string);
      if (tokenSession) {
        // Check if token needs refresh (within 60 seconds of expiry)
        if (tokenSession.accessTokenExpiryTime && Date.now() < tokenSession.accessTokenExpiryTime - 60 * 1000) {
          accessToken = tokenSession.accessToken;
        } else {
          // Token expired or expiring soon - use it anyway and let backend handle 401
          accessToken = tokenSession.accessToken;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get token from session:', error);
    // Continue without token - backend will return 401 if auth required
  }

  // Inject Authorization header from Redis-stored token (do NOT forward from client)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Forward development headers for authentication middleware
  const userHeaders = ['X-User-Id', 'X-User-Email', 'X-User-Name', 'X-User-Role'];
  for (const headerName of userHeaders) {
    const value = request.headers.get(headerName) || request.headers.get(headerName.toLowerCase());
    if (value) {
      headers[headerName] = value;
    }
  }
  
  // In development mode, add test headers if not present and no auth token from Redis
  if (process.env.NODE_ENV === 'development') {
    headers['X-User-Id'] = 'test-user-id';
    headers['X-User-Email'] = 'tendai@kurasika.tech';
    headers['X-User-Name'] = 'Test User';
    headers['X-User-Role'] = 'Partner';
    // Override with test auth token if none provided from Redis
    if (!accessToken) {
      headers['Authorization'] = 'Bearer development-token';
    }
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Try Projections API first
      let response = await fetch(targetUrl, { 
        headers,
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      // If Projections API returns 404, try Onboarding API as fallback
      if (response.status === 404) {
        const onboardingUrl = isGuid
          ? `${ONBOARDING_API_BASE}/api/v1/cases/${id}`
          : `${ONBOARDING_API_BASE}/api/v1/cases/by-number/${encodeURIComponent(id)}`;
        
        const onboardingController = new AbortController();
        const onboardingTimeoutId = setTimeout(() => onboardingController.abort(), 10000);
        
        try {
          response = await fetch(onboardingUrl, { 
            headers,
            signal: onboardingController.signal 
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
        if (casePartnerId && casePartnerId.toLowerCase() !== userPartnerId.toLowerCase()) {
          console.warn('[API Route] ⚠️ Ownership validation failed:', {
            casePartnerId,
            userPartnerId,
            caseId: id,
            userEmail
          });
          return NextResponse.json({
            error: 'Access denied',
            details: 'This application does not belong to your account.'
          }, { status: 403 });
        }
        console.log('[API Route] ✅ Ownership validated for user:', userEmail);
      }

      // Extract form configuration identifiers from case metadata
      // The metadata can be in different formats depending on the API response
      let metadata: Record<string, any> = {};
      if (data.metadata) {
        metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
      } else if (data.metadataJson) {
        metadata = typeof data.metadataJson === 'string' ? JSON.parse(data.metadataJson) : data.metadataJson;
      }
      
      // Ensure metadata is an object
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        metadata = {};
      }
      
      // Clean up duplicated values (handle comma-separated strings)
      const cleanValue = (value: any): string | null => {
        if (!value) return null;
        const str = String(value).trim();
        if (!str || str === 'null' || str === 'undefined') return null;
        // If comma-separated, take the first value
        if (str.includes(',')) {
          return str.split(',')[0].trim();
        }
        return str;
      };

      const rawFormConfigId = metadata?.form_config_id || metadata?.formConfigId;
      const rawFormVersion = metadata?.form_version || metadata?.formVersion;
      const rawEntityTypeCode = metadata?.entity_type_code || metadata?.entityTypeCode || data.entityType;
      
      const formConfigId = cleanValue(rawFormConfigId);
      const formVersion = cleanValue(rawFormVersion);
      const entityTypeCode = cleanValue(rawEntityTypeCode);

      // Fetch entity configuration schema if identifiers are available
      let formSchema = null;
      if (formConfigId || entityTypeCode) {
        try {
          let entityConfigUrl: string | null = null;
          
          if (formConfigId) {
            // Fetch by form config ID (most specific) - this is the entity type ID
            entityConfigUrl = `${ENTITY_CONFIG_API_BASE}/api/v1/entitytypes/${formConfigId}`;
            if (formVersion) {
              entityConfigUrl += `?version=${encodeURIComponent(formVersion)}&includeRequirements=true`;
            } else {
              entityConfigUrl += `?includeRequirements=true`;
            }
          } else if (entityTypeCode) {
            // Fetch by entity type code (fallback)
            // First get all entity types and find the one matching the code
            const allTypesUrl = `${ENTITY_CONFIG_API_BASE}/api/v1/entitytypes?includeRequirements=true`;
            const allTypesResponse = await fetch(allTypesUrl, {
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000)
            });
            
            if (allTypesResponse.ok) {
              const allTypes = await allTypesResponse.json();
              const matchingType = Array.isArray(allTypes) 
                ? allTypes.find((et: any) => {
                    const code = et.code?.toLowerCase()?.trim();
                    const searchCode = entityTypeCode.toLowerCase().trim();
                    return code === searchCode || 
                           code?.replace(/_/g, '') === searchCode.replace(/_/g, '') ||
                           code?.replace(/-/g, '_') === searchCode.replace(/-/g, '_');
                  })
                : null;
              
              if (matchingType?.id) {
                entityConfigUrl = `${ENTITY_CONFIG_API_BASE}/api/v1/entitytypes/${matchingType.id}?includeRequirements=true`;
              } else {
                console.warn(`Entity type with code "${entityTypeCode}" not found. Available codes:`, 
                  Array.isArray(allTypes) ? allTypes.map((et: any) => et.code).join(', ') : 'none');
              }
            }
          }

          if (entityConfigUrl) {
            console.log(`[API Route] Fetching entity config from: ${entityConfigUrl}`);
            const entityConfigResponse = await fetch(entityConfigUrl, {
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(10000)
            });

            if (entityConfigResponse.ok) {
              formSchema = await entityConfigResponse.json();
              console.log(`[API Route] ✅ Successfully fetched form schema for ${formConfigId || entityTypeCode}`);
            } else {
              const errorText = await entityConfigResponse.text();
              console.warn(`[API Route] ❌ Failed to fetch entity configuration: ${entityConfigResponse.status} - ${errorText}`);
            }
          } else {
            console.warn(`[API Route] ⚠️ No entity config URL constructed. formConfigId: ${formConfigId}, entityTypeCode: ${entityTypeCode}`);
          }
        } catch (schemaError) {
          console.error('[API Route] ❌ Error fetching form schema:', schemaError);
          // Continue without schema - frontend can still render with fallback
        }
      } else {
        console.warn(`[API Route] ⚠️ No formConfigId or entityTypeCode available. formConfigId: ${formConfigId}, entityTypeCode: ${entityTypeCode}`);
      }

      // Structure the response - Projections API returns data at root level
      // Extract all the case fields from the root data object
      const caseData = {
        // Applicant fields
        applicantFirstName: data.applicantFirstName || '',
        applicantLastName: data.applicantLastName || '',
        applicantEmail: data.applicantEmail || '',
        applicantPhone: data.applicantPhone || '',
        applicantDateOfBirth: data.applicantDateOfBirth,
        applicantNationality: data.applicantNationality || '',
        applicantAddress: data.applicantAddress || '',
        applicantCity: data.applicantCity || '',
        applicantCountry: data.applicantCountry || '',
        // Business fields
        businessLegalName: data.businessLegalName || '',
        businessRegistrationNumber: data.businessRegistrationNumber || '',
        businessTaxId: data.businessTaxId || '',
        businessCountryOfRegistration: data.businessCountryOfRegistration || '',
        businessAddress: data.businessAddress || '',
        businessCity: data.businessCity || '',
        businessIndustry: data.businessIndustry || '',
        businessNumberOfEmployees: data.businessNumberOfEmployees,
        businessAnnualRevenue: data.businessAnnualRevenue,
        businessWebsite: data.businessWebsite || '',
        // Include metadata
        metadata: metadata
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
        metadata: metadata
      };
      
      console.log('[API Route] ✅ Returning response with formSchema:', formSchema ? 'present' : 'null', 
        'caseData keys:', Object.keys(caseData).length,
        'metadata keys:', Object.keys(metadata).length);
      
      // Log full data structure for debugging
      console.log('[API Route] 📋 Full Projections API Response Structure:');
      console.log('  - Root data keys:', Object.keys(data).slice(0, 30));
      console.log('  - Root data sample:', {
        id: data.id,
        caseId: data.caseId || data.case_number,
        status: data.status,
        businessLegalName: data.businessLegalName,
        applicantFirstName: data.applicantFirstName,
        applicantEmail: data.applicantEmail,
        businessRegistrationNumber: data.businessRegistrationNumber,
        businessCountryOfRegistration: data.businessCountryOfRegistration,
      });
      console.log('  - Metadata full content:', JSON.stringify(metadata, null, 2));
      console.log('  - caseData sample:', {
        businessLegalName: caseData.businessLegalName,
        applicantFirstName: caseData.applicantFirstName,
        applicantEmail: caseData.applicantEmail,
        businessRegistrationNumber: caseData.businessRegistrationNumber,
        businessCountryOfRegistration: caseData.businessCountryOfRegistration,
      });
      
      return NextResponse.json(responseData);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error proxying case request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for connection errors
    if (errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('fetch failed') || 
        errorMessage.includes('aborted') ||
        error instanceof Error && error.name === 'AbortError') {
      
      return NextResponse.json({
        error: 'Backend service unavailable',
        details: `Cannot connect to backend services at ${PROJECTIONS_API_BASE} or ${ONBOARDING_API_BASE}. Please ensure they are running.`,
        originalError: errorMessage,
        serviceUrls: {
          projectionsApi: PROJECTIONS_API_BASE,
          onboardingApi: ONBOARDING_API_BASE
        }
      }, { status: 503 });
    }
    
    return NextResponse.json({
      error: 'Failed to fetch case',
      details: errorMessage
    }, { status: 500 });
  }
}