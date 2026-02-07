using MediatR;
using OnboardingApi.Application.Checklist.Queries;

namespace OnboardingApi.Application.Checklist.Commands;

public record AddChecklistItemCommand(
    Guid ChecklistId,
    string Name,
    string Description,
    string Category,
    bool IsRequired,
    string? Notes) : IRequest<ChecklistDto>;
