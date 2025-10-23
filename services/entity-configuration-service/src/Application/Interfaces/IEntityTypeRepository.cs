using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Application.Interfaces;

public interface IEntityTypeRepository
{
    Task<EntityType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EntityType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<List<EntityType>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<List<EntityType>> GetAllWithRequirementsAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task AddAsync(EntityType entityType, CancellationToken cancellationToken = default);
    Task UpdateAsync(EntityType entityType, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}


