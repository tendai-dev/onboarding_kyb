using DocumentService.Application.Interfaces;
using DocumentService.Domain.Aggregates;
using DocumentService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DocumentService.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly DocumentDbContext _context;

    public DocumentRepository(DocumentDbContext context)
    {
        _context = context;
    }

    public IUnitOfWork UnitOfWork => _context;

    public async Task<Document?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<Document?> GetByStorageKeyAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storageKey))
            return null;

        // Try exact match first
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.StorageKey == storageKey, cancellationToken);
        
        if (document != null)
            return document;

        // Try case-insensitive match
        document = await _context.Documents
            .FirstOrDefaultAsync(d => d.StorageKey != null && d.StorageKey.Equals(storageKey, StringComparison.OrdinalIgnoreCase), cancellationToken);
        
        if (document != null)
            return document;

        // Try matching by removing bucket prefix if present
        // Storage keys might be stored as "documents/path/to/file" or just "path/to/file"
        var keyWithoutBucket = storageKey;
        if (storageKey.Contains('/'))
        {
            var parts = storageKey.Split('/', 2);
            if (parts.Length == 2)
            {
                keyWithoutBucket = parts[1];
                document = await _context.Documents
                    .FirstOrDefaultAsync(d => d.StorageKey == keyWithoutBucket || 
                                             (d.StorageKey != null && d.StorageKey.EndsWith(keyWithoutBucket, StringComparison.OrdinalIgnoreCase)), cancellationToken);
                if (document != null)
                    return document;
            }
        }

        // Try partial match (contains)
        document = await _context.Documents
            .FirstOrDefaultAsync(d => d.StorageKey != null && 
                                     (d.StorageKey.Contains(storageKey) || storageKey.Contains(d.StorageKey)), cancellationToken);
        
        return document;
    }

    public async Task<IEnumerable<Document>> GetByCaseIdAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        return await _context.Documents
            .Where(d => d.CaseId == caseId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Document>> GetAllAsync(int skip = 0, int take = 100, CancellationToken cancellationToken = default)
    {
        return await _context.Documents
            .OrderByDescending(d => d.UploadedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Documents.CountAsync(cancellationToken);
    }

    public async Task AddAsync(Document document, CancellationToken cancellationToken = default)
    {
        await _context.Documents.AddAsync(document, cancellationToken);
    }

    public void Update(Document document)
    {
        _context.Documents.Update(document);
    }
}
