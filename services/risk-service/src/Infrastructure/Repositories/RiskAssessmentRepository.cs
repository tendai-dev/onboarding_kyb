using RiskService.Application.Interfaces;
using RiskService.Domain.Aggregates;
using RiskService.Domain.ValueObjects;
using RiskService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace RiskService.Infrastructure.Repositories;

public class RiskAssessmentRepository : IRiskAssessmentRepository
{
    private readonly RiskDbContext _context;

    public RiskAssessmentRepository(RiskDbContext context)
    {
        _context = context;
    }

    public async Task<RiskAssessment?> GetByIdAsync(RiskAssessmentId id, CancellationToken cancellationToken = default)
    {
        var assessment = await _context.RiskAssessments
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (assessment != null)
        {
            await LoadFactorsAsync(assessment, cancellationToken);
        }

        return assessment;
    }

    public async Task<RiskAssessment?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        var assessment = await _context.RiskAssessments
            .FirstOrDefaultAsync(a => a.CaseId == caseId, cancellationToken);

        if (assessment != null)
        {
            await LoadFactorsAsync(assessment, cancellationToken);
        }

        return assessment;
    }

    public async Task<List<RiskAssessment>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default)
    {
        var assessments = await _context.RiskAssessments
            .Where(a => a.PartnerId == partnerId)
            .ToListAsync(cancellationToken);

        foreach (var assessment in assessments)
        {
            await LoadFactorsAsync(assessment, cancellationToken);
        }

        return assessments;
    }

    public async Task<List<RiskAssessment>> GetByRiskLevelAsync(RiskLevel riskLevel, CancellationToken cancellationToken = default)
    {
        var assessments = await _context.RiskAssessments
            .Where(a => a.OverallRiskLevel == riskLevel)
            .ToListAsync(cancellationToken);

        foreach (var assessment in assessments)
        {
            await LoadFactorsAsync(assessment, cancellationToken);
        }

        return assessments;
    }

    public async Task<List<RiskAssessment>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var assessments = await _context.RiskAssessments
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        foreach (var assessment in assessments)
        {
            await LoadFactorsAsync(assessment, cancellationToken);
        }

        return assessments;
    }

    public async Task<List<RiskAssessment>> SearchAsync(string? partnerId = null, RiskLevel? riskLevel = null, string? status = null, string? caseId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.RiskAssessments.AsQueryable();

        if (!string.IsNullOrWhiteSpace(partnerId))
        {
            query = query.Where(a => a.PartnerId == partnerId);
        }

        if (riskLevel.HasValue)
        {
            query = query.Where(a => a.OverallRiskLevel == riskLevel.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RiskAssessmentStatus>(status, out var statusEnum))
        {
            query = query.Where(a => a.Status == statusEnum);
        }

        if (!string.IsNullOrWhiteSpace(caseId))
        {
            query = query.Where(a => a.CaseId.Contains(caseId));
        }

        var assessments = await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        // Load factors for each assessment, but don't fail if it doesn't work
        foreach (var assessment in assessments)
        {
            try
            {
                await LoadFactorsAsync(assessment, cancellationToken);
            }
            catch
            {
                // If loading factors fails, continue with empty factors list
                // This prevents the entire search from failing
            }
        }

        return assessments;
    }

    public async Task AddAsync(RiskAssessment assessment, CancellationToken cancellationToken = default)
    {
        _context.RiskAssessments.Add(assessment);
        
        // Add factors separately
        foreach (var factor in assessment.Factors)
        {
            _context.RiskFactors.Add(factor);
            _context.Entry(factor).Property("RiskAssessmentId").CurrentValue = assessment.Id.Value;
        }
    }

    public async Task UpdateAsync(RiskAssessment assessment, CancellationToken cancellationToken = default)
    {
        _context.RiskAssessments.Update(assessment);
        
        // Update factors
        foreach (var factor in assessment.Factors)
        {
            var existingFactor = await _context.RiskFactors
                .FirstOrDefaultAsync(f => f.Id == factor.Id, cancellationToken);
            
            if (existingFactor == null)
            {
                // New factor
                _context.RiskFactors.Add(factor);
                _context.Entry(factor).Property("RiskAssessmentId").CurrentValue = assessment.Id.Value;
            }
            else
            {
                // Update existing factor
                _context.RiskFactors.Update(factor);
            }
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task LoadFactorsAsync(RiskAssessment assessment, CancellationToken cancellationToken)
    {
        try
        {
            // Use the actual risk assessment ID value (Guid) for comparison
            var assessmentIdValue = assessment.Id.Value;
            
            // Query factors using raw SQL to avoid EF Core relationship and shadow property issues
            var sql = "SELECT * FROM risk_factors WHERE risk_assessment_id = @p0 ORDER BY created_at";
            var factors = await _context.RiskFactors
                .FromSqlRaw(sql, assessmentIdValue)
                .IgnoreQueryFilters()
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            // Use reflection to set the private _factors field
            var factorsField = typeof(RiskAssessment).GetField("_factors", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            if (factorsField != null)
            {
                factorsField.SetValue(assessment, factors);
            }
        }
        catch
        {
            // If loading factors fails, just leave the factors list empty
            // This prevents the entire query from failing
            var factorsField = typeof(RiskAssessment).GetField("_factors", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            if (factorsField != null)
            {
                factorsField.SetValue(assessment, new List<Domain.Aggregates.RiskFactor>());
            }
        }
    }
}
