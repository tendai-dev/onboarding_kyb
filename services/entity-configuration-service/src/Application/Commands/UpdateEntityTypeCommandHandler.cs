using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class UpdateEntityTypeCommandHandler : IRequestHandler<UpdateEntityTypeCommand, UpdateEntityTypeResult>
{
    private readonly IEntityTypeRepository _repository;

    public UpdateEntityTypeCommandHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateEntityTypeResult> Handle(UpdateEntityTypeCommand request, CancellationToken cancellationToken)
    {
        var entityType = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entityType == null)
            throw new InvalidOperationException($"Entity type with ID '{request.Id}' not found");

        entityType.UpdateDetails(request.DisplayName, request.Description, request.Icon);
        
        if (request.IsActive && !entityType.IsActive)
            entityType.Activate();
        else if (!request.IsActive && entityType.IsActive)
            entityType.Deactivate();

        await _repository.UpdateAsync(entityType, cancellationToken);

        return new UpdateEntityTypeResult(
            entityType.Id,
            entityType.Code,
            entityType.DisplayName,
            entityType.Description,
            entityType.IsActive
        );
    }
}
