using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class UpdateRequirementCommandHandler : IRequestHandler<UpdateRequirementCommand, UpdateRequirementResult>
{
    private readonly IRequirementRepository _repository;

    public UpdateRequirementCommandHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateRequirementResult> Handle(UpdateRequirementCommand request, CancellationToken cancellationToken)
    {
        var requirement = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (requirement == null)
            throw new InvalidOperationException($"Requirement with ID '{request.Id}' not found");

        requirement.UpdateDetails(
            request.DisplayName,
            request.Description,
            request.ValidationRules,
            request.HelpText
        );
        
        if (request.IsActive && !requirement.IsActive)
            requirement.Activate();
        else if (!request.IsActive && requirement.IsActive)
            requirement.Deactivate();

        await _repository.UpdateAsync(requirement, cancellationToken);

        return new UpdateRequirementResult(
            requirement.Id,
            requirement.Code,
            requirement.DisplayName,
            requirement.Description,
            requirement.Type.ToString(),
            requirement.FieldType.ToString(),
            requirement.ValidationRules,
            requirement.HelpText,
            requirement.IsActive
        );
    }
}
