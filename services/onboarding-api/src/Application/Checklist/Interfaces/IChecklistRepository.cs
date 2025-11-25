using OnboardingApi.Domain.Checklist.ValueObjects;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;

namespace OnboardingApi.Application.Checklist.Interfaces;

public interface IChecklistRepository
{
    Task<DomainChecklist?> GetByIdAsync(ChecklistId id, CancellationToken cancellationToken = default);
    Task<DomainChecklist?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default);
    Task<List<DomainChecklist>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default);
    Task<List<DomainChecklist>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(DomainChecklist checklist, CancellationToken cancellationToken = default);
    Task UpdateAsync(DomainChecklist checklist, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

