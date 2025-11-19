import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to manually test Keycloak token exchange
 * This helps diagnose Callback errors
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({
      error: 'Missing authorization code',
      instructions: 'This endpoint tests token exchange. You need an authorization code from Keycloak.',
    }, { status: 400 });
  }

  const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru';
  const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'kyb-connect-portal';
  const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const REDIRECT_URI = `${NEXTAUTH_URL}/api/auth/callback/keycloak`;

  const tokenUrl = `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

  // Build request body
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KEYCLOAK_CLIENT_ID,
    code: code,
    redirect_uri: REDIRECT_URI,
  });

  // Only add client_secret if it's set (for confidential clients)
  if (KEYCLOAK_CLIENT_SECRET && KEYCLOAK_CLIENT_SECRET.trim() !== '') {
    body.append('client_secret', KEYCLOAK_CLIENT_SECRET);
  }

  try {
    console.log('[Test] Attempting token exchange:', {
      tokenUrl,
      clientId: KEYCLOAK_CLIENT_ID,
      hasClientSecret: !!KEYCLOAK_CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const responseText = await response.text();
    let responseData: any;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        request: {
          tokenUrl,
          clientId: KEYCLOAK_CLIENT_ID,
          hasClientSecret: !!KEYCLOAK_CLIENT_SECRET,
          redirectUri: REDIRECT_URI,
        },
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      hasAccessToken: !!responseData.access_token,
      hasRefreshToken: !!responseData.refresh_token,
      tokenType: responseData.token_type,
      expiresIn: responseData.expires_in,
      // Don't return actual tokens for security
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

