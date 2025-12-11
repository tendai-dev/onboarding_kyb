using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;

namespace OnboardingApi.Application.Risk.Interfaces;

public interface IRiskAssessmentRepository
{
    Task<RiskAssessment?> GetByIdAsync(RiskAssessmentId id, CancellationToken cancellationToken = default);
    Task<RiskAssessment?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default);
    Task<List<RiskAssessment>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default);
    Task<List<RiskAssessment>> GetByRiskLevelAsync(RiskLevel riskLevel, CancellationToken cancellationToken = default);
    Task<List<RiskAssessment>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<RiskAssessment>> SearchAsync(string? partnerId = null, RiskLevel? riskLevel = null, string? status = null, string? caseId = null, CancellationToken cancellationToken = default);
    Task AddAsync(RiskAssessment assessment, CancellationToken cancellationToken = default);
    Task UpdateAsync(RiskAssessment assessment, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

