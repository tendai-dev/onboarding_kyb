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
  Other = 99,
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
  if (code.includes('drivers') || code.includes('license'))
    return DocumentType.DriversLicense;
  if (
    code.includes('national_id') ||
    code.includes('nationalid') ||
    code.includes('id_number')
  )
    return DocumentType.NationalId;
  if (code.includes('address') || code.includes('proof_of_address'))
    return DocumentType.ProofOfAddress;
  if (code.includes('bank') || code.includes('statement'))
    return DocumentType.BankStatement;
  if (code.includes('tax')) return DocumentType.TaxDocument;
  if (code.includes('registration') || code.includes('business_registration'))
    return DocumentType.BusinessRegistration;
  if (code.includes('articles') || code.includes('incorporation'))
    return DocumentType.ArticlesOfIncorporation;
  if (code.includes('shareholder') || code.includes('share_register'))
    return DocumentType.ShareholderRegistry;
  if (code.includes('financial') || code.includes('statement'))
    return DocumentType.FinancialStatements;

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
// Helper function to validate GUID format
function isValidGuid(guid: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(guid.trim());
}

export async function uploadFileToDocumentService(
  caseId: string,
  partnerId: string,
  file: File,
  documentType: DocumentType = DocumentType.Other,
  description?: string,
  uploadedBy?: string
): Promise<UploadDocumentResult> {
  // Validate inputs
  const trimmedCaseId = caseId?.trim() || '';
  const trimmedPartnerId = partnerId?.trim() || '';

  if (!trimmedCaseId) {
    throw new Error(`Invalid caseId: Case ID is required for document upload.`);
  }
  if (!isValidGuid(trimmedCaseId)) {
    throw new Error(
      `Invalid caseId format: "${trimmedCaseId}" is not a valid GUID. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
    );
  }

  if (!trimmedPartnerId) {
    throw new Error(`Invalid partnerId: Partner ID is required for document upload.`);
  }
  if (!isValidGuid(trimmedPartnerId)) {
    throw new Error(
      `Invalid partnerId format: "${trimmedPartnerId}" is not a valid GUID. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
    );
  }

  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file: File object is required for document upload.');
  }

  if (file.size === 0) {
    throw new Error('Invalid file: File is empty (0 bytes).');
  }

  console.info('📤 Starting document upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    caseId: trimmedCaseId.substring(0, 8) + '...',
    partnerId: trimmedPartnerId.substring(0, 8) + '...',
    documentType,
    uploadedBy: uploadedBy || 'not provided',
  });

  const formData = new FormData();

  // Append file - must be named 'File' to match C# IFormFile property
  formData.append('File', file);

  // Append required fields - use exact C# property names (CaseId, PartnerId, Type)
  // ASP.NET Core model binding is case-insensitive, but using exact names is safer
  formData.append('CaseId', trimmedCaseId);
  formData.append('PartnerId', trimmedPartnerId);
  // Type must be sent as integer string (enum value)
  // Backend expects DocumentType enum which is an integer (1, 2, 3, ..., 99)
  formData.append('Type', documentType.toString());

  // Append optional fields
  if (description) formData.append('description', description);
  if (uploadedBy) formData.append('uploadedBy', uploadedBy);

  // Upload via proxy to document service
  const response = await fetch('/api/proxy/api/v1/documents/upload', {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    headers: {
      ...(uploadedBy
        ? {
            'X-User-Email': uploadedBy,
            'X-User-Name': uploadedBy,
            'X-User-Role': 'Applicant',
          }
        : {}),
    },
  });

  if (!response.ok) {
    let errorText: string;
    try {
      errorText = await response.text();
      // Try to parse as JSON for better error messages
      try {
        const errorJson = JSON.parse(errorText);
        errorText = JSON.stringify(errorJson, null, 2);
      } catch {
        // Not JSON, use as-is
      }
    } catch {
      errorText = `Failed to read error response (status: ${response.status})`;
    }

    console.error('❌ Document upload failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      fileName: file.name,
      caseId: trimmedCaseId.substring(0, 8) + '...',
      partnerId: trimmedPartnerId.substring(0, 8) + '...',
      documentType,
    });

    // Provide more helpful error messages
    if (response.status === 400) {
      throw new Error(
        `Document upload failed: Bad Request (400). The server rejected the request. Details: ${errorText}`
      );
    } else if (response.status === 500) {
      throw new Error(
        `Document upload failed: Internal Server Error (500). The server encountered an error processing your file. Details: ${errorText}`
      );
    } else {
      throw new Error(
        `Document upload failed: ${response.status} ${response.statusText}. Details: ${errorText}`
      );
    }
  }

  let result: any;
  try {
    result = await response.json();
  } catch (parseError) {
    const responseText = await response.text();
    console.error('❌ Failed to parse response as JSON:', responseText);
    throw new Error(
      `Document upload failed: Server returned invalid JSON response. Response: ${responseText.substring(0, 200)}`
    );
  }

  // Handle camelCase, PascalCase, and snake_case response properties (C# JSON serialization varies)
  const documentId =
    result.documentId ||
    result.DocumentId ||
    result.document_id ||
    result.id ||
    result.Id;
  const documentNumber =
    result.documentNumber || result.DocumentNumber || result.document_number || '';
  const storageKey = result.storageKey || result.StorageKey || result.storage_key || '';
  const wasDuplicate =
    result.wasDuplicate || result.WasDuplicate || result.was_duplicate || false;

  if (!documentId) {
    console.error('❌ Response missing documentId:', result);
    throw new Error('Document upload failed: Server response missing document ID');
  }

  console.info('✅ Document upload successful:', {
    fileName: file.name,
    documentId,
    documentNumber,
    storageKey,
  });

  return {
    documentId: String(documentId), // Ensure it's a string
    documentNumber: String(documentNumber),
    wasDuplicate: Boolean(wasDuplicate),
    existingDocumentId:
      result.existingDocumentId ||
      result.ExistingDocumentId ||
      result.existing_document_id,
    storageKey: String(storageKey),
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
): Promise<
  Array<{ requirementCode?: string; result: UploadDocumentResult; error?: string }>
