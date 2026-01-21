/**
 * EDD Signatures API
 * Manages signature records for Enhanced Due Diligence forms
 */

import { NextRequest, NextResponse } from 'next/server';

// Use gateway or backend URL for production, fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ||
                     process.env.NEXT_PUBLIC_BACKEND_URL ||
                     process.env.NEXT_PUBLIC_API_URL ||
                     'http://localhost:8001';

export interface EddSignature {
  id: string;
  riskAssessmentId: string;
  signerRole: string;
  signerName?: string;
  signerEmail: string;
  signnowDocumentId?: string;
  signnowInviteId?: string;
  status: 'pending' | 'sent' | 'signed' | 'declined';
  recommendation?: string;
  rationale?: string;
  sentAt?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/signatures?assessmentId=xxx - Get all signatures for an assessment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 });
    }

    // Query the database via the backend API
    const response = await fetch(
      `${API_BASE_URL}/api/v1/risk-assessments/${assessmentId}/signatures`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // If endpoint doesn't exist yet, return empty array
      if (response.status === 404) {
        return NextResponse.json([]);
      }
      throw new Error(`Failed to fetch signatures: ${response.status}`);
    }

    const signatures = await response.json();
    return NextResponse.json(signatures);
  } catch (error) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch signatures' },
      { status: 500 }
    );
  }
}

// POST /api/signatures - Create or update a signature record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      riskAssessmentId,
      signerRole,
      signerName,
      signerEmail,
      signnowDocumentId,
      signnowInviteId,
      status,
      recommendation,
      rationale,
    } = body;

    if (!riskAssessmentId || !signerRole || !signerEmail) {
      return NextResponse.json(
        { error: 'riskAssessmentId, signerRole, and signerEmail are required' },
        { status: 400 }
      );
    }

    // Upsert the signature record via backend API
    const response = await fetch(
      `${API_BASE_URL}/api/v1/risk-assessments/${riskAssessmentId}/signatures`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signer_role: signerRole,
          signer_name: signerName,
          signer_email: signerEmail,
          signnow_document_id: signnowDocumentId,
          signnow_invite_id: signnowInviteId,
          status: status || 'pending',
          recommendation,
          rationale,
          sent_at: status === 'sent' ? new Date().toISOString() : undefined,
          signed_at: status === 'signed' ? new Date().toISOString() : undefined,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save signature: ${response.status} ${errorText}`);
    }

    const signature = await response.json();
    return NextResponse.json(signature);
  } catch (error) {
    console.error('Error saving signature:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save signature' },
      { status: 500 }
    );
  }
}

// PATCH /api/signatures - Update signature status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, signnowDocumentId, signnowInviteId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Signature id is required' }, { status: 400 });
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/signatures/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        signnow_document_id: signnowDocumentId,
        signnow_invite_id: signnowInviteId,
        sent_at: status === 'sent' ? new Date().toISOString() : undefined,
        signed_at: status === 'signed' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update signature: ${response.status}`);
    }

    const signature = await response.json();
    return NextResponse.json(signature);
  } catch (error) {
    console.error('Error updating signature:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update signature' },
      { status: 500 }
    );
  }
}
