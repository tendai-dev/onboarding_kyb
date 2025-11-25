using MediatR;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

public class CreateEntityTypeCommandHandler : IRequestHandler<CreateEntityTypeCommand, CreateEntityTypeResult>
{
    private readonly IEntityTypeRepository _repository;

    public CreateEntityTypeCommandHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<CreateEntityTypeResult> Handle(CreateEntityTypeCommand request, CancellationToken cancellationToken)
    {
        var entityType = new EntityType(
            request.Code,
            request.DisplayName,
            request.Description,
            request.Icon);

        await _repository.AddAsync(entityType, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CreateEntityTypeResult(
            entityType.Id,
            entityType.Code,
            entityType.DisplayName);
    }
}

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
        
        if (request.IsActive.HasValue)
        {
            if (request.IsActive.Value)
                entityType.Activate();
            else
                entityType.Deactivate();
        }

        await _repository.UpdateAsync(entityType, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new UpdateEntityTypeResult(
            entityType.Id,
            entityType.Code,
            entityType.DisplayName);
    }
}

public class DeleteEntityTypeCommandHandler : IRequestHandler<DeleteEntityTypeCommand, bool>
{
    private readonly IEntityTypeRepository _repository;

    public DeleteEntityTypeCommandHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteEntityTypeCommand request, CancellationToken cancellationToken)
    {
        var entityType = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entityType == null)
            return false;

        await _repository.DeleteAsync(entityType, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return true;
    }
}

public class AddRequirementToEntityTypeCommandHandler : IRequestHandler<AddRequirementToEntityTypeCommand, bool>
{
    private readonly IEntityTypeRepository _repository;

    public AddRequirementToEntityTypeCommandHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(AddRequirementToEntityTypeCommand request, CancellationToken cancellationToken)
    {
        var entityType = await _repository.GetByIdAsync(request.EntityTypeId, cancellationToken);
        if (entityType == null)
            return false;

        entityType.AddRequirement(request.RequirementId, request.IsRequired, request.DisplayOrder);
        await _repository.UpdateAsync(entityType, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return true;
    }
}

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
        await _repository.SaveChangesAsync(cancellationToken);

        return true;
    }
}

