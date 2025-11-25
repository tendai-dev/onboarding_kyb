import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Proxy endpoint for serving documents/images from MinIO
 * This avoids CORS issues and signature validation problems
 * Uses the direct download endpoint which streams files directly
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const storageKey = searchParams.get('storageKey');
  const url = searchParams.get('url');

  if (!storageKey && !url) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing storageKey or url parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const docServiceUrl = process.env.DOCUMENT_TARGET || process.env.PROXY_TARGET_DOCUMENT || 'http://localhost:8008';
    
    // If we have a storageKey, use the direct download endpoint (preferred method)
    if (storageKey) {
      // Decode the storageKey first to handle any double-encoding
      // Next.js searchParams.get() already decodes once, but we need to ensure we have the raw key
      // Try to decode - if it fails (already decoded), use as-is
      let decodedKey = storageKey;
      try {
        // Try decoding - if it's already decoded, this will throw or produce the same result
        const testDecode = decodeURIComponent(storageKey);
        // If decoding produces a different result (had encoded chars), use decoded version
        if (testDecode !== storageKey || storageKey.includes('%')) {
          decodedKey = testDecode;
        }
      } catch {
        // If decode fails, the key is likely already decoded or malformed - use as-is
        decodedKey = storageKey;
      }
      
      // Use direct download endpoint - this streams the file directly without presigned URLs
      // This avoids signature validation issues when accessing from outside Docker
      // Encode the decoded key properly for the backend API
      const directDownloadUrl = `${docServiceUrl}/api/v1/documents/direct?key=${encodeURIComponent(decodedKey)}`;
      
      logger.debug('[Proxy-Document] Processing document request', {
        originalStorageKey: storageKey,
        decodedStorageKey: decodedKey,
        directDownloadUrl
      });
      
      try {
        const downloadResponse = await fetch(directDownloadUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'NextJS-Proxy/1.0',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        logger.debug('[Proxy-Document] Response status', {
          status: downloadResponse.status,
          statusText: downloadResponse.statusText
        });

        if (downloadResponse.ok) {
          // Direct download succeeded - stream the response directly
          // Use ReadableStream for better memory efficiency with large files
          const contentType = downloadResponse.headers.get('content-type') || 'application/octet-stream';
          const contentDisposition = downloadResponse.headers.get('content-disposition') || '';
          
          logger.debug('[Proxy-Document] Success', { contentType });

          const headers = new Headers({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          });
          
          // For PDFs and other viewable documents, force inline display instead of attachment
          // This allows them to be displayed in iframes instead of forcing download
          if (contentDisposition) {
            // Replace 'attachment' with 'inline' to allow viewing in browser/iframe
            const inlineDisposition = contentDisposition.replace(/^attachment/i, 'inline');
            headers.set('Content-Disposition', inlineDisposition);
          } else if (contentType.includes('pdf') || contentType.includes('image/') || contentType.includes('text/')) {
            // If no disposition header, set inline for viewable content types
            const fileName = decodedKey.split('/').pop() || 'document';
            headers.set('Content-Disposition', `inline; filename="${fileName}"`);
          }

          // Stream the response body directly instead of loading into memory
          const responseBody = downloadResponse.body;
          if (!responseBody) {
            throw new Error('Response body is null');
          }

          return new NextResponse(responseBody, {
            status: 200,
            headers,
          });
        } else {
          // If direct download fails, get error details
          let errorText = 'Unknown error';
          let errorData: any = null;
          
          try {
            errorText = await downloadResponse.text();
            // Try to parse as JSON for better error details
            try {
              errorData = JSON.parse(errorText);
            } catch {
              // Not JSON, use as-is
            }
          } catch {
            // Couldn't read error text
          }
          
          logger.error(new Error(`Direct download failed: ${downloadResponse.status}`), '[Proxy-Document] Direct download failed', {
            tags: { error_type: 'document_download_error' },
            extra: { status: downloadResponse.status, errorText }
          });
          
          // Return appropriate status code (404 for not found, 500 for server errors)
          const statusCode = downloadResponse.status === 404 ? 404 : (downloadResponse.status || 500);
          
          return new NextResponse(
            JSON.stringify({ 
              error: errorData?.error || 'Failed to download document', 
              status: statusCode,
              details: errorData || errorText,
              message: errorData?.suggestion || errorData?.error || 'The document could not be retrieved. It may have been deleted or never uploaded.'
            }),
            { 
              status: statusCode, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (fetchError) {
        logger.error(fetchError, '[Proxy-Document] Fetch error', {
          tags: { error_type: 'document_fetch_error' }
        });
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to fetch document from document service', 
            details: errorMessage 
          }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Fallback: If we only have a URL (presigned URL) and no storageKey, try to fetch it
    // Note: This is less reliable due to signature validation issues
    if (url && !storageKey) {
      logger.warn('[Proxy-Document] Using presigned URL fallback (not recommended)', {
        tags: { warning_type: 'presigned_url_fallback' }
      });
      
      try {
        // Try to replace minio:9000 with localhost:9000 for local development
        let fetchUrl = url;
        if (fetchUrl.includes('minio:9000')) {
          fetchUrl = fetchUrl.replace('minio:9000', 'localhost:9000');
        }
        
        const imageResponse = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'NextJS-Proxy/1.0',
          },
          signal: AbortSignal.timeout(30000),
        });

        if (imageResponse.ok) {
          const fileBuffer = await imageResponse.arrayBuffer();
          const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';

          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } else {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Failed to fetch document from presigned URL', 
              status: imageResponse.status 
            }),
            { 
              status: imageResponse.status || 500, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (fetchError) {
        logger.error(fetchError, '[Proxy-Document] Presigned URL fetch error', {
          tags: { error_type: 'presigned_url_fetch_error' }
        });
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to fetch document from presigned URL', 
            details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
          }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // If we reach here, we had neither storageKey nor url
    return new NextResponse(
      JSON.stringify({ error: 'Missing storageKey or url parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error(error, '[Proxy-Document] Unexpected error', {
      tags: { error_type: 'proxy_document_unexpected_error' }
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(
      JSON.stringify({ error: 'Proxy request failed', details: errorMessage }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

