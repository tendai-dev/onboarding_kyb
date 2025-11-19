using MediatR;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Commands;

public record CreateChecklistCommand(
    string CaseId,
    ChecklistType Type,
    string PartnerId) : IRequest<CreateChecklistResult>;

public record CreateChecklistResult(
    Guid ChecklistId,
    string CaseId,
    string Type,
    int ItemCount);

