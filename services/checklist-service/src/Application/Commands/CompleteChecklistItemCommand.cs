using MediatR;

namespace ChecklistService.Application.Commands;

public record CompleteChecklistItemCommand(
    Guid ChecklistId,
    Guid ItemId,
    string CompletedBy,
    string? Notes = null) : IRequest<CompleteChecklistItemResult>;

public record CompleteChecklistItemResult(
    Guid ChecklistId,
    Guid ItemId,
    bool ChecklistCompleted,
    double CompletionPercentage);
