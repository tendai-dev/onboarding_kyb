using RiskService.Domain.Aggregates;
using RiskService.Domain.ValueObjects;

namespace RiskService.Application.Interfaces;

public interface IRiskAssessmentRepository
{
    Task<RiskAssessment?> GetByIdAsync(RiskAssessmentId id, CancellationToken cancellationToken = default);
    Task<RiskAssessment?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default);
    Task<List<RiskAssessment>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default);
    Task<List<RiskAssessment>> GetByRiskLevelAsync(RiskLevel riskLevel, CancellationToken cancellationToken = default);
    Task AddAsync(RiskAssessment assessment, CancellationToken cancellationToken = default);
    Task UpdateAsync(RiskAssessment assessment, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
