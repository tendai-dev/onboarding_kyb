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

  // Generate partnerId from email (for admin, use a default or extract from session)
  // For message attachments, we can use the case's partnerId or generate from user email
  let partnerId = '';
  if (uploadedBy) {
    // Simple hash-based partnerId generation (matches backend approach)
    const emailLower = uploadedBy.toLowerCase();
    let hash = 0;
    for (let i = 0; i < emailLower.length; i++) {
      const char = emailLower.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(32, '0');
    partnerId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
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
      const downloadResponse = await fetch(`/api/proxy/api/v1/documents/download/${encodeURIComponent(result.storageKey)}`, {
        method: 'GET',
      });
      if (downloadResponse.ok) {
        const downloadResult = await downloadResponse.json();
        storageUrl = downloadResult.url || downloadResult.downloadUrl || '';
      }
    } catch (error) {
      console.warn('Failed to get download URL:', error);
    }
  }
  
  return {
    documentId: result.documentId || result.id || '',
    documentNumber: result.documentNumber || '',
    wasDuplicate: result.wasDuplicate || false,
    existingDocumentId: result.existingDocumentId,
    storageKey: result.storageKey || '',
    storageUrl
  };
}

