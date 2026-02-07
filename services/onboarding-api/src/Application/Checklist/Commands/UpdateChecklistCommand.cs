using MediatR;
using OnboardingApi.Application.Checklist.Queries;

namespace OnboardingApi.Application.Checklist.Commands;

public record UpdateChecklistCommand(
    Guid ChecklistId,
    string? Type,
    string? Status,
    List<UpdateChecklistItemDto>? Items) : IRequest<ChecklistDto>;

public class UpdateChecklistItemDto
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int Order { get; set; }
    public string? Notes { get; set; }
}
