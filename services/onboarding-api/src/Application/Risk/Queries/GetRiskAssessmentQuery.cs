using MediatR;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;

namespace OnboardingApi.Application.Risk.Queries;

public record GetRiskAssessmentQuery(Guid AssessmentId) : IRequest<RiskAssessmentDto?>;

public record GetRiskAssessmentByCaseQuery(string CaseId) : IRequest<RiskAssessmentDto?>;

public record SearchRiskAssessmentsQuery(
    string? PartnerId = null,
    string? RiskLevel = null,
    string? Status = null,
    string? CaseId = null
) : IRequest<List<RiskAssessmentDto>>;

public record GetRiskFactorsQuery(Guid AssessmentId) : IRequest<List<RiskFactorDto>>;

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

        return RiskQueryHelpers.MapToDto(assessment);
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

        return RiskQueryHelpers.MapToDto(assessment);
    }
}

public class SearchRiskAssessmentsQueryHandler : IRequestHandler<SearchRiskAssessmentsQuery, List<RiskAssessmentDto>>
{
    private readonly IRiskAssessmentRepository _repository;

    public SearchRiskAssessmentsQueryHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<RiskAssessmentDto>> Handle(SearchRiskAssessmentsQuery request, CancellationToken cancellationToken)
    {
        RiskLevel? riskLevelEnum = null;
        if (!string.IsNullOrWhiteSpace(request.RiskLevel) && Enum.TryParse<RiskLevel>(request.RiskLevel, true, out var parsedLevel))
            riskLevelEnum = parsedLevel;

        RiskAssessmentStatus? statusEnum = null;
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<RiskAssessmentStatus>(request.Status, true, out var parsedStatus))
            statusEnum = parsedStatus;

        var assessments = await _repository.SearchAsync(
            request.PartnerId,
            riskLevelEnum,
            request.Status,
            request.CaseId,
            CancellationToken.None);

        return assessments.Select(RiskQueryHelpers.MapToDto).ToList();
    }
}

public class GetRiskFactorsQueryHandler : IRequestHandler<GetRiskFactorsQuery, List<RiskFactorDto>>
{
    private readonly IRiskAssessmentRepository _repository;

    public GetRiskFactorsQueryHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<RiskFactorDto>> Handle(GetRiskFactorsQuery request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            return new List<RiskFactorDto>();

        return assessment.Factors.Select(f => new RiskFactorDto
        {
            Id = f.Id.Value,
            Type = f.Type.ToString(),
            Level = f.Level.ToString(),
            Score = f.Score,
            Description = f.Description,
            Source = f.Source,
            CreatedAt = f.CreatedAt,
            UpdatedAt = f.UpdatedAt
        }).ToList();
    }
}

internal static class RiskQueryHelpers
{
    public static RiskAssessmentDto MapToDto(RiskAssessment assessment)
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

public class RiskAssessmentDto
{
    public Guid Id { get; set; }
    public string CaseId { get; set; } = string.Empty;
    public string PartnerId { get; set; } = string.Empty;
    public string OverallRiskLevel { get; set; } = string.Empty;
    public decimal RiskScore { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? AssessedBy { get; set; }
    public string? Notes { get; set; }
    public List<RiskFactorDto> Factors { get; set; } = new();
}

public class RiskFactorDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Source { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

