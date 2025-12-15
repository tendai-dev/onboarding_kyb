/**
 * SignNow Webhook Handler
 * Receives webhook events from SignNow and processes them
 *
 * Configure this URL in SignNow webhook settings:
 * https://yourdomain.com/api/signnow/webhook/handler
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SignNowWebhookEvent } from '@/services/signNowApi';

export async function POST(request: NextRequest) {
  try {
    const event: SignNowWebhookEvent = await request.json();

    console.log('SignNow Webhook Event Received:', {
      event: event.event,
      document_id: event.document_id,
      document_name: event.document_name,
      timestamp: event.timestamp,
    });

    // Process different event types
    switch (event.event) {
      case 'document.complete':
        // Handle document completion
        await handleDocumentComplete(event);
        break;

      case 'document.decline':
        // Handle document decline
        await handleDocumentDecline(event);
        break;

      case 'invite.complete':
        // Handle invite completion (signature)
        await handleInviteComplete(event);
        break;

      case 'invite.decline':
        // Handle invite decline
        await handleInviteDecline(event);
        break;

      case 'document.create':
      case 'document.update':
      case 'document.delete':
      case 'invite.create':
      case 'field.invite.create':
      case 'field.invite.complete':
      case 'field.invite.decline':
        // Handle other events
        await handleGenericEvent(event);
        break;

      default:
        console.log('Unhandled webhook event type:', event.event);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing SignNow webhook:', error);
    // Still return 200 to prevent SignNow from retrying
    return NextResponse.json({ received: true, error: 'Processing failed' });
  }
}

async function handleDocumentComplete(event: SignNowWebhookEvent) {
  // TODO: Implement your business logic here
  // Examples:
  // - Update database with document status
  // - Send notification to users
  // - Trigger downstream processes
  // - Update application status

  console.log('Document completed:', event.document_id);

  // Example: You could update your database here
  // await updateDocumentStatus(event.document_id, 'completed');
}

async function handleDocumentDecline(event: SignNowWebhookEvent) {
  console.log('Document declined:', event.document_id);
  // TODO: Implement decline handling
}

async function handleInviteComplete(event: SignNowWebhookEvent) {
  console.log('Invite completed (signed):', {
    document_id: event.document_id,
    invite_id: event.invite_id,
  });
  // TODO: Implement invite completion handling
}

async function handleInviteDecline(event: SignNowWebhookEvent) {
  console.log('Invite declined:', {
    document_id: event.document_id,
    invite_id: event.invite_id,
  });
  // TODO: Implement invite decline handling
}

async function handleGenericEvent(event: SignNowWebhookEvent) {
  console.log('Generic event received:', event.event);
  // TODO: Implement generic event handling
}

// GET endpoint for webhook verification (if SignNow requires it)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  // Some webhook systems send a challenge for verification
  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ status: 'webhook handler active' });
}
