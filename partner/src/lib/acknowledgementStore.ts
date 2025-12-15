/**
 * Acknowledgement Document Store
 * Stores acknowledgement document IDs for status tracking
 * 
 * In production, this should be replaced with a database (e.g., PostgreSQL, MongoDB)
 */

interface AcknowledgementRecord {
  documentId: string;
  signedAt?: string;
  signedBy?: string;
  applicationId: string;
  createdAt: string;
}

// In-memory store (for development)
// In production, replace with database operations
const documentStore = new Map<string, AcknowledgementRecord>();

export function storeAcknowledgement(
  applicationId: string,
  documentId: string
): void {
  documentStore.set(applicationId, {
    documentId,
    applicationId,
    createdAt: new Date().toISOString(),
  });
}

export function getAcknowledgement(
  applicationId: string
): AcknowledgementRecord | undefined {
  return documentStore.get(applicationId);
}

export function updateAcknowledgement(
  applicationId: string,
  updates: Partial<Pick<AcknowledgementRecord, 'signedAt' | 'signedBy'>>
): void {
  const existing = documentStore.get(applicationId);
  if (existing) {
    documentStore.set(applicationId, {
      ...existing,
      ...updates,
    });
  }
}

export function hasAcknowledgement(applicationId: string): boolean {
  return documentStore.has(applicationId);
}
