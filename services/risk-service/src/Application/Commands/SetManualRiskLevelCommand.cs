using RiskService.Domain.ValueObjects;
using MediatR;

namespace RiskService.Application.Commands;

public record SetManualRiskLevelCommand(
    Guid AssessmentId,
    RiskLevel RiskLevel,
    string AssessedBy,
    string Justification) : IRequest<SetManualRiskLevelResult>;

public class SetManualRiskLevelResult
{
    public Guid AssessmentId { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public string AssessedBy { get; set; } = string.Empty;
    public string Justification { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}
