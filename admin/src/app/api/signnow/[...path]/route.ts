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
  { params }: { params: Promise<{ path: string[] }> }
) {
  const pathParams = await params;
  const pathSegments = pathParams.path || [];
  const method = request.method;
  const path = `/${pathSegments.join('/')}`;

  try {
    // Route: POST /api/signnow/document - Upload document
    // Supports both multipart/form-data and JSON with base64 encoded file
    if (path === '/document' && method === 'POST') {
      const contentType = request.headers.get('content-type') || '';

      let buffer: Buffer;
      let fileName: string;

      if (contentType.includes('application/json')) {
        // Handle JSON with base64 encoded file
        const body = await request.json();
        const { file: base64File, fileName: jsonFileName } = body;

        if (!base64File) {
          return NextResponse.json(
            { error: 'File (base64) is required' },
            { status: 400 }
          );
        }

        buffer = Buffer.from(base64File, 'base64');
        fileName = jsonFileName || 'document.pdf';
      } else {
        // Handle multipart/form-data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        fileName = (formData.get('fileName') as string) || file?.name || 'document.pdf';

        if (!file) {
          return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }

      const document = await signNowApiService.uploadDocument(buffer, fileName);

      return NextResponse.json(document);
    }

    // Route: GET /api/signnow/document/:id - Get document
    if (path.match(/^\/document\/([^/]+)$/) && method === 'GET') {
      const match = path.match(/^\/document\/([^/]+)$/);
      const documentId = match?.[1];

      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      const document = await signNowApiService.getDocument(documentId);
      return NextResponse.json(document);
    }

    // Route: PUT /api/signnow/document/:id/field - Add fields
    // Also accept PUT /api/signnow/document/:id for field updates
    if (
      (path.match(/^\/document\/([^/]+)\/field$/) ||
        path.match(/^\/document\/([^/]+)$/)) &&
      method === 'PUT'
    ) {
      const match = path.match(/^\/document\/([^/]+)(?:\/field)?$/);
      const documentId = match?.[1];

      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      const body = await request.json();
      // Handle both { fields: [...] } and direct array format
      const fields = Array.isArray(body) ? body : body.fields || body;
      await signNowApiService.addFields(documentId, fields);

      return NextResponse.json({ success: true });
    }

    // Route: POST /api/signnow/document/:id/invite - Send invite
    if (path.match(/^\/document\/([^/]+)\/invite$/) && method === 'POST') {
      const match = path.match(/^\/document\/([^/]+)\/invite$/);
      const documentId = match?.[1];

      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      const inviteData = await request.json();
      console.info('SignNow invite request:', { documentId, inviteData });

      // Ensure 'to' and 'from' are different (SignNow requirement)
      if (inviteData.to === inviteData.from) {
        return NextResponse.json(
          { error: 'Recipient email must be different from sender email' },
          { status: 400 }
        );
      }

      const response = await signNowApiService.sendInvite(documentId, inviteData);

      return NextResponse.json(response);
    }

    // Route: GET /api/signnow/document/:id/download - Download document
    if (path.match(/^\/document\/([^/]+)\/download$/) && method === 'GET') {
      const match = path.match(/^\/document\/([^/]+)\/download$/);
      const documentId = match?.[1];

      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      const buffer = await signNowApiService.downloadDocument(documentId);

      return new NextResponse(new Uint8Array(buffer), {
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
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      const downloadLink = await signNowApiService.getDownloadLink(documentId);
      return NextResponse.json(downloadLink);
    }

    // Route: POST /api/signnow/document/:id/embeddedinvite - Create embedded link
    if (path.match(/^\/document\/([^/]+)\/embeddedinvite$/) && method === 'POST') {
      const match = path.match(/^\/document\/([^/]+)\/embeddedinvite$/);
      const documentId = match?.[1];

      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      const { email, role_id } = await request.json();
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      const response = await signNowApiService.createEmbeddedLink(
        documentId,
        email,
        role_id
      );
      return NextResponse.json(response);
    }

    // Route: PUT /api/signnow/document/:id/fieldinvitecancel/:inviteId - Cancel invite
    if (
      path.match(/^\/document\/([^/]+)\/fieldinvitecancel\/([^/]+)$/) &&
      method === 'PUT'
    ) {
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

    // ==================== PREMIUM FEATURES ROUTES ====================

    // Route: GET /api/signnow/document - List all documents
    if (path === '/document' && method === 'GET') {
      const { searchParams } = new URL(request.url);
      const params = {
        per_page: searchParams.get('per_page')
          ? parseInt(searchParams.get('per_page')!)
          : undefined,
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
        filter: searchParams.get('filter') || undefined,
      };
      const result = await signNowApiService.listDocuments(params);
      return NextResponse.json(result);
    }

    // Route: DELETE /api/signnow/document/:id - Delete document
    if (path.match(/^\/document\/([^/]+)$/) && method === 'DELETE') {
      const match = path.match(/^\/document\/([^/]+)$/);
      const documentId = match?.[1];
      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }
      await signNowApiService.deleteDocument(documentId);
      return NextResponse.json({ success: true });
    }

    // Route: GET /api/signnow/document/:id/details - Get document with full details
    if (path.match(/^\/document\/([^/]+)\/details$/) && method === 'GET') {
      const match = path.match(/^\/document\/([^/]+)\/details$/);
      const documentId = match?.[1];
      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }
      const details = await signNowApiService.getDocumentWithDetails(documentId);
      return NextResponse.json(details);
    }

    // Route: GET /api/signnow/document/:id/history - Get document history
    if (path.match(/^\/document\/([^/]+)\/history$/) && method === 'GET') {
      const match = path.match(/^\/document\/([^/]+)\/history$/);
      const documentId = match?.[1];
      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }
      const history = await signNowApiService.getDocumentHistory(documentId);
      return NextResponse.json(history);
    }

    // Route: GET /api/signnow/document/:id/analytics - Get document analytics
    if (path.match(/^\/document\/([^/]+)\/analytics$/) && method === 'GET') {
      const match = path.match(/^\/document\/([^/]+)\/analytics$/);
      const documentId = match?.[1];
      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }
      const analytics = await signNowApiService.getDocumentAnalytics(documentId);
      return NextResponse.json(analytics);
    }

    // Route: POST /api/signnow/document/:id/duplicate - Duplicate document
    if (path.match(/^\/document\/([^/]+)\/duplicate$/) && method === 'POST') {
      const match = path.match(/^\/document\/([^/]+)\/duplicate$/);
      const documentId = match?.[1];
      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }
      const { name } = await request.json().catch(() => ({}));
      const newDocument = await signNowApiService.duplicateDocument(documentId, name);
      return NextResponse.json(newDocument);
    }

    // Route: POST /api/signnow/document/merge - Merge documents
    if (path === '/document/merge' && method === 'POST') {
      const mergeData = await request.json();
      if (
        !mergeData.document_ids ||
        !Array.isArray(mergeData.document_ids) ||
        mergeData.document_ids.length < 2
      ) {
        return NextResponse.json(
          { error: 'At least 2 document IDs are required for merging' },
          { status: 400 }
        );
      }
      const merged = await signNowApiService.mergeDocuments(mergeData);
      return NextResponse.json(merged);
    }

    // Route: POST /api/signnow/document/bulk-invite - Send bulk invites
    if (path === '/document/bulk-invite' && method === 'POST') {
      const bulkInvites = await request.json();
      if (!Array.isArray(bulkInvites) || bulkInvites.length === 0) {
        return NextResponse.json(
          { error: 'Array of bulk invites is required' },
          { status: 400 }
        );
      }
      const results = await signNowApiService.sendBulkInvites(bulkInvites);
      return NextResponse.json(results);
    }

    // Route: GET /api/signnow/template - List templates
    if (path === '/template' && method === 'GET') {
      const templates = await signNowApiService.listTemplates();
      return NextResponse.json(templates);
    }

    // Route: GET /api/signnow/template/:id - Get template
    if (path.match(/^\/template\/([^/]+)$/) && method === 'GET') {
      const match = path.match(/^\/template\/([^/]+)$/);
      const templateId = match?.[1];
      if (!templateId) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
      }
      const template = await signNowApiService.getTemplate(templateId);
      return NextResponse.json(template);
    }

    // Route: POST /api/signnow/template/:id - Create document from template
    if (path.match(/^\/template\/([^/]+)$/) && method === 'POST') {
      const match = path.match(/^\/template\/([^/]+)$/);
      const templateId = match?.[1];
      if (!templateId) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
      }
      const { document_name, field_values } = await request.json();
      if (!document_name) {
        return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
      }
      const document = await signNowApiService.createDocumentFromTemplate(
        templateId,
        document_name,
        field_values
      );
      return NextResponse.json(document);
    }

    // Route: PUT /api/signnow/document/:id/template - Create template from document
    if (path.match(/^\/document\/([^/]+)\/template$/) && method === 'PUT') {
      const match = path.match(/^\/document\/([^/]+)\/template$/);
      const documentId = match?.[1];
      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }
      const { template_name } = await request.json();
      if (!template_name) {
        return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
      }
      const template = await signNowApiService.createTemplate(documentId, template_name);
      return NextResponse.json(template);
    }

    // Route: GET /api/signnow/webhook - List webhooks
    if (path === '/webhook' && method === 'GET') {
      const webhooks = await signNowApiService.listWebhooks();
      return NextResponse.json(webhooks);
    }

    // Route: POST /api/signnow/webhook - Register webhook
    if (path === '/webhook' && method === 'POST') {
      const webhook = await request.json();
      if (!webhook.event || !webhook.callback_url) {
        return NextResponse.json(
          { error: 'Event and callback_url are required' },
          { status: 400 }
        );
      }
      const registered = await signNowApiService.registerWebhook(webhook);
      return NextResponse.json(registered);
    }

    // Route: DELETE /api/signnow/webhook/:id - Delete webhook
    if (path.match(/^\/webhook\/([^/]+)$/) && method === 'DELETE') {
      const match = path.match(/^\/webhook\/([^/]+)$/);
      const webhookId = match?.[1];
      if (!webhookId) {
        return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
      }
      await signNowApiService.deleteWebhook(webhookId);
      return NextResponse.json({ success: true });
    }

    // Route: GET /api/signnow/brand - List brands
    if (path === '/brand' && method === 'GET') {
      const brands = await signNowApiService.listBrands();
      return NextResponse.json(brands);
    }

    // Route: GET /api/signnow/brand/:id - Get brand
    if (path.match(/^\/brand\/([^/]+)$/) && method === 'GET') {
      const match = path.match(/^\/brand\/([^/]+)$/);
      const brandId = match?.[1];
      if (!brandId) {
        return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
      }
      const brand = await signNowApiService.getBrand(brandId);
      return NextResponse.json(brand);
    }

    // Route: POST /api/signnow/brand - Create brand
    if (path === '/brand' && method === 'POST') {
      const brand = await request.json();
      const created = await signNowApiService.createBrand(brand);
      return NextResponse.json(created);
    }

    // Route: PUT /api/signnow/document/:id/brand - Apply brand to document
    if (path.match(/^\/document\/([^/]+)\/brand$/) && method === 'PUT') {
      const match = path.match(/^\/document\/([^/]+)\/brand$/);
      const documentId = match?.[1];
      if (!documentId) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }
      const { brand_id } = await request.json();
      if (!brand_id) {
        return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
      }
      await signNowApiService.applyBrandToDocument(documentId, brand_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('SignNow API error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
