using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

public class CreateEntityTypeCommandHandler : IRequestHandler<CreateEntityTypeCommand, CreateEntityTypeResult>
{
    private readonly IEntityTypeRepository _repository;
    private readonly ILogger<CreateEntityTypeCommandHandler> _logger;

    public CreateEntityTypeCommandHandler(
        IEntityTypeRepository repository,
        ILogger<CreateEntityTypeCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<CreateEntityTypeResult> Handle(CreateEntityTypeCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Check if code already exists
            var existing = await _repository.GetByCodeAsync(request.Code, cancellationToken);
            if (existing != null)
                throw new InvalidOperationException($"Entity type with code '{request.Code}' already exists");

        var entityType = new EntityType(
            request.Code,
            request.DisplayName,
            request.Description,
            request.Icon);

            _logger.LogInformation("Creating entity type with code: {Code}, DisplayName: {DisplayName}", 
                request.Code, request.DisplayName);

        await _repository.AddAsync(entityType, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Successfully created entity type with ID: {Id}, Code: {Code}", 
                entityType.Id, entityType.Code);

        return new CreateEntityTypeResult(
            entityType.Id,
            entityType.Code,
            entityType.DisplayName);
        }
        catch (Exception ex) when (!(ex is InvalidOperationException))
        {
            _logger.LogError(ex, "Unexpected error creating entity type with code: {Code}", request.Code);
            throw new InvalidOperationException($"An unexpected error occurred while creating the entity type: {ex.Message}");
        }
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
    private readonly ILogger<DeleteEntityTypeCommandHandler> _logger;

    public DeleteEntityTypeCommandHandler(
        IEntityTypeRepository repository,
        ILogger<DeleteEntityTypeCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<bool> Handle(DeleteEntityTypeCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Load entity with requirements to ensure owned collection is loaded
        var entityType = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entityType == null)
            {
                _logger.LogWarning("Entity type with ID {Id} not found for deletion", request.Id);
            return false;
            }

            _logger.LogInformation("Deleting entity type {Code} (ID: {Id}) with {Count} requirements", 
                entityType.Code, entityType.Id, entityType.Requirements?.Count ?? 0);

        await _repository.DeleteAsync(entityType, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Successfully deleted entity type {Code} (ID: {Id})", 
                entityType.Code, entityType.Id);

        return true;
        }
        catch (Exception ex) when (ex.GetType().Name == "DbUpdateException" || 
                                   (ex.InnerException != null && ex.InnerException.GetType().Name == "DbUpdateException"))
        {
            _logger.LogError(ex, "Database error deleting entity type {Id}", request.Id);
            
            // Check for foreign key constraint violations
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            var innerInnerMessage = ex.InnerException?.InnerException?.Message;
            if (!string.IsNullOrEmpty(innerInnerMessage))
            {
                innerMessage = innerInnerMessage;
            }
            
            if (innerMessage.Contains("foreign key", StringComparison.OrdinalIgnoreCase) ||
                innerMessage.Contains("23503", StringComparison.OrdinalIgnoreCase) || // PostgreSQL foreign key violation
                innerMessage.Contains("constraint", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Cannot delete this entity type because it is referenced by other records. " +
                    "Please remove all references before deleting.");
            }
            
            throw new InvalidOperationException($"Failed to delete entity type: {innerMessage}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting entity type {Id}", request.Id);
            throw;
        }
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
        // Use raw SQL to insert the requirement directly, bypassing EF Core change tracking
        // This completely avoids concurrency issues with UpdatedAt on the parent entity
        // The repository method handles all validation and duplicate checking
        try
        {
            var success = await _repository.AddRequirementDirectlyAsync(
                request.EntityTypeId,
                request.RequirementId,
                request.IsRequired,
                request.DisplayOrder,
                cancellationToken);

            return success;
        }
        catch (InvalidOperationException)
        {
            // Re-throw InvalidOperationException (e.g., requirement doesn't exist)
            // This will be caught by the controller and returned as BadRequest
            throw;
        }
        catch (Exception ex)
        {
            // If it's a duplicate key error, that's fine - requirement already exists
            if (ex.Message.Contains("duplicate") || 
                ex.Message.Contains("UNIQUE") || 
                ex.Message.Contains("already exists") ||
                ex.InnerException?.Message?.Contains("duplicate") == true ||
                ex.InnerException?.Message?.Contains("UNIQUE") == true)
            {
                return true; // Idempotent - requirement already exists
            }
            
            // For other errors, rethrow
            throw;
        }
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
        // Don't call UpdateAsync - the entity is already tracked, just save changes
        // This avoids optimistic concurrency issues with owned collections
        await _repository.SaveChangesAsync(cancellationToken);

        return true;
    }
}

