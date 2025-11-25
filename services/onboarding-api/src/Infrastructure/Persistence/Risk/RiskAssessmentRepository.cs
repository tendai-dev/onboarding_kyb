using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Risk;

namespace OnboardingApi.Infrastructure.Persistence.Risk;

public class RiskAssessmentRepository : IRiskAssessmentRepository
{
    private readonly RiskDbContext _context;
    private readonly ILogger<RiskAssessmentRepository> _logger;

    public RiskAssessmentRepository(RiskDbContext context, ILogger<RiskAssessmentRepository> logger)
    {
        _context = context;
        _logger = logger;
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
        return await _context.RiskAssessments
            .Include(a => a.Factors)
            .AsTracking()
            .FirstOrDefaultAsync(a => a.CaseId == caseId, cancellationToken);
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

