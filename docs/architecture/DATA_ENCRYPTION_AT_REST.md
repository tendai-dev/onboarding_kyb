# Data Encryption at Rest

## Overview

All sensitive data MUST be encrypted at rest using industry-standard encryption algorithms. This document specifies encryption mechanisms for each data store.

## PostgreSQL Encryption

### Transparent Data Encryption (TDE)

**Method 1: pgcrypto (Column-Level)**

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted columns for PII
CREATE TABLE onboarding.onboarding_cases (
    id UUID PRIMARY KEY,
    case_number VARCHAR(50) NOT NULL,
    
    -- Encrypted PII fields
    applicant_email BYTEA NOT NULL,  -- Encrypted
    applicant_phone_number BYTEA NOT NULL,  -- Encrypted
    applicant_tax_id BYTEA,  -- Encrypted
    applicant_ssn BYTEA,  -- Encrypted
    
    -- Non-sensitive fields (plaintext with index)
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    
    encryption_key_version INT NOT NULL DEFAULT 1
);

-- Encryption functions
CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(plaintext, key);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(ciphertext, key);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Usage in application
INSERT INTO onboarding.onboarding_cases 
    (id, applicant_email, applicant_phone_number)
VALUES 
    (gen_random_uuid(), 
     encrypt_pii('john@example.com', current_setting('app.encryption_key')),
     encrypt_pii('+1234567890', current_setting('app.encryption_key')));

-- Query with decryption (requires key)
SELECT 
    id,
    decrypt_pii(applicant_email, current_setting('app.encryption_key')) as email
FROM onboarding.onboarding_cases
WHERE id = '...';
```

**Method 2: LUKS Disk Encryption (Full Disk)**

```bash
# Encrypt PostgreSQL data volume
cryptsetup luksFormat /dev/vdb
cryptsetup luksOpen /dev/vdb postgres-encrypted

# Mount and use
mkfs.ext4 /dev/mapper/postgres-encrypted
mount /dev/mapper/postgres-encrypted /var/lib/postgresql

# Auto-mount with key file
echo "postgres-encrypted UUID=... /etc/keys/postgres.key luks" >> /etc/crypttab
```

### EF Core Integration

```csharp
// Infrastructure/Persistence/Encryption/FieldEncryption.cs
public class EncryptedFieldConverter : ValueConverter<string, byte[]>
{
    public EncryptedFieldConverter(IEncryptionService encryptionService)
        : base(
            v => encryptionService.Encrypt(v),
            v => encryptionService.Decrypt(v))
    {
    }
}

// Usage in entity configuration
builder.Property(e => e.Email)
    .HasConversion(new EncryptedFieldConverter(encryptionService))
    .HasColumnType("bytea");
```

## MinIO Encryption (SSE)

### Server-Side Encryption with Customer Keys (SSE-C)

```csharp
// Infrastructure/Storage/EncryptedMinioClient.cs
public class EncryptedMinioClient : IObjectStorage
{
    private readonly IMinioClient _minio;
    private readonly IKeyManagementService _kms;
    private readonly ILogger<EncryptedMinioClient> _logger;

    public async Task<string> GeneratePresignedUploadUrlAsync(
        string bucketName,
        string objectKey,
        TimeSpan expiry,
        Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default)
    {
        // Get encryption key from KMS
        var encryptionKey = await _kms.GetDataEncryptionKeyAsync("minio-dek", cancellationToken);

        // Generate presigned URL with SSE-C headers
        var args = new PresignedPutObjectArgs()
            .WithBucket(bucketName)
            .WithObject(objectKey)
            .WithExpiry((int)expiry.TotalSeconds)
            .WithHeaders(new Dictionary<string, string>
            {
                ["X-Amz-Server-Side-Encryption-Customer-Algorithm"] = "AES256",
                ["X-Amz-Server-Side-Encryption-Customer-Key"] = Convert.ToBase64String(encryptionKey),
                ["X-Amz-Server-Side-Encryption-Customer-Key-MD5"] = ComputeMD5(encryptionKey)
            });

        return await _minio.PresignedPutObjectAsync(args);
    }

