using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Interfaces;

/// <summary>
/// Repository interface for OnboardingCase aggregate
/// </summary>
public interface IOnboardingCaseRepository
{
    IUnitOfWork UnitOfWork { get; }

    Task<OnboardingCase?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    
    Task<OnboardingCase?> GetByCaseNumberAsync(string caseNumber, CancellationToken cancellationToken = default);
    
    Task<IEnumerable<OnboardingCase>> GetByPartnerIdAsync(Guid partnerId, CancellationToken cancellationToken = default);
    
    Task AddAsync(OnboardingCase onboardingCase, CancellationToken cancellationToken = default);
    
    void Update(OnboardingCase onboardingCase);
    
    void Delete(OnboardingCase onboardingCase);
}

/// <summary>
/// Unit of Work pattern for transaction management
/// </summary>
public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default);
}

