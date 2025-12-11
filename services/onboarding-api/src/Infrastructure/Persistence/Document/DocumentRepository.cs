using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.Document.Interfaces;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;
using OnboardingApi.Infrastructure.Persistence.Document;

namespace OnboardingApi.Infrastructure.Persistence.Document;

public class DocumentRepository : IDocumentRepository
{
    private readonly DocumentDbContext _context;

    public DocumentRepository(DocumentDbContext context)
    {
        _context = context;
    }

    public async Task<DomainDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<DomainDocument?> GetByStorageKeyAsync(string storageKey, CancellationToken cancellationToken = default)
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

        // Try partial match (contains)
        document = await _context.Documents
            .FirstOrDefaultAsync(d => d.StorageKey != null && 
                                     (d.StorageKey.Contains(storageKey) || storageKey.Contains(d.StorageKey)), cancellationToken);
        
        return document;
    }

    public async Task<List<DomainDocument>> GetByCaseIdAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        return await _context.Documents
            .Where(d => d.CaseId == caseId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<DomainDocument>> GetAllAsync(int skip = 0, int take = 100, CancellationToken cancellationToken = default)
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

    public async Task AddAsync(DomainDocument document, CancellationToken cancellationToken = default)
    {
        await _context.Documents.AddAsync(document, cancellationToken);
    }

    public async Task UpdateAsync(DomainDocument document, CancellationToken cancellationToken = default)
    {
        _context.Documents.Update(document);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
