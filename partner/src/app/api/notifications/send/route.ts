import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/notifications/send - DEPRECATED: Use backend API instead
 * 
 * This endpoint is deprecated. All email sending now goes through the backend API:
 * POST /api/proxy/api/v1/notifications
 * 
 * This route redirects to the backend API which has SendGrid integrated.
 * The backend is the single source of truth for email configuration.
 * No SendGrid configuration is needed in the frontend - backend handles everything.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, htmlContent, textContent } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject' },
        { status: 400 }
      );
    }

    // Redirect to backend API - backend handles all SendGrid configuration
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_ONBOARDING_API_BASE_URL || 'http://localhost:8001';
    const response = await fetch(`${backendUrl}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization if available
        ...(request.headers.get('authorization') && { 'Authorization': request.headers.get('authorization')! }),
      },
      body: JSON.stringify({
        type: 'Message',
        channel: 'Email',
        recipient: to,
        subject,
        htmlContent,
        textContent,
        content: textContent || htmlContent,
        priority: 'Medium',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: errorText,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
