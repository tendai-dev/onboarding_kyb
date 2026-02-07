using MediatR;
using OnboardingApi.Application.Checklist.Queries;

namespace OnboardingApi.Application.Checklist.Commands;

public record RemoveChecklistItemCommand(
    Guid ChecklistId,
    Guid ItemId) : IRequest<ChecklistDto>;
