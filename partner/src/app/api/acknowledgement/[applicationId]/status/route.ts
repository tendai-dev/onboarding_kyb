import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAcknowledgement, updateAcknowledgement } from '@/lib/acknowledgementStore';

/**
 * Check acknowledgement signature status
 * GET /api/acknowledgement/[applicationId]/status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;

    // Get session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get stored document ID
    const stored = getAcknowledgement(applicationId);
    
    if (!stored || !stored.documentId) {
      return NextResponse.json({
        status: 'pending',
      });
    }

    // Check SignNow document status via partner app's proxy route
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    
    try {
      const signNowResponse = await fetch(
        `${baseUrl}/api/signnow/document/${stored.documentId}`,
        {
          method: 'GET',
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        }
      );

      if (!signNowResponse.ok) {
        const errorText = await signNowResponse.text();
        console.warn('Could not check SignNow document status:', {
          status: signNowResponse.status,
          statusText: signNowResponse.statusText,
          documentId: stored.documentId,
          error: errorText,
        });
        // If we can't check status, return what we have stored
        return NextResponse.json({
          status: stored.signedAt ? 'signed' : (stored.signedAt ? 'self_acknowledged' : 'pending'),
          documentId: stored.documentId,
          signedAt: stored.signedAt,
          signedBy: stored.signedBy,
        });
      }

      const document = await signNowResponse.json();
      
      // Update stored status if document is completed
      if (document.status === 'completed' && !stored.signedAt) {
        updateAcknowledgement(applicationId, {
          signedAt: new Date().toISOString(),
          signedBy: document.signers?.[0]?.email || session.user.email || undefined,
        });
        // Refresh stored data
        const updated = getAcknowledgement(applicationId);
        if (updated) {
          stored.signedAt = updated.signedAt;
          stored.signedBy = updated.signedBy;
        }
      }
      
      return NextResponse.json({
        status: document.status === 'completed' ? 'signed' : (document.status || 'sent'),
        documentId: stored.documentId,
        signedAt: stored.signedAt || (document.completed ? new Date(document.completed * 1000).toISOString() : undefined),
        signedBy: stored.signedBy || document.signers?.[0]?.email,
      });
    } catch (fetchError) {
      // If fetch fails (network error, admin app not running, etc.), return stored status
      console.warn('Error fetching SignNow document status:', fetchError);
      return NextResponse.json({
        status: stored.signedAt ? 'signed' : 'pending',
        documentId: stored.documentId,
        signedAt: stored.signedAt,
        signedBy: stored.signedBy,
      });
    }
  } catch (error) {
    console.error('Error checking acknowledgement status:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      applicationId: await params.then((p) => p.applicationId).catch(() => 'unknown'),
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check acknowledgement status',
      },
      { status: 500 }
    );
  }
}
