using Microsoft.Extensions.Logging;
using Npgsql;
using System.Security.Cryptography;

namespace DocumentService.Infrastructure.Storage;

/// <summary>
/// Content-based deduplication using SHA256 hash
/// Prevents duplicate document uploads and saves storage
/// </summary>
public interface IContentHashDeduplicator
{
    Task<string> ComputeHashAsync(Stream stream, CancellationToken cancellationToken = default);
    Task<DuplicateCheckResult> CheckForDuplicateAsync(string contentHash, Guid caseId, CancellationToken cancellationToken = default);
    Task RegisterDocumentHashAsync(Guid documentId, string contentHash, Guid caseId, CancellationToken cancellationToken = default);
}

public class ContentHashDeduplicator : IContentHashDeduplicator
{
    private readonly string _connectionString;
    private readonly ILogger<ContentHashDeduplicator> _logger;

    public ContentHashDeduplicator(string connectionString, ILogger<ContentHashDeduplicator> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    public async Task<string> ComputeHashAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(stream, cancellationToken);
        return Convert.ToHexString(hashBytes).ToLower();
    }

    public async Task<DuplicateCheckResult> CheckForDuplicateAsync(
        string contentHash,
        Guid caseId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        // Check for existing document with same hash
        var sql = @"
            SELECT 
                d.id,
                d.document_number,
                d.case_id,
                d.file_name,
                d.storage_key,
                d.uploaded_at
            FROM documents.documents d
            INNER JOIN documents.document_hashes h ON d.id = h.document_id
            WHERE h.content_hash = @ContentHash
                AND d.status != 'Rejected'
            ORDER BY d.uploaded_at DESC
            LIMIT 1";

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@ContentHash", contentHash);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (await reader.ReadAsync(cancellationToken))
        {
            var existingDocId = reader.GetGuid(0);
            var existingCaseId = reader.GetGuid(2);

            _logger.LogInformation(
                "Duplicate content detected: hash {Hash} already exists for document {DocumentId}",
                contentHash, existingDocId);

            return new DuplicateCheckResult
            {
                IsDuplicate = true,
                ExistingDocumentId = existingDocId,
                ExistingCaseId = existingCaseId,
                CanReuse = existingCaseId == caseId,  // Can reuse if same case
                ExistingStorageKey = reader.GetString(4)
            };
        }

        return new DuplicateCheckResult
        {
            IsDuplicate = false
        };
    }

    public async Task RegisterDocumentHashAsync(
        Guid documentId,
        string contentHash,
        Guid caseId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        // Store hash mapping
        var sql = @"
            INSERT INTO documents.document_hashes 
                (document_id, content_hash, case_id, registered_at)
            VALUES 
                (@DocumentId, @ContentHash, @CaseId, @RegisteredAt)
            ON CONFLICT (content_hash) DO NOTHING";

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@DocumentId", documentId);
        command.Parameters.AddWithValue("@ContentHash", contentHash);
        command.Parameters.AddWithValue("@CaseId", caseId);
        command.Parameters.AddWithValue("@RegisteredAt", DateTime.UtcNow);

        await command.ExecuteNonQueryAsync(cancellationToken);

        _logger.LogInformation(
            "Registered content hash {Hash} for document {DocumentId}",
            contentHash, documentId);
    }
}

public class DuplicateCheckResult
{
    public bool IsDuplicate { get; set; }
    public Guid? ExistingDocumentId { get; set; }
    public Guid? ExistingCaseId { get; set; }
    public bool CanReuse { get; set; }
    public string? ExistingStorageKey { get; set; }
}

// Add to PostgreSQL init script:
// CREATE TABLE IF NOT EXISTS documents.document_hashes (
//     document_id UUID NOT NULL REFERENCES documents.documents(id),
//     content_hash VARCHAR(64) NOT NULL,
//     case_id UUID NOT NULL,
//     registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
//     PRIMARY KEY (document_id),
//     UNIQUE (content_hash)
// );
// CREATE INDEX idx_document_hashes_content_hash ON documents.document_hashes(content_hash);

