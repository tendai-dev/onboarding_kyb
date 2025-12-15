import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendTestEmail, testAllEmailTemplates, verifySendGridConfig } from '@/lib/emailTesting';

/**
 * POST /api/notifications/test - Test email sending
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, type = 'simple' } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    // Verify backend email configuration
    // Backend handles all SendGrid configuration - we just check if backend is available
    const config = await verifySendGridConfig();
    if (!config.configured) {
      return NextResponse.json(
        {
          error: 'Email service not available',
          details: {
            message: 'Backend email service is not available. Please check backend configuration.',
            apiKeySet: config.apiKeySet,
            fromEmailSet: config.fromEmailSet,
          },
        },
        { status: 500 }
      );
    }

    let result;

    if (type === 'all') {
      // Test all templates
      result = await testAllEmailTemplates(to);
      return NextResponse.json({
        success: true,
        message: 'All test emails sent',
        results: result,
      });
    } else {
      // Send simple test email
      result = await sendTestEmail(to);
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully',
        });
      } else {
        return NextResponse.json(
          {
            error: 'Failed to send test email',
            details: result.error,
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/test - Check email configuration
 * Note: All email sending goes through the backend API which has SendGrid configured.
 * This checks if the backend notification endpoint is available.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await verifySendGridConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error checking SendGrid config:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

