import { NextRequest, NextResponse } from 'next/server';
import { trackEmailEvent } from '@/lib/emailAnalytics';

/**
 * POST /api/notifications/webhook - SendGrid Webhook Handler
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

    console.info(`[SendGrid Webhook] Received ${events.length} event(s)`);

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
        url_offset,
      } = event;

      console.info(`[SendGrid Webhook] Event: ${eventType} for ${email}`, {
        sg_message_id,
        timestamp,
        reason,
        status,
      });

      // Handle different event types
      switch (eventType) {
        case 'processed':
          // Email was received and is ready to be delivered
          await handleEmailProcessed(email, sg_message_id, timestamp);
          break;

        case 'delivered':
          // Email was successfully delivered
          await handleEmailDelivered(email, sg_message_id, timestamp);
          break;

        case 'open':
          // Recipient opened the email
          await handleEmailOpened(email, sg_message_id, timestamp, useragent, ip);
          break;

        case 'click':
          // Recipient clicked a link in the email
          await handleEmailClicked(email, sg_message_id, timestamp, url, ip);
          break;

        case 'bounce':
          // Email bounced (hard or soft)
          await handleEmailBounced(email, sg_message_id, timestamp, reason, type, status);
          break;

        case 'dropped':
          // Email was dropped (not sent)
          await handleEmailDropped(email, sg_message_id, timestamp, reason, category);
          break;

        case 'deferred':
          // Email delivery was delayed
          await handleEmailDeferred(email, sg_message_id, timestamp, response, attempt);
          break;

        case 'unsubscribe':
          // Recipient unsubscribed
          await handleEmailUnsubscribed(email, sg_message_id, timestamp, asm_group_id);
          break;

        case 'group_unsubscribe':
          // Recipient unsubscribed from a group
          await handleGroupUnsubscribed(email, sg_message_id, timestamp, asm_group_id);
          break;

        case 'spamreport':
          // Recipient marked email as spam
          await handleSpamReport(email, sg_message_id, timestamp);
          break;

        default:
          console.warn(`[SendGrid Webhook] Unhandled event type: ${eventType}`);
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('[SendGrid Webhook] Error processing webhook:', error);
    // Still return 200 to prevent SendGrid from retrying
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    );
  }
}

// Event handlers
async function handleEmailProcessed(email: string, messageId: string, timestamp: string) {
  // Log that email was processed
  console.info(`[Email Processed] ${email} - Message ID: ${messageId}`);
  
  // Track event in analytics
  trackEmailEvent({
    email,
    messageId,
    eventType: 'processed',
    timestamp,
  });
  
  // Could update notification status in database here
}

async function handleEmailDelivered(email: string, messageId: string, timestamp: string) {
  console.info(`[Email Delivered] ${email} - Message ID: ${messageId}`);
  
  // Track event in analytics
  trackEmailEvent({
    email,
    messageId,
    eventType: 'delivered',
    timestamp,
  });
  
  // Update notification status to "delivered" in database
  // Could also send internal notification or update analytics
}

async function handleEmailOpened(
  email: string,
  messageId: string,
  timestamp: string,
  useragent?: string,
  ip?: string
) {
  console.info(`[Email Opened] ${email} - Message ID: ${messageId}`, { useragent, ip });
  
  // Track event in analytics
  trackEmailEvent({
    email,
    messageId,
    eventType: 'opened',
    timestamp,
    metadata: { useragent, ip },
  });
  
  // Track email opens for analytics
  // Could update notification record with open timestamp
}

async function handleEmailClicked(
  email: string,
  messageId: string,
  timestamp: string,
  url?: string,
  ip?: string
) {
  console.info(`[Email Clicked] ${email} - Message ID: ${messageId}`, { url, ip });
  
  // Track event in analytics
  trackEmailEvent({
    email,
    messageId,
    eventType: 'clicked',
    timestamp,
    metadata: { url, ip },
  });
  
  // Track link clicks for analytics
  // Could update notification record with click data
}

async function handleEmailBounced(
  email: string,
  messageId: string,
  timestamp: string,
  reason?: string,
  type?: string,
  status?: string
) {
  console.error(`[Email Bounced] ${email} - Message ID: ${messageId}`, {
    reason,
    type, // 'bounce' or 'blocked'
    status, // '4.0.0' (hard bounce) or '5.0.0' (soft bounce)
  });
  
  // Track event in analytics
  trackEmailEvent({
    email,
    messageId,
    eventType: 'bounced',
    timestamp,
    metadata: { reason, type, status },
  });
  
  // Update notification status to "bounced" in database
  // Could send alert to admin or mark email as invalid
  // For hard bounces, consider removing email from mailing list
}

async function handleEmailDropped(
  email: string,
  messageId: string,
  timestamp: string,
  reason?: string,
  category?: string[]
) {
  console.error(`[Email Dropped] ${email} - Message ID: ${messageId}`, {
    reason,
    category,
  });
  
  // Track event in analytics
  trackEmailEvent({
    email,
    messageId,
    eventType: 'dropped',
    timestamp,
    metadata: { reason, category },
  });
  
  // Email was dropped (not sent)
  // Common reasons: invalid email, spam content, unsubscribed, etc.
  // Update notification status to "dropped" in database
}

async function handleEmailDeferred(
  email: string,
  messageId: string,
  timestamp: string,
  response?: string,
  attempt?: number
) {
  console.warn(`[Email Deferred] ${email} - Message ID: ${messageId}`, {
    response,
    attempt,
  });
  
  // Email delivery was delayed
  // SendGrid will retry automatically
}

async function handleEmailUnsubscribed(
  email: string,
  messageId: string,
  timestamp: string,
  asm_group_id?: number
) {
  console.info(`[Email Unsubscribed] ${email} - Message ID: ${messageId}`, {
    asm_group_id,
  });
  
  // Recipient unsubscribed
  // Update user preferences to stop sending emails
  // Could mark email as unsubscribed in database
}

async function handleGroupUnsubscribed(
  email: string,
  messageId: string,
  timestamp: string,
  asm_group_id?: number
) {
  console.info(`[Group Unsubscribed] ${email} - Message ID: ${messageId}`, {
    asm_group_id,
  });
  
  // Recipient unsubscribed from a specific group
  // Update user preferences for that group
}

async function handleSpamReport(email: string, messageId: string, timestamp: string) {
  console.error(`[Spam Report] ${email} - Message ID: ${messageId}`);
  
  // Recipient marked email as spam
  // This is serious - consider:
  // 1. Removing email from mailing list
  // 2. Reviewing email content
  // 3. Checking sender reputation
  // 4. Updating notification status
}

// GET endpoint for webhook verification (if needed)
export async function GET(request: NextRequest) {
  // Some webhook services require GET for verification
  return NextResponse.json({
    message: 'SendGrid webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

