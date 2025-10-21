using RiskService.Domain.ValueObjects;
using MediatR;

namespace RiskService.Application.Queries;

public record GetRiskAssessmentQuery(Guid AssessmentId) : IRequest<RiskAssessmentDto?>;

public record GetRiskAssessmentByCaseQuery(string CaseId) : IRequest<RiskAssessmentDto?>;

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
