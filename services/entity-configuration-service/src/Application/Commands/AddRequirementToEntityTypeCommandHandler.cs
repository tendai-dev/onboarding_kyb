using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class AddRequirementToEntityTypeCommandHandler : IRequestHandler<AddRequirementToEntityTypeCommand, Unit>
{
    private readonly IEntityTypeRepository _entityTypeRepository;
    private readonly IRequirementRepository _requirementRepository;

    public AddRequirementToEntityTypeCommandHandler(
        IEntityTypeRepository entityTypeRepository,
        IRequirementRepository requirementRepository)
    {
        _entityTypeRepository = entityTypeRepository;
        _requirementRepository = requirementRepository;
    }

    public async Task<Unit> Handle(AddRequirementToEntityTypeCommand request, CancellationToken cancellationToken)
    {
        var entityType = await _entityTypeRepository.GetByIdAsync(request.EntityTypeId, cancellationToken)
            ?? throw new InvalidOperationException($"Entity type with ID '{request.EntityTypeId}' not found");

        var requirement = await _requirementRepository.GetByIdAsync(request.RequirementId, cancellationToken)
            ?? throw new InvalidOperationException($"Requirement with ID '{request.RequirementId}' not found");

        entityType.AddRequirement(requirement, request.IsRequired, request.DisplayOrder);
        
        await _entityTypeRepository.UpdateAsync(entityType, cancellationToken);

        return Unit.Value;
    }
}


