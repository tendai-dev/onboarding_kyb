using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;

namespace OnboardingApi.Application.Document.Interfaces;

public interface IDocumentRepository
{
    Task<DomainDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DomainDocument?> GetByStorageKeyAsync(string storageKey, CancellationToken cancellationToken = default);
    Task<List<DomainDocument>> GetByCaseIdAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task<List<DomainDocument>> GetAllAsync(int skip = 0, int take = 100, CancellationToken cancellationToken = default);
    Task<int> GetCountAsync(CancellationToken cancellationToken = default);
    Task AddAsync(DomainDocument document, CancellationToken cancellationToken = default);
    Task UpdateAsync(DomainDocument document, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

