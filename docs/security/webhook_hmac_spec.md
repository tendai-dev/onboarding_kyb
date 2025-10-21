# Webhook Security Specification

## Overview

This document specifies how webhooks are signed using HMAC-SHA256 signatures to ensure authenticity and integrity. All webhook consumers MUST verify signatures to prevent unauthorized access and man-in-the-middle attacks.

## Signing Process (Server Side)

### 1. Signature Generation

```csharp
string payload = JsonSerializer.Serialize(webhookData);
byte[] keyBytes = Encoding.UTF8.GetBytes(signingSecret);
byte[] payloadBytes = Encoding.UTF8.GetBytes(payload);

using var hmac = new HMACSHA256(keyBytes);
byte[] hash = hmac.ComputeHash(payloadBytes);
string signature = Convert.ToBase64String(hash);
```

### 2. Request Headers

```http
POST https://partner.example.com/webhooks/onboarding
Content-Type: application/json
X-Webhook-Signature: sha256=<base64-encoded-hmac>
X-Webhook-Delivery-Id: <UUID>
X-Webhook-Event-Type: onboarding.case.submitted
X-Webhook-Timestamp: 1640000000
User-Agent: OnboardingPlatform-Webhooks/1.0

{
  "event_id": "uuid",
  "event_type": "onboarding.case.submitted",
  "occurred_at": "2025-10-21T14:30:00Z",
  "data": {
    "case_id": "uuid",
    "case_number": "OBC-20251021-12345",
    "partner_id": "uuid",
    "status": "submitted"
  }
}
```

## Verification Process (Client Side)

### 1. Extract Signature

```javascript
// Node.js example
const signature = req.headers['x-webhook-signature']; // "sha256=..."
const receivedHash = signature.split('=')[1]; // Extract base64 hash
```

### 2. Compute Expected Signature

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  // Compute HMAC
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload); // Raw request body as string
  const expectedHash = hmac.digest('base64');
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash),
    Buffer.from(signature.split('=')[1])
  );
}

// Usage
const rawBody = req.rawBody; // IMPORTANT: Use raw body, not parsed JSON
const signature = req.headers['x-webhook-signature'];
const secret = process.env.WEBHOOK_SECRET;

