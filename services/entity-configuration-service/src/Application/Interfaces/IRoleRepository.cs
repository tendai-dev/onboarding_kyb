using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Application.Interfaces;

public interface IRoleRepository
{
    Task<Role?> GetByIdAsync(Guid id, bool includePermissions = false, bool includeUserRoles = false, CancellationToken cancellationToken = default);
    Task<Role?> GetByNameAsync(string name, bool includePermissions = false, CancellationToken cancellationToken = default);
    Task<IEnumerable<Role>> GetAllAsync(bool includePermissions = false, CancellationToken cancellationToken = default);
    Task<Role> CreateAsync(Role role, CancellationToken cancellationToken = default);
    Task UpdateAsync(Role role, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

