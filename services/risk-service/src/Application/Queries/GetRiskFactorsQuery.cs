using MediatR;
using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;

namespace RiskService.Application.Queries;

public record GetRiskFactorsQuery(Guid AssessmentId) : IRequest<IEnumerable<RiskFactorDto>>;

public class GetRiskFactorsQueryHandler : IRequestHandler<GetRiskFactorsQuery, IEnumerable<RiskFactorDto>>
{
    private readonly IRiskAssessmentRepository _repository;

    public GetRiskFactorsQueryHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<RiskFactorDto>> Handle(GetRiskFactorsQuery request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null) return Enumerable.Empty<RiskFactorDto>();

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
        });
    }
}
