using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class CreateEntityTypeCommandHandler : IRequestHandler<CreateEntityTypeCommand, CreateEntityTypeResult>
{
    private readonly IEntityTypeRepository _repository;

    public CreateEntityTypeCommandHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<CreateEntityTypeResult> Handle(CreateEntityTypeCommand request, CancellationToken cancellationToken)
    {
        // Check if code already exists
        var existing = await _repository.GetByCodeAsync(request.Code, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException($"Entity type with code '{request.Code}' already exists");

        var entityType = new EntityType(
            request.Code,
            request.DisplayName,
            request.Description,
            request.Icon
        );

        await _repository.AddAsync(entityType, cancellationToken);

        return new CreateEntityTypeResult(
            entityType.Id,
            entityType.Code,
            entityType.DisplayName
        );
    }
}


