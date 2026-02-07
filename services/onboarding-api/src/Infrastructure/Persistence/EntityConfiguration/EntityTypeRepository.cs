using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

namespace OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

public class EntityTypeRepository : IEntityTypeRepository
{
    private readonly EntityConfigurationDbContext _context;
    private readonly ILogger<EntityTypeRepository> _logger;

    public EntityTypeRepository(EntityConfigurationDbContext context, ILogger<EntityTypeRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<EntityType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // Detach any existing tracked entity to ensure we get a fresh copy from the database
        // This is important to avoid stale UpdatedAt values that could cause concurrency conflicts
        var trackedEntity = _context.ChangeTracker.Entries<EntityType>()
            .FirstOrDefault(e => e.Entity.Id == id);
        if (trackedEntity != null)
        {
            _context.Entry(trackedEntity.Entity).State = EntityState.Detached;
        }

        // For OwnsMany relationships, Include should work, but let's try both approaches
        // Also include the Requirement navigation property to get full requirement details
        var entityType = await _context.EntityTypes
            .Include(e => e.Requirements)
                .ThenInclude(r => r.Requirement)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        
        if (entityType != null)
        {
            // Also explicitly load to ensure they're loaded
            try
            {
                await _context.Entry(entityType)
                    .Collection(e => e.Requirements)
                    .LoadAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[EntityTypeRepository] Failed to explicitly load requirements collection");
            }
            
            var requirementsCount = entityType.Requirements?.Count ?? 0;
            _logger.LogInformation("[EntityTypeRepository] Loaded EntityType {Code} with {Count} requirements", 
                entityType.Code, requirementsCount);
            
            if (requirementsCount > 0)
            {
                var requirementIds = entityType.Requirements.Select(r => r.RequirementId).ToList();
                _logger.LogInformation("[EntityTypeRepository] Requirement IDs: {Ids}", 
                    string.Join(", ", requirementIds));
            }
            else
            {
                _logger.LogWarning("[EntityTypeRepository] EntityType {Code} has NO requirements loaded!", entityType.Code);
            }
        }
        
        return entityType;
    }

    public async Task<EntityType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.EntityTypes
            .Include(e => e.Requirements)
                .ThenInclude(r => r.Requirement)
            .FirstOrDefaultAsync(e => e.Code == code, cancellationToken);
    }

    public async Task<Dictionary<string, EntityType>> GetByCodesAsync(IEnumerable<string> codes, CancellationToken cancellationToken = default)
    {
        var codeList = codes.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList();
        if (codeList.Count == 0)
            return new Dictionary<string, EntityType>();

        // Single query to fetch all entity types by codes - prevents N+1
        var entityTypes = await _context.EntityTypes
            .Where(e => codeList.Contains(e.Code))
            .ToListAsync(cancellationToken);

        return entityTypes.ToDictionary(e => e.Code, e => e);
    }

    public async Task<List<EntityType>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.EntityTypes.AsQueryable();
        
        if (!includeInactive)
            query = query.Where(e => e.IsActive);

        return await query
            .OrderBy(e => e.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<EntityType>> GetAllWithRequirementsAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.EntityTypes
            .Include(e => e.Requirements)
                .ThenInclude(r => r.Requirement)
            .AsQueryable();
        
        if (!includeInactive)
            query = query.Where(e => e.IsActive);

        return await query
            .OrderBy(e => e.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        await _context.EntityTypes.AddAsync(entityType, cancellationToken);
    }

    public async Task UpdateAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        // Use Update() - EF Core will handle owned collections
        // If entity is already tracked, Update() will replace it
        _context.EntityTypes.Update(entityType);
    }

    public async Task DeleteAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        _context.EntityTypes.Remove(entityType);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entityType = await GetByIdAsync(id, cancellationToken);
        if (entityType != null)
        {
            await DeleteAsync(entityType, cancellationToken);
        }
    }


    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> AddRequirementDirectlyAsync(Guid entityTypeId, Guid requirementId, bool isRequired, int displayOrder, CancellationToken cancellationToken = default)
    {
        // Use raw SQL to insert the requirement directly, bypassing EF Core change tracking
        // This completely avoids concurrency issues with UpdatedAt on the parent entity
        try
        {
            // First verify entity type exists (quick check without loading requirements)
            var entityTypeExists = await _context.EntityTypes
                .AnyAsync(e => e.Id == entityTypeId, cancellationToken);
            
            if (!entityTypeExists)
            {
                _logger.LogWarning("Entity type {EntityTypeId} not found when trying to add requirement {RequirementId}",
                    entityTypeId, requirementId);
                return false;
            }

            // Verify requirement exists (foreign key constraint)
            var requirementExists = await _context.Set<Requirement>()
                .AnyAsync(r => r.Id == requirementId, cancellationToken);
            
            if (!requirementExists)
            {
                _logger.LogWarning("Requirement {RequirementId} not found when trying to add to entity type {EntityTypeId}",
                    requirementId, entityTypeId);
                throw new InvalidOperationException($"Requirement with ID {requirementId} does not exist");
            }

            // Check if already exists using AsNoTracking to avoid change tracking issues
            var entityType = await _context.EntityTypes
                .AsNoTracking()
                .Include(e => e.Requirements)
                .FirstOrDefaultAsync(e => e.Id == entityTypeId, cancellationToken);

            if (entityType?.Requirements.Any(r => r.RequirementId == requirementId) == true)
            {
                _logger.LogInformation("Requirement {RequirementId} already exists for entity type {EntityTypeId} (idempotent)",
                    requirementId, entityTypeId);
                return true;
            }

            // Insert the requirement using raw SQL to avoid touching the parent entity's UpdatedAt
            // Use FormattableString for proper parameterization
            var requirementIdParam = Guid.NewGuid();
            var now = DateTime.UtcNow;

            // Use quoted column name "Id" (capital I) as that's how it's stored in PostgreSQL
            FormattableString insertSql = $@"
                INSERT INTO entity_configuration.entity_type_requirements 
                (""Id"", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
                VALUES 
                ({requirementIdParam}, {entityTypeId}, {requirementId}, {isRequired}, {displayOrder}, {now}, {now})";

            var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(insertSql, cancellationToken);

            _logger.LogInformation("Successfully inserted requirement {RequirementId} for entity type {EntityTypeId}, rows affected: {RowsAffected}",
                requirementId, entityTypeId, rowsAffected);

            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            // Log the full error details
            _logger.LogError(ex, "Error inserting requirement {RequirementId} for entity type {EntityTypeId} directly. Error: {ErrorMessage}, InnerException: {InnerException}", 
                requirementId, entityTypeId, ex.Message, ex.InnerException?.Message ?? "None");
            
            // If it's a duplicate key error, that's fine - requirement already exists
            if (ex.Message.Contains("duplicate") || 
                ex.Message.Contains("UNIQUE") || 
                ex.Message.Contains("already exists") ||
                ex.InnerException?.Message?.Contains("duplicate") == true ||
                ex.InnerException?.Message?.Contains("UNIQUE") == true)
            {
                _logger.LogInformation("Requirement {RequirementId} already exists for entity type {EntityTypeId}, returning success (idempotent)",
                    requirementId, entityTypeId);
                return true; // Idempotent
            }
            
            throw;
        }
    }
}

