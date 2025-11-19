using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;
using MediatR;
using Microsoft.Extensions.Logging;

namespace RiskService.Application.Commands;

public class SetManualRiskLevelCommandHandler : IRequestHandler<SetManualRiskLevelCommand, SetManualRiskLevelResult>
{
    private readonly IRiskAssessmentRepository _repository;
    private readonly ILogger<SetManualRiskLevelCommandHandler> _logger;

    public SetManualRiskLevelCommandHandler(
        IRiskAssessmentRepository repository,
        ILogger<SetManualRiskLevelCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<SetManualRiskLevelResult> Handle(SetManualRiskLevelCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Setting manual risk level for assessment {AssessmentId} to {RiskLevel} by {AssessedBy}",
            request.AssessmentId, request.RiskLevel, request.AssessedBy);

        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
        {
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");
        }

        // Set the manual risk level
        assessment.SetManualRiskLevel(request.RiskLevel, request.AssessedBy, request.Justification);

        // Save the changes
        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully set manual risk level for assessment {AssessmentId} to {RiskLevel}",
            request.AssessmentId, request.RiskLevel);

        return new SetManualRiskLevelResult
        {
            AssessmentId = request.AssessmentId,
            RiskLevel = request.RiskLevel.ToString(),
            AssessedBy = request.AssessedBy,
            Justification = request.Justification,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
