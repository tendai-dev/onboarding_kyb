using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;
using MediatR;

namespace RiskService.Application.Queries;

public record SearchRiskAssessmentsQuery(
    string? PartnerId = null,
    string? RiskLevel = null,
    string? Status = null,
    string? CaseId = null) : IRequest<List<RiskAssessmentDto>>;

public class SearchRiskAssessmentsQueryHandler : IRequestHandler<SearchRiskAssessmentsQuery, List<RiskAssessmentDto>>
{
    private readonly IRiskAssessmentRepository _repository;

    public SearchRiskAssessmentsQueryHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<RiskAssessmentDto>> Handle(SearchRiskAssessmentsQuery request, CancellationToken cancellationToken)
    {
        RiskLevel? riskLevel = null;
        if (!string.IsNullOrWhiteSpace(request.RiskLevel) && 
            Enum.TryParse<RiskLevel>(request.RiskLevel, ignoreCase: true, out var parsedLevel))
        {
            riskLevel = parsedLevel;
        }

        var assessments = await _repository.SearchAsync(
            request.PartnerId,
            riskLevel,
            request.Status,
            request.CaseId,
            cancellationToken);

        return assessments.Select(MapToDto).ToList();
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