    private static string ComputeMD5(byte[] data)
    {
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(data);
        return Convert.ToBase64String(hash);
    }
}
```

### MinIO Configuration

```yaml
# Enable encryption in MinIO deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
spec:
  template:
    spec:
      containers:
      - name: minio
        env:
        # Enable server-side encryption
        - name: MINIO_SERVER_SIDE_ENCRYPTION
          value: "on"
        
        # KMS configuration (using Vault)
        - name: MINIO_KMS_KES_ENDPOINT
          value: "https://kes.platform-security:7373"
        
        - name: MINIO_KMS_KES_KEY_NAME
          value: "minio-encryption-key"
```

## Redis Encryption

### At-Rest Encryption

```yaml
# Use encrypted volume for Redis data
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-data
  annotations:
    volume.beta.kubernetes.io/storage-class: "encrypted-local-path"
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 8Gi
  storageClassName: encrypted-local-path
```

### In-Transit Encryption (TLS)

```yaml
# Redis with TLS
redis:
  tls:
    enabled: true
    certFilename: tls.crt
    certKeyFilename: tls.key
    certCAFilename: ca.crt
```

## Key Management Service (KMS)

### Using HashiCorp Vault

```bash
# Install Vault
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  --set server.dev.enabled=false \
  --set server.ha.enabled=true \
  -n platform-security

# Initialize Vault
kubectl exec -n platform-security vault-0 -- vault operator init

# Enable transit secrets engine
kubectl exec -n platform-security vault-0 -- vault secrets enable transit

# Create encryption keys
kubectl exec -n platform-security vault-0 -- \
  vault write -f transit/keys/postgres-dek \
  type=aes256-gcm96

kubectl exec -n platform-security vault-0 -- \
  vault write -f transit/keys/minio-dek \
  type=aes256-gcm96
```

### Key Rotation with Vault

```bash
# Rotate encryption key
kubectl exec -n platform-security vault-0 -- \
  vault write -f transit/keys/postgres-dek/rotate

# Re-encrypt data with new key version
# Application code:
# 1. Fetch new key version
# 2. Decrypt with old version
# 3. Encrypt with new version
# 4. Update key_version field
```

### Application Integration

```csharp
// Infrastructure/KeyManagement/VaultKeyManagementService.cs
public class VaultKeyManagementService : IKeyManagementService
{
    private readonly HttpClient _vaultClient;
    private readonly string _vaultToken;
    private readonly ILogger<VaultKeyManagementService> _logger;

    public async Task<byte[]> GetDataEncryptionKeyAsync(
        string keyName,
        CancellationToken cancellationToken = default)
    {
        var response = await _vaultClient.GetAsync(
            $"/v1/transit/export/encryption-key/{keyName}",
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        var data = JsonSerializer.Deserialize<VaultResponse>(content);

        // Return latest key version
        return Convert.FromBase64String(data!.Data.Keys.Last().Value);
    }

    public async Task<byte[]> EncryptAsync(
        string keyName,
        byte[] plaintext,
        CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            plaintext = Convert.ToBase64String(plaintext)
        };

        var response = await _vaultClient.PostAsJsonAsync(
            $"/v1/transit/encrypt/{keyName}",
            payload,
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        var data = JsonSerializer.Deserialize<VaultResponse>(content);

        return Convert.FromBase64String(data!.Data.Ciphertext);
    }

    public async Task<byte[]> DecryptAsync(
        string keyName,
        byte[] ciphertext,
        CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            ciphertext = Convert.ToBase64String(ciphertext)
        };

        var response = await _vaultClient.PostAsJsonAsync(
            $"/v1/transit/decrypt/{keyName}",
            payload,
            cancellationToken);

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        var data = JsonSerializer.Deserialize<VaultResponse>(content);

        return Convert.FromBase64String(data!.Data.Plaintext);
    }
}
```

## Kafka Encryption

### At-Rest (Broker-Side)

```yaml
# Kafka with encrypted volumes
kafka:
  persistence:
    storageClass: "encrypted-local-path"
    size: 20Gi
  
  configurationOverrides:
    # Enable TLS
    "listeners": "PLAINTEXT://:9092,SSL://:9093"
    "advertised.listeners": "PLAINTEXT://kafka:9092,SSL://kafka:9093"
    "ssl.keystore.location": "/etc/kafka/secrets/kafka.keystore.jks"
    "ssl.keystore.password": "${SSL_KEYSTORE_PASSWORD}"
    "ssl.key.password": "${SSL_KEY_PASSWORD}"
    "ssl.truststore.location": "/etc/kafka/secrets/kafka.truststore.jks"
    "ssl.truststore.password": "${SSL_TRUSTSTORE_PASSWORD}"
