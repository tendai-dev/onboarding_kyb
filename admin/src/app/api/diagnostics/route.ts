import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Diagnostic endpoint to verify OAuth configuration
 * This helps identify configuration issues with Azure AD redirect URIs
 * 
 * Access at: /api/diagnostics (not /api/auth/diagnostics to avoid NextAuth interception)
 */
export async function GET(request: NextRequest) {
  try {
    const nextAuthUrl = 
      process.env.NEXTAUTH_URL || 
      process.env.NEXT_PUBLIC_APP_URL || 
      'https://admin-mukuru.kurasika.tech';
    
    const expectedCallbackUrl = `${nextAuthUrl}/api/auth/callback/azure-ad`;
    
    const diagnostics = {
      configuration: {
        nextAuthUrl,
        expectedCallbackUrl,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
        azureAdClientId: process.env.AZURE_AD_CLIENT_ID ? '***configured***' : 'MISSING',
        azureAdTenantId: process.env.AZURE_AD_TENANT_ID ? '***configured***' : 'MISSING',
        hasClientSecret: !!process.env.AZURE_AD_CLIENT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      azureAdSetup: {
        step1: 'Go to Azure Portal → Azure Active Directory → App registrations',
        step2: 'Select your app (Client ID: ' + (process.env.AZURE_AD_CLIENT_ID || 'NOT SET') + ')',
        step3: 'Navigate to "Authentication" section',
        step4: 'Under "Redirect URIs", ensure this exact URL is listed:',
        requiredRedirectUri: expectedCallbackUrl,
        step5: 'If missing, click "Add a platform" → "Web" and add the URL above',
        step6: 'Save the changes',
        important: 'The redirect URI must match EXACTLY (including https:// and no trailing slash)',
      },
      troubleshooting: {
        commonIssues: [
          {
            issue: 'OAuthCallbackError',
            cause: 'Redirect URI mismatch between Azure AD and NextAuth',
            solution: 'Ensure the redirect URI in Azure AD exactly matches: ' + expectedCallbackUrl,
            check: 'Verify in Azure Portal that the redirect URI is listed exactly as shown above',
          },
          {
            issue: 'Missing NEXTAUTH_URL',
            cause: 'Environment variable not set',
            solution: 'Set NEXTAUTH_URL=https://admin-mukuru.kurasika.tech in your environment',
          },
          {
            issue: 'URL mismatch',
            cause: 'NEXTAUTH_URL does not match the actual domain',
            solution: 'Ensure NEXTAUTH_URL matches your actual domain (https://admin-mukuru.kurasika.tech)',
          },
        ],
      },
      verification: {
        check1: 'Verify redirect URI in Azure AD matches: ' + expectedCallbackUrl,
        check2: 'Verify NEXTAUTH_URL environment variable is set to: ' + nextAuthUrl,
        check3: 'Verify all required environment variables are set (see configuration above)',
        check4: 'Check server logs for detailed OAuth error messages',
      },
      currentError: {
        message: 'OAuthCallbackError indicates Azure AD rejected the callback',
        likelyCauses: [
          'Redirect URI not registered in Azure AD',
          'Redirect URI mismatch (check for trailing slashes, http vs https)',
          'Client ID or Client Secret incorrect',
          'Tenant ID incorrect',
        ],
      },
    };

    logger.info('[Auth Diagnostics] Configuration check requested', {
      nextAuthUrl,
      expectedCallbackUrl,
    });

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      '[Auth Diagnostics] Error generating diagnostics'
    );
    
    return NextResponse.json(
      { 
        error: 'Failed to generate diagnostics',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

