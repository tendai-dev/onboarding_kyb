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
        // Try by-number endpoint first (for case numbers like OBC-20251220-68499)
        // If that fails, try as GUID
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId);
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'http://localhost:3000' 
          : (process.env.NEXTAUTH_URL || request.nextUrl.origin);
        const apiUrl = isGuid 
          ? `${baseUrl}/api/proxy/api/v1/cases/${applicationId}`
          : `${baseUrl}/api/proxy/api/v1/cases/by-number/${encodeURIComponent(applicationId)}`;
        
        const appResponse = await fetch(apiUrl, {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        });
        
        if (appResponse.ok) {
          const appData = await appResponse.json();
          // Backend returns snake_case: applicant.first_name, applicant.last_name, business.legal_name
          const applicantFirstName = appData.applicant?.first_name || appData.applicantFirstName;
          const applicantLastName = appData.applicant?.last_name || appData.applicantLastName;
          const applicantEmail = appData.applicant?.email || appData.applicantEmail || '';
          const companyName = appData.business?.legal_name || appData.businessLegalName || appData.name || '';
          
          const userEmail = session.user?.email || '';
          const pdfBuffer = await generateAcknowledgementPDF({
            applicantName: applicantFirstName && applicantLastName
              ? `${applicantFirstName} ${applicantLastName}`.trim()
              : applicantEmail || userEmail || 'Applicant',
            applicantEmail: applicantEmail || userEmail || '',
            companyName: companyName,
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
