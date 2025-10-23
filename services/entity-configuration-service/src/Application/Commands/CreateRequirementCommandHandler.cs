using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class CreateRequirementCommandHandler : IRequestHandler<CreateRequirementCommand, CreateRequirementResult>
{
    private readonly IRequirementRepository _repository;

    public CreateRequirementCommandHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<CreateRequirementResult> Handle(CreateRequirementCommand request, CancellationToken cancellationToken)
    {
        // Check if code already exists
        var existing = await _repository.GetByCodeAsync(request.Code, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException($"Requirement with code '{request.Code}' already exists");

        var requirement = new Requirement(
            request.Code,
            request.DisplayName,
            request.Description,
            request.Type,
            request.FieldType,
            request.ValidationRules,
            request.HelpText
        );

        await _repository.AddAsync(requirement, cancellationToken);

        return new CreateRequirementResult(
            requirement.Id,
            requirement.Code,
            requirement.DisplayName
        );
    }
}


