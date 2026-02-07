using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Interfaces;

/// <summary>
/// Repository interface for OnboardingCase aggregate
/// </summary>
public interface IOnboardingCaseRepository
{
    IUnitOfWork UnitOfWork { get; }

    Task<OnboardingCase?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Batch lookup cases by IDs to prevent N+1 queries.
    /// Returns a dictionary mapping ID to OnboardingCase.
    /// </summary>
    Task<Dictionary<Guid, OnboardingCase>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default);
    
    Task<OnboardingCase?> GetByCaseNumberAsync(string caseNumber, CancellationToken cancellationToken = default);
    
    Task<IEnumerable<OnboardingCase>> GetByPartnerIdAsync(Guid partnerId, CancellationToken cancellationToken = default);
    
    Task<(IEnumerable<OnboardingCase> Items, int TotalCount)> GetByPartnerIdWithFiltersAsync(
        Guid partnerId,
        int limit = 25,
        int offset = 0,
        string? status = null,
        string? assignee = null,
        CancellationToken cancellationToken = default);
    
    Task AddAsync(OnboardingCase onboardingCase, CancellationToken cancellationToken = default);
    
    void Update(OnboardingCase onboardingCase);
    
    void Delete(OnboardingCase onboardingCase);
    
    /// <summary>
    /// Delete all cases (admin operation)
    /// </summary>
    Task<int> DeleteAllAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get total count of cases
    /// </summary>
    Task<int> GetCountAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Query cases with filtering, sorting, and pagination
    /// </summary>
    Task<(IEnumerable<OnboardingCase> Items, int TotalCount)> QueryAsync(
        CaseQueryParameters parameters,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get cases requiring attention (UnderReview or Submitted status)
    /// </summary>
    Task<IEnumerable<OnboardingCase>> GetCasesRequiringAttentionAsync(
        Guid? partnerId = null,
        int limit = 50,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get case by ID or case number
    /// </summary>
    Task<OnboardingCase?> GetByIdOrCaseNumberAsync(string identifier, CancellationToken cancellationToken = default);
}

/// <summary>
/// Parameters for querying cases
/// </summary>
public class CaseQueryParameters
{
    public Guid? PartnerId { get; set; }
    public string? Status { get; set; }
    public string? RiskLevel { get; set; }
    public string? AssignedTo { get; set; }
    public bool? IsOverdue { get; set; }
    public bool? RequiresManualReview { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? SearchTerm { get; set; }
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; }
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 25;
}

/// <summary>
/// Unit of Work pattern for transaction management
/// </summary>
public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

