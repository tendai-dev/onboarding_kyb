import { NextRequest, NextResponse } from 'next/server';
import { trackEmailEvent } from '@/lib/emailAnalytics';

/**
 * POST /api/notifications/webhook - SendGrid Webhook Handler (Admin)
 * Handles SendGrid webhook events (delivered, opened, clicked, bounced, etc.)
 * 
 * Configure this URL in SendGrid Dashboard:
 * Settings → Mail Settings → Event Webhook
 * URL: https://yourdomain.com/api/notifications/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('x-twilio-email-event-webhook-signature');
    const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp');
    
    // In production, verify signature using SendGrid's verification method
    // For now, we'll just process the events
    
    const events = await request.json();
    
    // SendGrid sends an array of events
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    console.info(`[SendGrid Webhook - Admin] Received ${events.length} event(s)`);

    // Process each event
    for (const event of events) {
      const {
        email,
        event: eventType,
        timestamp,
        sg_event_id,
        sg_message_id,
        reason,
        status,
        url,
        asm_group_id,
        category,
        ip,
        useragent,
        attempt,
        response,
        type,
      } = event;

      console.info(`[SendGrid Webhook - Admin] Event: ${eventType} for ${email}`, {
        sg_message_id,
        timestamp,
        reason,
        status,
      });

      // Handle different event types
      switch (eventType) {
        case 'processed':
          await handleEmailProcessed(email, sg_message_id, timestamp);
          break;

        case 'delivered':
          await handleEmailDelivered(email, sg_message_id, timestamp);
          break;

        case 'open':
          await handleEmailOpened(email, sg_message_id, timestamp, useragent, ip);
          break;

        case 'click':
          await handleEmailClicked(email, sg_message_id, timestamp, url, ip);
          break;

        case 'bounce':
          await handleEmailBounced(email, sg_message_id, timestamp, reason, type, status);
          break;

        case 'dropped':
          await handleEmailDropped(email, sg_message_id, timestamp, reason, category);
          break;

        case 'deferred':
          await handleEmailDeferred(email, sg_message_id, timestamp, response, attempt);
          break;

        case 'unsubscribe':
          await handleEmailUnsubscribed(email, sg_message_id, timestamp, asm_group_id);
          break;

        case 'group_unsubscribe':
          await handleGroupUnsubscribed(email, sg_message_id, timestamp, asm_group_id);
          break;

        case 'spamreport':
          await handleSpamReport(email, sg_message_id, timestamp);
          break;

        default:
          console.warn(`[SendGrid Webhook - Admin] Unhandled event type: ${eventType}`);
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('[SendGrid Webhook - Admin] Error processing webhook:', error);
    // Still return 200 to prevent SendGrid from retrying
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    );
  }
}

// Event handlers (same as partner portal)
async function handleEmailProcessed(email: string, messageId: string, timestamp: string) {
  console.info(`[Email Processed - Admin] ${email} - Message ID: ${messageId}`);
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'processed',
    timestamp,
  });
}

async function handleEmailDelivered(email: string, messageId: string, timestamp: string) {
  console.info(`[Email Delivered - Admin] ${email} - Message ID: ${messageId}`);
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'delivered',
    timestamp,
  });
}

async function handleEmailOpened(
  email: string,
  messageId: string,
  timestamp: string,
  useragent?: string,
  ip?: string
) {
  console.info(`[Email Opened - Admin] ${email} - Message ID: ${messageId}`, { useragent, ip });
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'opened',
    timestamp,
    metadata: { useragent, ip },
  });
}

async function handleEmailClicked(
  email: string,
  messageId: string,
  timestamp: string,
  url?: string,
  ip?: string
) {
  console.info(`[Email Clicked - Admin] ${email} - Message ID: ${messageId}`, { url, ip });
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'clicked',
    timestamp,
    metadata: { url, ip },
  });
}

async function handleEmailBounced(
  email: string,
  messageId: string,
  timestamp: string,
  reason?: string,
  type?: string,
  status?: string
) {
  console.error(`[Email Bounced - Admin] ${email} - Message ID: ${messageId}`, {
    reason,
    type,
    status,
  });
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'bounced',
    timestamp,
    metadata: { reason, type, status },
  });
}

async function handleEmailDropped(
  email: string,
  messageId: string,
  timestamp: string,
  reason?: string,
  category?: string[]
) {
  console.error(`[Email Dropped - Admin] ${email} - Message ID: ${messageId}`, {
    reason,
    category,
  });
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'dropped',
    timestamp,
    metadata: { reason, category },
  });
}

async function handleEmailDeferred(
  email: string,
  messageId: string,
  timestamp: string,
  response?: string,
  attempt?: number
) {
  console.warn(`[Email Deferred - Admin] ${email} - Message ID: ${messageId}`, {
    response,
    attempt,
  });
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'deferred',
    timestamp,
    metadata: { response, attempt },
  });
}

async function handleEmailUnsubscribed(
  email: string,
  messageId: string,
  timestamp: string,
  asm_group_id?: number
) {
  console.info(`[Email Unsubscribed - Admin] ${email} - Message ID: ${messageId}`, {
    asm_group_id,
  });
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'unsubscribe',
    timestamp,
    metadata: { asm_group_id },
  });
}

async function handleGroupUnsubscribed(
  email: string,
  messageId: string,
  timestamp: string,
  asm_group_id?: number
) {
  console.info(`[Group Unsubscribed - Admin] ${email} - Message ID: ${messageId}`, {
    asm_group_id,
  });
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'unsubscribe',
    timestamp,
    metadata: { asm_group_id },
  });
}

async function handleSpamReport(email: string, messageId: string, timestamp: string) {
  console.error(`[Spam Report - Admin] ${email} - Message ID: ${messageId}`);
  
  trackEmailEvent({
    email,
    messageId,
    eventType: 'spamreport',
    timestamp,
  });
}

// GET endpoint for webhook verification (if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'SendGrid webhook endpoint is active (Admin)',
    timestamp: new Date().toISOString(),
  });
}

