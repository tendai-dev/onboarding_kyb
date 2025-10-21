using ChecklistService.Domain.ValueObjects;
using MediatR;

namespace ChecklistService.Application.Queries;

public record GetChecklistQuery(Guid ChecklistId) : IRequest<ChecklistDto?>;

public record GetChecklistByCaseQuery(string CaseId) : IRequest<ChecklistDto?>;

public class ChecklistDto
{
    public Guid Id { get; set; }
    public string CaseId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PartnerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public double CompletionPercentage { get; set; }
    public double RequiredCompletionPercentage { get; set; }
    public List<ChecklistItemDto> Items { get; set; } = new();
}

public class ChecklistItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int Order { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
    public string? Notes { get; set; }
    public string? SkipReason { get; set; }
}