```

### In-Transit (TLS)

```csharp
// Kafka producer with TLS
var config = new ProducerConfig
{
    BootstrapServers = "kafka:9093",
    SecurityProtocol = SecurityProtocol.Ssl,
    SslCaLocation = "/etc/ssl/certs/ca.crt",
    SslCertificateLocation = "/etc/ssl/certs/client.crt",
    SslKeyLocation = "/etc/ssl/certs/client.key"
};
```

## Key Rotation Strategy

### Automated Rotation Schedule

| Component | Encryption Method | Key Rotation | Automation |
|-----------|------------------|--------------|------------|
| PostgreSQL PII | pgcrypto (AES-256) | 90 days | Script |
| MinIO Objects | SSE-C (AES-256) | 90 days | Script |
| Redis Data | Volume encryption | 180 days | Manual |
| Kafka Messages | TLS + Volume | 180 days | Manual |
| Vault DEK | Transit engine | 30 days | Vault auto |

### Rotation Workflow

```bash
#!/bin/bash
# Key rotation workflow

# 1. Generate new key version in Vault
vault write -f transit/keys/postgres-dek/rotate

# 2. Re-encrypt sensitive data
psql -U postgres -d onboarding << 'SQL'
BEGIN;

-- Update records with new key version
UPDATE onboarding.onboarding_cases
SET 
    applicant_email = encrypt_pii(
        decrypt_pii(applicant_email, 'old-key'),
        'new-key'
    ),
    encryption_key_version = 2
WHERE encryption_key_version = 1
LIMIT 1000;

COMMIT;
SQL

# 3. Verify re-encryption
# 4. Cleanup old key version after grace period
```

## Compliance Requirements

### GDPR
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Key rotation (90-day maximum)
- ✅ Right to erasure (crypto-shredding)

### PCI DSS (if handling payment data)
- ✅ AES-256 encryption
- ✅ Key management with Vault
- ✅ Access controls and audit logs
- ✅ Annual penetration testing

### HIPAA (if handling health data)
- ✅ Encryption at rest and in transit
- ✅ Key rotation and access logs
- ✅ Audit trail for all access

## Crypto-Shredding (Right to Erasure)

Instead of deleting encrypted data, delete the encryption key:

```sql
-- Mark key for deletion
UPDATE encryption_keys
SET deleted_at = NOW(),
    scheduled_purge_at = NOW() + INTERVAL '30 days'
WHERE entity_id = '<user-id>';

-- Data becomes unrecoverable without key
-- Actual encrypted data can remain (GDPR compliant)
```

## Monitoring & Alerts

```promql
# Alert on encryption failures
rate(encryption_errors_total[5m]) > 0

# Alert on unencrypted data writes
unencrypted_writes_total > 0

# Monitor key age
(time() - encryption_key_created_timestamp) / 86400 > 90
```

## Audit Requirements

Log all encryption operations:

```json
{
  "timestamp": "2025-10-21T14:30:00Z",
  "operation": "encrypt",
  "key_name": "postgres-dek",
  "key_version": 2,
  "entity_type": "onboarding_case",
  "entity_id": "uuid",
  "user_id": "uuid",
  "success": true
}
```

## References

- [PostgreSQL pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [MinIO Encryption](https://min.io/docs/minio/linux/operations/server-side-encryption.html)
- [HashiCorp Vault Transit](https://www.vaultproject.io/docs/secrets/transit)

