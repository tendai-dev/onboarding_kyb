using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(Guid id, bool includePermissions = false, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> GetAllAsync(bool includePermissions = false, CancellationToken cancellationToken = default);
    Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
    Task<User?> GetOrCreateByEmailAsync(string email, string? name = null, CancellationToken cancellationToken = default);
}

