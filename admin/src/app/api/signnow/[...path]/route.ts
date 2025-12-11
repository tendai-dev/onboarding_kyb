/**
 * SignNow API Proxy Route
 * Proxies requests to SignNow API to keep credentials secure on server-side
 * 
 * Usage:
 *   POST /api/signnow/document - Upload document
 *   GET /api/signnow/document/:id - Get document
 *   PUT /api/signnow/document/:id/field - Add fields
 *   POST /api/signnow/document/:id/invite - Send invite
 *   GET /api/signnow/document/:id/download - Download document
 */

import { NextRequest, NextResponse } from 'next/server';
import { signNowApiService } from '@/services/signNowApi';

// Helper to handle different HTTP methods
async function handleRequest(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathSegments = params.path || [];
  const method = request.method;
  const path = `/${pathSegments.join('/')}`;

  try {
    // Route: POST /api/signnow/document - Upload document
    if (path === '/document' && method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const fileName = formData.get('fileName') as string || file?.name || 'document.pdf';

      if (!file) {
        return NextResponse.json(
          { error: 'File is required' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const document = await signNowApiService.uploadDocument(buffer, fileName);

      return NextResponse.json(document);
    }

    // Route: GET /api/signnow/document/:id - Get document
    if (path.match(/^\/document\/([^/]+)$/) && method === 'GET') {
      const match = path.match(/^\/document\/([^/]+)$/);
      const documentId = match?.[1];
      
      if (!documentId) {
        return NextResponse.json(
          { error: 'Document ID is required' },
          { status: 400 }
        );
      }

      const document = await signNowApiService.getDocument(documentId);
      return NextResponse.json(document);
    }

    // Route: PUT /api/signnow/document/:id/field - Add fields
    if (path.match(/^\/document\/([^/]+)\/field$/) && method === 'PUT') {
      const match = path.match(/^\/document\/([^/]+)\/field$/);
      const documentId = match?.[1];
      
      if (!documentId) {
        return NextResponse.json(
          { error: 'Document ID is required' },
          { status: 400 }
        );
      }

      const fields = await request.json();
      await signNowApiService.addFields(documentId, fields);

      return NextResponse.json({ success: true });
    }

    // Route: POST /api/signnow/document/:id/invite - Send invite
    if (path.match(/^\/document\/([^/]+)\/invite$/) && method === 'POST') {
      const match = path.match(/^\/document\/([^/]+)\/invite$/);
      const documentId = match?.[1];
      
      if (!documentId) {
        return NextResponse.json(
          { error: 'Document ID is required' },
          { status: 400 }
        );
      }

      const inviteData = await request.json();
      const response = await signNowApiService.sendInvite(documentId, inviteData);

      return NextResponse.json(response);
    }

    // Route: GET /api/signnow/document/:id/download - Download document
    if (path.match(/^\/document\/([^/]+)\/download$/) && method === 'GET') {
      const match = path.match(/^\/document\/([^/]+)\/download$/);
      const documentId = match?.[1];
      
      if (!documentId) {
        return NextResponse.json(
          { error: 'Document ID is required' },
          { status: 400 }
        );
      }

      const buffer = await signNowApiService.downloadDocument(documentId);
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="signed-document-${documentId}.pdf"`,
        },
      });
    }

    // Route: GET /api/signnow/document/:id/download/link - Get download link
    if (path.match(/^\/document\/([^/]+)\/download\/link$/) && method === 'GET') {
      const match = path.match(/^\/document\/([^/]+)\/download\/link$/);
      const documentId = match?.[1];
      
      if (!documentId) {
        return NextResponse.json(
          { error: 'Document ID is required' },
          { status: 400 }
        );
      }

      const downloadLink = await signNowApiService.getDownloadLink(documentId);
      return NextResponse.json(downloadLink);
    }

    // Route: POST /api/signnow/document/:id/embeddedinvite - Create embedded link
    if (path.match(/^\/document\/([^/]+)\/embeddedinvite$/) && method === 'POST') {
      const match = path.match(/^\/document\/([^/]+)\/embeddedinvite$/);
      const documentId = match?.[1];
      
      if (!documentId) {
        return NextResponse.json(
          { error: 'Document ID is required' },
          { status: 400 }
        );
      }

      const { email, role_id } = await request.json();
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      const response = await signNowApiService.createEmbeddedLink(documentId, email, role_id);
      return NextResponse.json(response);
    }

    // Route: PUT /api/signnow/document/:id/fieldinvitecancel/:inviteId - Cancel invite
    if (path.match(/^\/document\/([^/]+)\/fieldinvitecancel\/([^/]+)$/) && method === 'PUT') {
      const match = path.match(/^\/document\/([^/]+)\/fieldinvitecancel\/([^/]+)$/);
      const documentId = match?.[1];
      const inviteId = match?.[2];
      
      if (!documentId || !inviteId) {
        return NextResponse.json(
          { error: 'Document ID and Invite ID are required' },
          { status: 400 }
        );
      }

      await signNowApiService.cancelInvite(documentId, inviteId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('SignNow API error:', error);
    
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

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;

