using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Risk;

namespace OnboardingApi.Infrastructure.Persistence.Risk;

public class RiskAssessmentRepository : IRiskAssessmentRepository
{
    private readonly RiskDbContext _context;
    private readonly ILogger<RiskAssessmentRepository> _logger;
    private readonly IOnboardingCaseRepository? _caseRepository;

    public RiskAssessmentRepository(RiskDbContext context, ILogger<RiskAssessmentRepository> logger, IOnboardingCaseRepository? caseRepository = null)
    {
        _context = context;
        _logger = logger;
        _caseRepository = caseRepository;
    }

    public async Task<RiskAssessment?> GetByIdAsync(RiskAssessmentId id, CancellationToken cancellationToken = default)
    {
        return await _context.RiskAssessments
            .Include(a => a.Factors)
            .AsTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<RiskAssessment?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        // First, try exact match on the provided caseId
        var assessment = await _context.RiskAssessments
            .Include(a => a.Factors)
            .AsTracking()
            .FirstOrDefaultAsync(a => a.CaseId == caseId, cancellationToken);
        
        if (assessment != null)
            return assessment;
        
        // If not found and caseId looks like a GUID, try to find the case and get its case number
        if (Guid.TryParse(caseId, out var caseGuid) && _caseRepository != null)
        {
            try
            {
                var onboardingCase = await _caseRepository.GetByIdAsync(caseGuid, cancellationToken);
                if (onboardingCase?.CaseNumber != null && onboardingCase.CaseNumber != caseId)
                {
                    // Try to find assessment by case number
                    assessment = await _context.RiskAssessments
                        .Include(a => a.Factors)
                        .AsTracking()
                        .FirstOrDefaultAsync(a => a.CaseId == onboardingCase.CaseNumber, cancellationToken);
                    
                    if (assessment != null)
                    {
                        _logger.LogDebug(
                            "Found risk assessment by case number {CaseNumber} for GUID {CaseGuid}",
                            onboardingCase.CaseNumber,
                            caseGuid);
                        return assessment;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup case by GUID {CaseGuid} for risk assessment search", caseGuid);
            }
        }
        
        // If caseId is a case number, try to find the case GUID and search by that
        if (!Guid.TryParse(caseId, out _) && _caseRepository != null)
        {
            try
            {
                var onboardingCase = await _caseRepository.GetByCaseNumberAsync(caseId, cancellationToken);
                if (onboardingCase != null)
                {
                    // Try to find assessment by case GUID
                    var caseGuidStr = onboardingCase.Id.ToString();
                    assessment = await _context.RiskAssessments
                        .Include(a => a.Factors)
                        .AsTracking()
                        .FirstOrDefaultAsync(a => a.CaseId == caseGuidStr, cancellationToken);
                    
                    if (assessment != null)
                    {
                        _logger.LogDebug(
                            "Found risk assessment by case GUID {CaseGuid} for case number {CaseNumber}",
                            caseGuidStr,
                            caseId);
                        return assessment;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup case by case number {CaseNumber} for risk assessment search", caseId);
            }
        }
        
        return null;
    }

    public async Task<List<RiskAssessment>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default)
    {
        return await _context.RiskAssessments
            .Include(a => a.Factors)
            .Where(a => a.PartnerId == partnerId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<RiskAssessment>> GetByRiskLevelAsync(RiskLevel riskLevel, CancellationToken cancellationToken = default)
    {
        return await _context.RiskAssessments
            .Include(a => a.Factors)
            .Where(a => a.OverallRiskLevel == riskLevel)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<RiskAssessment>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.RiskAssessments
            .Include(a => a.Factors)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<RiskAssessment>> SearchAsync(string? partnerId = null, RiskLevel? riskLevel = null, string? status = null, string? caseId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.RiskAssessments
            .Include(a => a.Factors)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(partnerId))
            query = query.Where(a => a.PartnerId == partnerId);

        if (riskLevel.HasValue)
            query = query.Where(a => a.OverallRiskLevel == riskLevel.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RiskAssessmentStatus>(status, true, out var statusEnum))
            query = query.Where(a => a.Status == statusEnum);

        if (!string.IsNullOrWhiteSpace(caseId))
            query = query.Where(a => a.CaseId.Contains(caseId));

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(RiskAssessment assessment, CancellationToken cancellationToken = default)
    {
        await _context.RiskAssessments.AddAsync(assessment, cancellationToken);
    }

    public async Task UpdateAsync(RiskAssessment assessment, CancellationToken cancellationToken = default)
    {
        _context.RiskAssessments.Update(assessment);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

