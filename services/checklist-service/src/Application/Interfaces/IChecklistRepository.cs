using ChecklistService.Domain.Aggregates;
using ChecklistService.Domain.ValueObjects;

namespace ChecklistService.Application.Interfaces;

public interface IChecklistRepository
{
    Task<Checklist?> GetByIdAsync(ChecklistId id, CancellationToken cancellationToken = default);
    Task<Checklist?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default);
    Task<List<Checklist>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default);
    Task<List<Checklist>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Checklist checklist, CancellationToken cancellationToken = default);
    Task UpdateAsync(Checklist checklist, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
