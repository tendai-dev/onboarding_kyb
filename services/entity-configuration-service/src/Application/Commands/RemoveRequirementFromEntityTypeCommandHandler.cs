using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class RemoveRequirementFromEntityTypeCommandHandler : IRequestHandler<RemoveRequirementFromEntityTypeCommand, bool>
{
    private readonly IEntityTypeRepository _repository;

    public RemoveRequirementFromEntityTypeCommandHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(RemoveRequirementFromEntityTypeCommand request, CancellationToken cancellationToken)
    {
        var entityType = await _repository.GetByIdAsync(request.EntityTypeId, cancellationToken);
        if (entityType == null)
            return false;

        entityType.RemoveRequirement(request.RequirementId);
        await _repository.UpdateAsync(entityType, cancellationToken);
        
        return true;
    }
}
