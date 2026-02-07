using MediatR;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Application.Checklist.Queries;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Commands;

public class AddChecklistItemCommandHandler : IRequestHandler<AddChecklistItemCommand, ChecklistDto>
{
    private readonly IChecklistRepository _repository;

    public AddChecklistItemCommandHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<ChecklistDto> Handle(AddChecklistItemCommand request, CancellationToken cancellationToken)
    {
        var checklistId = new ChecklistId(request.ChecklistId);
        var checklist = await _repository.GetByIdAsync(checklistId, cancellationToken);
        
        if (checklist == null)
        {
            throw new KeyNotFoundException($"Checklist with ID {request.ChecklistId} not found");
        }

        // Get the next order number
        var nextOrder = checklist.Items.Any() ? checklist.Items.Max(i => i.Order) + 1 : 1;

        // Add the new item
        checklist.AddItem(
            request.Name,
            request.Description,
            request.Category,
            request.IsRequired,
            nextOrder,
            request.Notes
        );

        // Save changes
        await _repository.UpdateAsync(checklist, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        // Return updated checklist
        return MapToDto(checklist);
    }

    private static ChecklistDto MapToDto(Domain.Checklist.Aggregates.Checklist checklist)
    {
        return new ChecklistDto
        {
            Id = checklist.Id.Value,
            CaseId = checklist.CaseId,
            Type = checklist.Type.ToString(),
            Status = checklist.Status.ToString(),
            PartnerId = checklist.PartnerId,
            CreatedAt = checklist.CreatedAt,
            CompletedAt = checklist.CompletedAt,
            CompletionPercentage = checklist.CompletionPercentage,
            RequiredCompletionPercentage = checklist.RequiredCompletionPercentage,
            Items = checklist.Items.Select(item => new ChecklistItemDto
            {
                Id = item.Id.Value,
                Name = item.Name,
                Description = item.Description,
                Category = item.Category.ToString(),
                IsRequired = item.IsRequired,
                Order = item.Order,
                Status = item.Status.ToString(),
                CreatedAt = item.CreatedAt,
                CompletedAt = item.CompletedAt,
                CompletedBy = item.CompletedBy,
                Notes = item.Notes,
                SkipReason = item.SkipReason
            }).ToList()
        };
    }
}
