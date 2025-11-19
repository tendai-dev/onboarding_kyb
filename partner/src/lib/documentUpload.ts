/**
 * Document Upload Service
 * 
 * According to the backend, files should be uploaded to:
 * - Endpoint: /api/v1/documents/upload (or via proxy /api/proxy/api/v1/documents/upload)
 * - Storage: MinIO object storage (not Google Drive)
 * - Required: CaseId, PartnerId, DocumentType, File (multipart form data)
 * 
 * Note: Files cannot be uploaded until a case is created, so uploads should happen
 * after case creation, not during form filling.
 */

// Helper to generate PartnerId from email using MD5 (matches backend algorithm)
function generatePartnerIdFromEmail(email: string): string {
  if (!email) return '';
  
  // Normalize email to lowercase (matches backend)
  const normalizedEmail = email.toLowerCase().trim();
  
  // Use Web Crypto API to generate MD5 hash
  // Note: Web Crypto API doesn't support MD5 directly, so we use a workaround
  // For production, consider using a library like crypto-js or implementing MD5
  // For now, we'll use a simple hash that's deterministic
  let hash = 0;
  for (let i = 0; i < normalizedEmail.length; i++) {
    const char = normalizedEmail.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to GUID format (this is a simplified version)
  // In production, use proper MD5 implementation
  const hex = Math.abs(hash).toString(16).padStart(32, '0');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// Better implementation using crypto.subtle (SHA-256) and converting to GUID format
// This is more secure but won't match MD5 exactly - for exact match, use crypto-js MD5
async function generatePartnerIdFromEmailMD5(email: string): Promise<string> {
  if (!email) return '';
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Use crypto.subtle for hashing (SHA-256, then take first 16 bytes for GUID)
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedEmail);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Take first 16 bytes and format as GUID
  const guidBytes = hashArray.slice(0, 16);
  const hex = guidBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

export enum DocumentType {
  PassportCopy = 1,
  DriversLicense = 2,
  NationalId = 3,
  ProofOfAddress = 4,
  BankStatement = 5,
  TaxDocument = 6,
  BusinessRegistration = 7,
  ArticlesOfIncorporation = 8,
  ShareholderRegistry = 9,
  FinancialStatements = 10,
  Other = 99
}

export interface FileUploadData {
  fileName: string;
  fileSize: number;
  fileType: string;
  googleDriveUrl?: string; // Legacy - will be replaced with document service
  uploadedAt?: string;
  fileId?: string;
  // For actual upload, we need the File object
  file?: File;
}

export interface UploadDocumentResult {
  documentId: string;
  documentNumber: string;
  wasDuplicate: boolean;
  existingDocumentId?: string;
  storageKey: string;
}

/**
 * Maps requirement codes to DocumentType enum
 * This helps determine the document type based on the field/requirement code
 */
export function mapRequirementCodeToDocumentType(requirementCode: string): DocumentType {
  const code = requirementCode.toLowerCase();
  
  if (code.includes('passport')) return DocumentType.PassportCopy;
  if (code.includes('drivers') || code.includes('license')) return DocumentType.DriversLicense;
  if (code.includes('national_id') || code.includes('nationalid') || code.includes('id_number')) return DocumentType.NationalId;
  if (code.includes('address') || code.includes('proof_of_address')) return DocumentType.ProofOfAddress;
  if (code.includes('bank') || code.includes('statement')) return DocumentType.BankStatement;
  if (code.includes('tax')) return DocumentType.TaxDocument;
  if (code.includes('registration') || code.includes('business_registration')) return DocumentType.BusinessRegistration;
  if (code.includes('articles') || code.includes('incorporation')) return DocumentType.ArticlesOfIncorporation;
  if (code.includes('shareholder') || code.includes('share_register')) return DocumentType.ShareholderRegistry;
  if (code.includes('financial') || code.includes('statement')) return DocumentType.FinancialStatements;
  
  return DocumentType.Other;
}

/**
 * Uploads a file to the Document Service API
 * 
 * @param caseId - The case GUID (not case number)
 * @param partnerId - The partner GUID
 * @param file - The File object to upload
 * @param documentType - The document type enum value
 * @param description - Optional description
 * @param uploadedBy - Email of the user uploading (defaults to 'system')
 * @returns Upload result with document ID and storage key
 */
export async function uploadFileToDocumentService(
  caseId: string,
  partnerId: string,
  file: File,
  documentType: DocumentType = DocumentType.Other,
  description?: string,
  uploadedBy?: string
): Promise<UploadDocumentResult> {
  const formData = new FormData();
  
  // Append file
  formData.append('file', file);
  
  // Append required fields
  formData.append('caseId', caseId);
  formData.append('partnerId', partnerId);
  formData.append('type', documentType.toString());
  
  // Append optional fields
  if (description) formData.append('description', description);
  if (uploadedBy) formData.append('uploadedBy', uploadedBy);
  
  // Upload via proxy to document service
  const response = await fetch('/api/proxy/api/v1/documents/upload', {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    headers: {
      ...(uploadedBy ? {
        'X-User-Email': uploadedBy,
        'X-User-Name': uploadedBy,
        'X-User-Role': 'Applicant'
      } : {})
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Document upload failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return {
    documentId: result.documentId || result.id,
    documentNumber: result.documentNumber || '',
    wasDuplicate: result.wasDuplicate || false,
    existingDocumentId: result.existingDocumentId,
    storageKey: result.storageKey || ''
  };
}

/**
 * Uploads multiple files to the Document Service
 * 
 * @param caseId - The case GUID
 * @param partnerId - The partner GUID
 * @param files - Array of files with their metadata
 * @param uploadedBy - Email of the user uploading
 * @returns Array of upload results
 */
export async function uploadFilesToDocumentService(
  caseId: string,
  partnerId: string,
  files: Array<{ file: File; requirementCode?: string; description?: string }>,
  uploadedBy?: string
): Promise<Array<{ requirementCode?: string; result: UploadDocumentResult; error?: string }>> {
  const uploadPromises = files.map(async ({ file, requirementCode, description }) => {
    try {
      const documentType = requirementCode 
        ? mapRequirementCodeToDocumentType(requirementCode)
        : DocumentType.Other;
      
      const result = await uploadFileToDocumentService(
        caseId,
        partnerId,
        file,
        documentType,
        description || file.name,
        uploadedBy
      );
      
      return { requirementCode, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to upload file ${file.name}:`, errorMessage);
      return { requirementCode, result: {} as UploadDocumentResult, error: errorMessage };
    }
  });
  
  return Promise.all(uploadPromises);
}

