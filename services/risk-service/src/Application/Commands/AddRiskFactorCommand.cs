using RiskService.Domain.ValueObjects;
using MediatR;

namespace RiskService.Application.Commands;

public record AddRiskFactorCommand(
    Guid AssessmentId,
    RiskFactorType Type,
    RiskLevel Level,
    decimal Score,
    string Description,
    string? Source = null) : IRequest<AddRiskFactorResult>;

public record AddRiskFactorResult(
    Guid AssessmentId,
    Guid FactorId,
    decimal NewOverallScore,
    string NewRiskLevel);
