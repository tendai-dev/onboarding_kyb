using MediatR;

namespace ChecklistService.Application.Commands;

public record SkipChecklistItemCommand(
    Guid ChecklistId,
    Guid ItemId,
    string SkippedBy,
    string Reason
) : IRequest<SkipChecklistItemResult>;

public record SkipChecklistItemResult(
    Guid ChecklistId,
    Guid ItemId,
    bool ChecklistCompleted,
    double CompletionPercentage
);