> {
  if (!files || files.length === 0) {
    console.warn('⚠️ No files provided to uploadFilesToDocumentService');
    return [];
  }

  console.info(`📤 Starting upload of ${files.length} file(s) to Document Service:`, {
    caseId: caseId.substring(0, 8) + '...',
    partnerId: partnerId.substring(0, 8) + '...',
    fileCount: files.length,
    fileNames: files.map((f) => f.file.name),
  });

  const uploadPromises = files.map(async ({ file, requirementCode, description }) => {
    try {
      const documentType = requirementCode
        ? mapRequirementCodeToDocumentType(requirementCode)
        : DocumentType.Other;

      console.info(
        `📤 Uploading file: ${file.name} (requirementCode: ${requirementCode || 'none'}, documentType: ${documentType})`
      );

      const result = await uploadFileToDocumentService(
        caseId,
        partnerId,
        file,
        documentType,
        description || file.name,
        uploadedBy
      );

      console.info(`✅ Successfully uploaded file: ${file.name}`, {
        documentId: result.documentId,
        requirementCode,
      });

      return { requirementCode, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to upload file ${file.name}:`, {
        error: errorMessage,
        requirementCode,
        caseId: caseId.substring(0, 8) + '...',
        partnerId: partnerId.substring(0, 8) + '...',
      });
      return { requirementCode, result: {} as UploadDocumentResult, error: errorMessage };
    }
  });

  const results = await Promise.all(uploadPromises);
  const successCount = results.filter((r) => !r.error).length;
  const errorCount = results.filter((r) => r.error).length;

  console.info(
    `📊 Upload summary: ${successCount} succeeded, ${errorCount} failed out of ${files.length} total`
  );

  return results;
}
