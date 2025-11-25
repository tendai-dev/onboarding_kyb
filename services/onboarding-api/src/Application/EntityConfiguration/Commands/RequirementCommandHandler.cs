using MediatR;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

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
        await _repository.SaveChangesAsync(cancellationToken);

        return new CreateRequirementResult(
            requirement.Id,
            requirement.Code,
            requirement.DisplayName);
    }
}

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

        // Get the current type and fieldType (they cannot be changed)
        requirement.UpdateDetails(
            request.DisplayName,
            request.Description,
            requirement.Type, // Keep existing type
            requirement.FieldType, // Keep existing fieldType
            request.ValidationRules,
            request.HelpText
        );

        if (request.IsActive.HasValue)
        {
            if (request.IsActive.Value)
                requirement.Activate();
            else
                requirement.Deactivate();
        }

        await _repository.UpdateAsync(requirement, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new UpdateRequirementResult(
            requirement.Id,
            requirement.Code,
            requirement.DisplayName);
    }
}

public class DeleteRequirementCommandHandler : IRequestHandler<DeleteRequirementCommand, bool>
{
    private readonly IRequirementRepository _repository;

    public DeleteRequirementCommandHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteRequirementCommand request, CancellationToken cancellationToken)
    {
        var requirement = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (requirement == null)
            return false;

        await _repository.DeleteAsync(requirement, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return true;
    }
}

