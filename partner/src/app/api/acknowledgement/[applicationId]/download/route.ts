import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAcknowledgement } from '@/lib/acknowledgementStore';

/**
 * Download signed acknowledgement document
 * GET /api/acknowledgement/[applicationId]/download
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
      return NextResponse.json(
        { error: 'Acknowledgement document not found. Please generate the document first.' },
        { status: 404 }
      );
    }

    // Helper function to regenerate PDF as fallback
    const regeneratePDF = async (): Promise<NextResponse | null> => {
      try {
        console.warn('Attempting to regenerate PDF as fallback');
        // Import the PDF generation function
        const generateModule = await import('../generate/route');
        const generateAcknowledgementPDF = generateModule.generateAcknowledgementPDF;
        
        // Get application data to regenerate PDF
        const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
        const appResponse = await fetch(`${baseUrl}/api/proxy/api/v1/applications/${applicationId}`, {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        });
        
        if (appResponse.ok) {
          const appData = await appResponse.json();
          const userEmail = session.user?.email || '';
          const pdfBuffer = await generateAcknowledgementPDF({
            applicantName: appData.applicantFirstName && appData.applicantLastName
              ? `${appData.applicantFirstName} ${appData.applicantLastName}`.trim()
              : appData.applicantEmail || userEmail || 'Applicant',
            applicantEmail: appData.applicantEmail || userEmail || '',
            companyName: appData.businessLegalName || appData.name || '',
            applicationId,
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          });
          
          // Convert Buffer to ArrayBuffer for NextResponse
          const arrayBuffer = new Uint8Array(pdfBuffer).buffer;
          
          return new NextResponse(arrayBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="acknowledgement-${applicationId}.pdf"`,
            },
          });
        } else {
          console.warn('Could not fetch application data for PDF regeneration:', appResponse.status);
          return null;
        }
      } catch (regenerateError) {
        console.error('Failed to regenerate PDF:', regenerateError);
        return null;
      }
    };

    // Download from SignNow via partner app's proxy route
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    
    try {
      const signNowResponse = await fetch(
        `${baseUrl}/api/signnow/document/${stored.documentId}/download`,
        {
          method: 'GET',
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        }
      );

      if (!signNowResponse.ok) {
        const errorText = await signNowResponse.text();
        let errorMessage = 'Failed to download document from SignNow';
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error('SignNow download error:', {
          status: signNowResponse.status,
          statusText: signNowResponse.statusText,
          error: errorMessage,
          documentId: stored.documentId,
          applicationId,
        });
        
        // If document is not available from SignNow, try to regenerate it
        // This can happen if the document was self-signed or SignNow is unavailable
        if (signNowResponse.status === 404 || signNowResponse.status === 500) {
          const regenerated = await regeneratePDF();
          if (regenerated) {
            return regenerated;
          }
        }
        
        throw new Error(errorMessage);
      }

      const pdfBuffer = await signNowResponse.arrayBuffer();

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="acknowledgement-${applicationId}.pdf"`,
        },
      });
    } catch (fetchError) {
      // If fetch fails completely, try to regenerate the PDF as fallback
      console.warn('SignNow download fetch failed, attempting to regenerate PDF:', fetchError);
      const regenerated = await regeneratePDF();
      if (regenerated) {
        return regenerated;
      }
      
      // If regeneration also fails, throw the original error
      throw fetchError;
    }
  } catch (error) {
    console.error('Error downloading acknowledgement:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      applicationId: await params.then((p) => p.applicationId).catch(() => 'unknown'),
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to download acknowledgement',
      },
      { status: 500 }
    );
  }
}
