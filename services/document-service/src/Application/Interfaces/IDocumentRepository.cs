using DocumentService.Domain.Aggregates;

namespace DocumentService.Application.Interfaces;

public interface IDocumentRepository
{
    IUnitOfWork UnitOfWork { get; }
    
    Task<Document?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Document>> GetByCaseIdAsync(Guid caseId, CancellationToken cancellationToken = default);
    Task AddAsync(Document document, CancellationToken cancellationToken = default);
    void Update(Document document);
}

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

