using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;
using MediatR;

namespace RiskService.Application.Queries;

public class GetRiskAssessmentQueryHandler : IRequestHandler<GetRiskAssessmentQuery, RiskAssessmentDto?>
{
    private readonly IRiskAssessmentRepository _repository;

    public GetRiskAssessmentQueryHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<RiskAssessmentDto?> Handle(GetRiskAssessmentQuery request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            return null;

        return MapToDto(assessment);
    }

    private static RiskAssessmentDto MapToDto(Domain.Aggregates.RiskAssessment assessment)
    {
        return new RiskAssessmentDto
        {
            Id = assessment.Id.Value,
            CaseId = assessment.CaseId,
            PartnerId = assessment.PartnerId,
            OverallRiskLevel = assessment.OverallRiskLevel.ToString(),
            RiskScore = assessment.RiskScore,
            Status = assessment.Status.ToString(),
            CreatedAt = assessment.CreatedAt,
            CompletedAt = assessment.CompletedAt,
            AssessedBy = assessment.AssessedBy,
            Notes = assessment.Notes,
            Factors = assessment.Factors.Select(f => new RiskFactorDto
            {
                Id = f.Id.Value,
                Type = f.Type.ToString(),
                Level = f.Level.ToString(),
                Score = f.Score,
                Description = f.Description,
                Source = f.Source,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            }).ToList()
        };
    }
}

public class GetRiskAssessmentByCaseQueryHandler : IRequestHandler<GetRiskAssessmentByCaseQuery, RiskAssessmentDto?>
{
    private readonly IRiskAssessmentRepository _repository;

    public GetRiskAssessmentByCaseQueryHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<RiskAssessmentDto?> Handle(GetRiskAssessmentByCaseQuery request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByCaseIdAsync(request.CaseId, cancellationToken);
        if (assessment == null)
            return null;

        return new RiskAssessmentDto
        {
            Id = assessment.Id.Value,
            CaseId = assessment.CaseId,
            PartnerId = assessment.PartnerId,
            OverallRiskLevel = assessment.OverallRiskLevel.ToString(),
            RiskScore = assessment.RiskScore,
            Status = assessment.Status.ToString(),
            CreatedAt = assessment.CreatedAt,
            CompletedAt = assessment.CompletedAt,
            AssessedBy = assessment.AssessedBy,
            Notes = assessment.Notes,
            Factors = assessment.Factors.Select(f => new RiskFactorDto
            {
                Id = f.Id.Value,
                Type = f.Type.ToString(),
                Level = f.Level.ToString(),
                Score = f.Score,
                Description = f.Description,
                Source = f.Source,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            }).ToList()
        };
    }
}
