using ChecklistService.Domain.ValueObjects;
using MediatR;

namespace ChecklistService.Application.Commands;

public record CreateChecklistCommand(
    string CaseId,
    ChecklistType Type,
    string PartnerId) : IRequest<CreateChecklistResult>;

public record CreateChecklistResult(
    Guid ChecklistId,
    string CaseId,
    string Type,
    int ItemCount);
