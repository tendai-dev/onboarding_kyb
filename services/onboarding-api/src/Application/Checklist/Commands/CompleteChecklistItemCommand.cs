using MediatR;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Commands;

public record CompleteChecklistItemCommand(
    Guid ChecklistId,
    Guid ItemId,
    string CompletedBy,
    string? Notes = null) : IRequest<CompleteChecklistItemResult>;

public record CompleteChecklistItemResult(
    Guid ChecklistId,
    Guid ItemId,
    bool IsCompleted,
    double CompletionPercentage);

