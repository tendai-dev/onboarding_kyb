using MediatR;

namespace OnboardingApi.Application.Checklist.Commands;

public record DeleteChecklistCommand(Guid ChecklistId) : IRequest<bool>;
