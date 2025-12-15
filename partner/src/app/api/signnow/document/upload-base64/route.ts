/**
 * SignNow Document Upload (Base64) Route
 * Accepts base64 encoded PDF and converts to FormData for SignNow API
 * 
 * This route handles the conversion from base64 to FormData on the server side
 * to avoid Blob/File compatibility issues in Node.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the JSON body with base64 file
    const body = await request.json();
    const { file: base64File, fileName } = body;

    if (!base64File || !fileName) {
      return NextResponse.json(
        { error: 'Missing file or fileName in request body' },
        { status: 400 }
      );
    }

    console.info('Converting base64 to FormData for SignNow upload:', {
      fileName,
      base64Length: base64File.length,
      userEmail: session.user.email,
    });

    // Convert base64 to Buffer
    const pdfBuffer = Buffer.from(base64File, 'base64');

    // Create multipart form data manually to avoid Blob compatibility issues
    // Generate a boundary for multipart form data
    const boundary = `----FormBoundary${Date.now().toString(16)}`;
    
    // Build the multipart body manually
    const parts: Buffer[] = [];
    
    // Add the file part
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`
    ));
    parts.push(pdfBuffer);
    parts.push(Buffer.from('\r\n'));
    
    // Add closing boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));
    
    // Combine all parts into a single buffer
    const formBody = Buffer.concat(parts);

    // Forward to admin app's SignNow document upload endpoint
    const adminUrl = `${ADMIN_API_BASE}/api/signnow/document`;

    console.info('Forwarding to admin SignNow API:', {
      adminUrl,
      method: 'POST',
      fileName,
    });

    const response = await fetch(adminUrl, {
      method: 'POST',
      body: formBody,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: request.headers.get('cookie') || '',
      },
    });

    // Forward response
    const responseText = await response.text();
    
    // Try to parse as JSON
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Not JSON, return as-is
      return new NextResponse(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/plain',
        },
      });
    }

    // Return JSON response
    return NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
