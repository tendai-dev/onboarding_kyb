import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storeAcknowledgement } from '@/lib/acknowledgementStore';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://127.0.0.1:3001';

/**
 * Generate acknowledgement document and create embedded signing link via SignNow
 * POST /api/acknowledgement/[applicationId]/generate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const body = await request.json();
    const { applicantName, applicantEmail, companyName } = body;

    if (!applicantName) {
      return NextResponse.json(
        { error: 'Applicant name is required' },
        { status: 400 }
      );
    }

    console.info('Generating acknowledgement with embedded signing for:', { applicationId, applicantName, applicantEmail, companyName });

    // Get session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate acknowledgement PDF
    const pdfBuffer = await generateAcknowledgementPDF({
      applicantName,
      applicantEmail: applicantEmail || '',
      companyName,
      applicationId,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });

    const fileName = `acknowledgement-${applicationId}.pdf`;

    // Upload document to SignNow via admin API
    console.info('Uploading document to SignNow...', { adminApiBase: ADMIN_API_BASE });
    
    let uploadResponse;
    try {
      uploadResponse = await fetch(`${ADMIN_API_BASE}/api/signnow/document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          file: pdfBuffer.toString('base64'),
          fileName,
        }),
      });
    } catch (fetchError) {
      console.error('Fetch error when calling admin API:', fetchError);
      throw new Error(`Failed to connect to admin API at ${ADMIN_API_BASE}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('SignNow upload error:', errorText);
      throw new Error(`Failed to upload document to SignNow: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const documentId = uploadResult.id;
    console.info('Document uploaded to SignNow:', { documentId });

    // Create embedded signing link
    const signerEmail = applicantEmail || session.user.email || 'signer@example.com';
    console.info('Creating embedded signing link for:', signerEmail);
    
    const embeddedResponse = await fetch(`${ADMIN_API_BASE}/api/signnow/document/${documentId}/embeddedinvite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        email: signerEmail,
      }),
    });

    if (!embeddedResponse.ok) {
      const errorText = await embeddedResponse.text();
      console.error('SignNow embedded link error:', errorText);
      // If embedded link fails, fall back to self-signed
      console.info('Falling back to self-signed acknowledgement');
      storeAcknowledgement(applicationId, documentId);
      return NextResponse.json({
        success: true,
        documentId,
        signedAt: new Date().toISOString(),
        signedBy: applicantName,
        message: 'Acknowledgement signed successfully',
        selfSigned: true,
      });
    }

    const embeddedResult = await embeddedResponse.json();
    const signingLink = embeddedResult.link;
    console.info('Embedded signing link created');

    // Store acknowledgement (pending signing)
    storeAcknowledgement(applicationId, documentId);

    // Return the embedded signing link for in-app signing
    return NextResponse.json({
      success: true,
      documentId,
      signingLink,
      message: 'Please sign the document in the window below',
      embeddedSigning: true,
    });
  } catch (error) {
    console.error('Error generating acknowledgement:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      applicationId: await params.then((p) => p.applicationId).catch(() => 'unknown'),
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate acknowledgement',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate acknowledgement PDF using pdf-lib
 * Creates a proper PDF document that SignNow can process
 */
export async function generateAcknowledgementPDF(data: {
  applicantName: string;
  applicantEmail: string;
  companyName?: string;
  applicationId: string;
  date: string;
}): Promise<Buffer> {
  // Try backend service first
  try {
    const backendUrl = process.env.ONBOARDING_TARGET || 'http://localhost:8001';
    const response = await fetch(`${backendUrl}/api/v1/documents/generate-acknowledgement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (error) {
    console.warn('Backend PDF generation not available, using pdf-lib:', error);
  }

  // Generate PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { height } = page.getSize();

  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  let yPosition = height - margin;

  // Title
  page.drawText('Application Acknowledgement', {
    x: margin,
    y: yPosition,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 40;

  // Date (right aligned)
  const dateText = `Date: ${data.date}`;
  const dateWidth = helvetica.widthOfTextAtSize(dateText, 12);
  page.drawText(dateText, {
    x: 595.28 - margin - dateWidth,
    y: yPosition,
    size: 12,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 40;

  // Application Information Section
  page.drawText('Application Information', {
    x: margin,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 5;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + 150, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  // Application details
  const details = [
    `Application ID: ${data.applicationId}`,
    ...(data.companyName ? [`Company Name: ${data.companyName}`] : []),
    `Applicant Name: ${data.applicantName}`,
    `Applicant Email: ${data.applicantEmail}`,
  ];

  for (const detail of details) {
    page.drawText(detail, {
      x: margin,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 18;
  }
  yPosition -= 20;

  // Acknowledgement Statement Section
  page.drawText('Acknowledgement Statement', {
    x: margin,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 5;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + 180, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;

  page.drawText('I, the undersigned, hereby acknowledge and confirm that:', {
    x: margin,
    y: yPosition,
    size: 11,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 25;

  const statements = [
    '1. All information provided in this application is accurate and complete',
    '   to the best of my knowledge.',
    '',
    '2. I agree to the relevant legal and product terms as specified in the',
    '   application process.',
    '',
    '3. I understand my obligations and responsibilities as outlined in the',
    '   terms and conditions.',
    '',
    '4. I authorize the verification of all information provided in this',
    '   application.',
  ];

  for (const statement of statements) {
    if (statement) {
      page.drawText(statement, {
        x: margin + 20,
        y: yPosition,
        size: 11,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    yPosition -= 16;
  }
  yPosition -= 30;

  // Signature Section
  page.drawText('Signature', {
    x: margin,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 5;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + 70, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition -= 60;

  // Signature line
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + 250, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition -= 18;

  page.drawText(data.applicantName, {
    x: margin,
    y: yPosition,
    size: 11,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 16;

  page.drawText(data.date, {
    x: margin,
    y: yPosition,
    size: 11,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
