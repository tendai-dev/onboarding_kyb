using MediatR;

namespace ChecklistService.Application.Commands;

public record ResetChecklistItemCommand(
    Guid ChecklistId,
    Guid ItemId,
    string ResetBy,
    string Reason
) : IRequest<ResetChecklistItemResult>;

public record ResetChecklistItemResult(
    Guid ChecklistId,
    Guid ItemId,
    bool ChecklistCompleted,
    double CompletionPercentage
);
