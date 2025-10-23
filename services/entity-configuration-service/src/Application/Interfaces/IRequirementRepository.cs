using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Application.Interfaces;

public interface IRequirementRepository
{
    Task<Requirement?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Requirement?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<List<Requirement>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<List<Requirement>> GetByTypeAsync(RequirementType type, CancellationToken cancellationToken = default);
    Task AddAsync(Requirement requirement, CancellationToken cancellationToken = default);
    Task UpdateAsync(Requirement requirement, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}


