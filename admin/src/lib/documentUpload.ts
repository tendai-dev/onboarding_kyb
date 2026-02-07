/**
 * Document Upload Service for Admin Portal
 * Uploads files to Document Service for message attachments
 */

export interface UploadDocumentResult {
  documentId: string;
  documentNumber: string;
  wasDuplicate: boolean;
  existingDocumentId?: string;
  storageKey: string;
  storageUrl?: string;
}

/**
 * Uploads a file to the Document Service API for message attachments
 *
 * @param caseId - The case GUID (application ID)
 * @param file - The File object to upload
 * @param description - Optional description
 * @param uploadedBy - Email of the user uploading
 * @returns Upload result with document ID and storage key
 */
export async function uploadFileToDocumentService(
  caseId: string,
  file: File,
  description?: string,
  uploadedBy?: string
): Promise<UploadDocumentResult> {
  // Validate caseId is a valid GUID format
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!caseId || !guidRegex.test(caseId)) {
    console.error(`❌ Invalid caseId for document upload: ${caseId}`);
    throw new Error(`Invalid case ID format. Expected GUID, got: ${caseId?.substring(0, 20) || 'empty'}`);
  }

  // Get user email from session if not provided
  if (!uploadedBy && typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      uploadedBy = session?.user?.email || 'admin@mukuru.com';
    } catch {
      uploadedBy = 'admin@mukuru.com';
    }
  }

  // Get PartnerId from the case itself (for admin uploads, use case's PartnerId)
  // This ensures documents are linked to the correct partner, not the admin
  let partnerId = '';
  try {
    // PRIMARY: Get PartnerId from the case itself (correct for admin uploads)
    // Try multiple endpoints to find the case
    let caseData = null;
    
    // Try projections endpoint first (more reliable)
    const projectionsResponse = await fetch(
      `/api/proxy/projections/v1/cases/${encodeURIComponent(caseId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (projectionsResponse.ok) {
      caseData = await projectionsResponse.json();
    } else {
      // Fallback to direct case endpoint
      const caseResponse = await fetch(
        `/api/proxy/api/v1/cases/${encodeURIComponent(caseId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (caseResponse.ok) {
        caseData = await caseResponse.json();
      }
    }

    if (caseData?.partnerId) {
      partnerId = caseData.partnerId;
      console.info(`✅ Admin: Got PartnerId from case: ${partnerId}`);
    } else if (caseData?.partner_id) {
      partnerId = caseData.partner_id;
      console.info(`✅ Admin: Got partner_id from case: ${partnerId}`);
    }
  } catch (caseError) {
    console.warn(
      '⚠️ Admin: Could not get PartnerId from case, trying backend endpoint:',
      caseError
    );

    // FALLBACK: If case lookup fails, try backend endpoint (for admin's own PartnerId)
    // This is less ideal but ensures upload doesn't fail
    if (uploadedBy) {
      try {
        const partnerIdResponse = await fetch('/api/proxy/api/v1/partner/id', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (partnerIdResponse.ok) {
          const partnerIdData = await partnerIdResponse.json();
          if (partnerIdData?.partnerId) {
            partnerId = partnerIdData.partnerId;
            console.warn(
              `⚠️ Admin: Using admin's PartnerId (fallback): ${partnerId} - case lookup failed`
            );
          }
        }
      } catch (error) {
        console.warn(
          '⚠️ Admin: Could not get PartnerId from backend endpoint either:',
          error
        );
      }
    }
  }

  // If we still don't have a partnerId, throw an error with helpful message
  if (!partnerId) {
    console.error(`❌ Could not determine PartnerId for case: ${caseId}`);
    throw new Error('Could not determine partner ID for this application. The attachment cannot be uploaded.');
  }

  const formData = new FormData();

  // Append file
  formData.append('file', file);

  // Append required fields
  formData.append('caseId', caseId);
  formData.append('partnerId', partnerId);
  formData.append('type', '99'); // DocumentType.Other

  // Append optional fields
  if (description) formData.append('description', description);
  if (uploadedBy) formData.append('uploadedBy', uploadedBy);

  // Upload via proxy to document service
  const response = await fetch('/api/proxy/api/v1/documents/upload', {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Document upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Get storage URL if available
  let storageUrl = '';
  if (result.storageKey) {
    try {
      // Try to get presigned URL for download
      const downloadResponse = await fetch(
        `/api/proxy/api/v1/documents/download/${encodeURIComponent(result.storageKey)}`,
        {
          method: 'GET',
        }
      );
      if (downloadResponse.ok) {
        const downloadResult = await downloadResponse.json();
        storageUrl = downloadResult.url || downloadResult.downloadUrl || '';
      }
    } catch {
      // Ignore errors getting download URL
    }
  }

  return {
    documentId: result.documentId || result.id || '',
    documentNumber: result.documentNumber || '',
    wasDuplicate: result.wasDuplicate || false,
    existingDocumentId: result.existingDocumentId,
    storageKey: result.storageKey || '',
    storageUrl,
  };
}