if (!verifyWebhookSignature(rawBody, signature, secret)) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// Process webhook...
```

### 3. Python Example

```python
import hmac
import hashlib
import base64

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify webhook HMAC signature."""
    expected_hmac = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    )
    expected_signature = base64.b64encode(expected_hmac.digest()).decode('utf-8')
    expected_full = f"sha256={expected_signature}"
    
    # Constant-time comparison
    return hmac.compare_digest(expected_full, signature)

# Usage
raw_body = request.get_data()  # Raw bytes
signature = request.headers.get('X-Webhook-Signature')
secret = os.getenv('WEBHOOK_SECRET')

if not verify_webhook_signature(raw_body, signature, secret):
    return {'error': 'Invalid signature'}, 401
```

### 4. C# Example

```csharp
using System.Security.Cryptography;
using System.Text;

public static bool VerifyWebhookSignature(string payload, string signature, string secret)
{
    var keyBytes = Encoding.UTF8.GetBytes(secret);
    var payloadBytes = Encoding.UTF8.GetBytes(payload);
    
    using var hmac = new HMACSHA256(keyBytes);
    var expectedHash = hmac.ComputeHash(payloadBytes);
    var expectedSignature = $"sha256={Convert.ToBase64String(expectedHash)}";
    
    // Constant-time comparison
    return CryptographicOperations.FixedTimeEquals(
        Encoding.UTF8.GetBytes(expectedSignature),
        Encoding.UTF8.GetBytes(signature)
    );
}

// Usage in ASP.NET Core
[HttpPost("webhooks/onboarding")]
public async Task<IActionResult> HandleWebhook()
{
    using var reader = new StreamReader(Request.Body);
    var rawBody = await reader.ReadToEndAsync();
    
    var signature = Request.Headers["X-Webhook-Signature"].FirstOrDefault();
    var secret = _configuration["WebhookSecret"];
    
    if (!VerifyWebhookSignature(rawBody, signature, secret))
    {
        return Unauthorized(new { error = "Invalid signature" });
    }
    
    // Process webhook...
    return Ok();
}
```

## Delivery Guarantees

### Retry Schedule
- **Immediate**: First attempt
- **1 minute**: After first failure
- **5 minutes**: After second failure
- **30 minutes**: After third failure
- **2 hours**: After fourth failure
- **6 hours**: After fifth failure
- **24 hours**: Final attempt

### Success Criteria
- HTTP status codes `200-299` considered success
- Response within 30 seconds timeout

### Failure Handling
- After all retries exhausted → moved to Dead Letter Queue (DLQ)
- Manual retry available via admin console

### Deduplication
- Each delivery has unique `X-Webhook-Delivery-Id`
- Consumers SHOULD store and check delivery IDs to prevent duplicate processing

## Best Practices

### 1. Always Verify Signatures
```javascript
// ❌ BAD: Don't skip verification
app.post('/webhook', (req, res) => {
  processWebhook(req.body); // INSECURE!
  res.sendStatus(200);
});

// ✅ GOOD: Always verify
app.post('/webhook', (req, res) => {
  if (!verifySignature(req.rawBody, req.headers['x-webhook-signature'], secret)) {
    return res.status(401).send('Invalid signature');
  }
  processWebhook(req.body);
  res.sendStatus(200);
});
```

### 2. Use Raw Request Body
```javascript
// ❌ BAD: Parsed body won't match signature
app.use(express.json());
app.post('/webhook', (req, res) => {
  verify(JSON.stringify(req.body), signature, secret); // Wrong!
});

// ✅ GOOD: Use raw body
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  verify(req.body.toString('utf8'), signature, secret);
});
```

### 3. Respond Quickly
```javascript
// ✅ GOOD: Respond 200 immediately, process async
app.post('/webhook', async (req, res) => {
  if (!verifySignature(...)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Respond immediately
  res.sendStatus(200);
  
  // Process async (don't await)
  processWebhookAsync(req.body).catch(err => {
    logger.error('Webhook processing failed', err);
  });
});
```

### 4. Implement Idempotency
```javascript
// Store processed delivery IDs
const processedDeliveries = new Set();

app.post('/webhook', (req, res) => {
  const deliveryId = req.headers['x-webhook-delivery-id'];
  
  if (processedDeliveries.has(deliveryId)) {
    logger.info(`Duplicate delivery ${deliveryId}, ignoring`);
    return res.sendStatus(200); // Already processed
  }
  
  processWebhook(req.body);
  processedDeliveries.add(deliveryId);
  res.sendStatus(200);
});
```

### 5. Validate Timestamp
```javascript
// Reject old webhooks to prevent replay attacks
const MAX_AGE_SECONDS = 300; // 5 minutes

app.post('/webhook', (req, res) => {
  const timestamp = parseInt(req.headers['x-webhook-timestamp']);
  const now = Math.floor(Date.now() / 1000);
  
  if (Math.abs(now - timestamp) > MAX_AGE_SECONDS) {
    return res.status(401).send('Webhook too old');
  }
  
  // Verify signature and process...
});
```

## Event Types

| Event Type | Description |
|------------|-------------|
| `onboarding.case.created` | New onboarding case created |
| `onboarding.case.submitted` | Case submitted for review |
| `onboarding.case.approved` | Case approved |
| `onboarding.case.rejected` | Case rejected |
| `onboarding.case.updated` | Case details updated |
| `document.uploaded` | Document uploaded |
| `document.verified` | Document verification complete |
| `kyc.check.completed` | KYC check completed |
| `risk.assessment.completed` | Risk assessment completed |

## Webhook Payload Structure

```json
{
  "event_id": "uuid",
  "event_type": "onboarding.case.submitted",
  "occurred_at": "2025-10-21T14:30:00.000Z",
  "api_version": "v1",
  "data": {
    "case_id": "uuid",
    "case_number": "OBC-20251021-12345",
    "partner_id": "uuid",
    "partner_reference_id": "PART-12345",
    "type": "individual",
    "status": "submitted",
    "submitted_at": "2025-10-21T14:30:00.000Z"
  }
}
```

## Testing Webhooks

### Postman Collection

```json
{
  "request": {
    "method": "POST",
    "url": "http://localhost:3000/webhook",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      },
      {
        "key": "X-Webhook-Signature",
        "value": "sha256=..."
      },
      {
        "key": "X-Webhook-Delivery-Id",
        "value": "{{$guid}}"
      },
      {
        "key": "X-Webhook-Event-Type",
        "value": "onboarding.case.submitted"
      },
      {
        "key": "X-Webhook-Timestamp",
        "value": "{{$timestamp}}"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\"event_id\":\"...\",\"data\":{...}}"
    }
  }
}
```

### Local Testing with ngrok

```bash
# 1. Start ngrok tunnel
ngrok http 3000

# 2. Configure webhook URL in admin portal
https://abc123.ngrok.io/webhook

# 3. Trigger test event
curl -X POST https://api.yourdomain.tld/admin/webhooks/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "onboarding.case.submitted"}'
```

## Security Checklist

- [ ] Verify HMAC signature on every webhook
- [ ] Use constant-time comparison to prevent timing attacks
- [ ] Validate timestamp to prevent replay attacks
- [ ] Store and check delivery IDs for idempotency
- [ ] Use HTTPS endpoints only
- [ ] Rotate signing secrets regularly (every 90 days)
- [ ] Log all webhook deliveries and failures
- [ ] Monitor for unusual patterns (rate, failures)
- [ ] Implement rate limiting on webhook endpoints
- [ ] Use separate secrets for staging and production

## Troubleshooting

### Signature Verification Fails

1. **Ensure raw body is used**: Don't use parsed JSON
2. **Check encoding**: UTF-8 encoding on both sides
3. **Verify secret**: Correct signing secret from admin portal
4. **Inspect payload**: Whitespace, line endings must match exactly

### Debugging Example

```javascript
// Log details for debugging
console.log('Received signature:', req.headers['x-webhook-signature']);
console.log('Raw body:', req.body.toString('utf8'));
console.log('Body length:', req.body.length);

// Compute and log expected signature
const hmac = crypto.createHmac('sha256', secret);
hmac.update(req.body);
const expected = `sha256=${hmac.digest('base64')}`;
console.log('Expected signature:', expected);
```

## Support

For webhook-related issues:
- **Documentation**: https://docs.yourdomain.tld/webhooks
- **Support**: support@yourdomain.tld
- **Status Page**: https://status.yourdomain.tld

