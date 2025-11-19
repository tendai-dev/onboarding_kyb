using MediatR;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Commands;

public class CreateChecklistCommandHandler : IRequestHandler<CreateChecklistCommand, CreateChecklistResult>
{
    private readonly IChecklistRepository _repository;
    private readonly IChecklistTemplateService _templateService;

    public CreateChecklistCommandHandler(
        IChecklistRepository repository,
        IChecklistTemplateService templateService)
    {
        _repository = repository;
        _templateService = templateService;
    }

    public async Task<CreateChecklistResult> Handle(CreateChecklistCommand request, CancellationToken cancellationToken)
    {
        // Get templates for the checklist type
        var templates = await _templateService.GetTemplatesAsync(request.Type, cancellationToken);

        // Create checklist
        var checklist = Checklist.Create(
            request.CaseId,
            request.Type,
            request.PartnerId,
            templates);

        // Save to repository
        await _repository.AddAsync(checklist, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CreateChecklistResult(
            checklist.Id.Value,
            checklist.CaseId,
            checklist.Type.ToString(),
            checklist.Items.Count);
    }
}

