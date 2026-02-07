using AppInterfaces = OnboardingApi.Application.Cases.Interfaces;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// Adapter that bridges the Application layer IEntityConfigurationService interface
/// to the Infrastructure layer EntityConfigurationService implementation.
/// </summary>
public class EntityConfigurationServiceAdapter : AppInterfaces.IEntityConfigurationService
{
    private readonly IEntityConfigurationService _innerService;

    public EntityConfigurationServiceAdapter(IEntityConfigurationService innerService)
    {
        _innerService = innerService;
    }

    public async Task<AppInterfaces.EntityTypeConfiguration?> GetEntityTypeConfigurationAsync(
        string entityTypeCode, CancellationToken cancellationToken = default)
    {
        var config = await _innerService.GetEntityTypeConfigurationAsync(entityTypeCode, cancellationToken);
        return MapToApplicationModel(config);
    }

    public async Task<AppInterfaces.EntityTypeConfiguration?> GetEntityTypeConfigurationByIdAsync(
        string formConfigId, string? version = null, CancellationToken cancellationToken = default)
    {
        var config = await _innerService.GetEntityTypeConfigurationByIdAsync(formConfigId, version, cancellationToken);
        return MapToApplicationModel(config);
    }

    private static AppInterfaces.EntityTypeConfiguration? MapToApplicationModel(EntityTypeConfiguration? config)
    {
        if (config == null) return null;

        return new AppInterfaces.EntityTypeConfiguration
        {
            Code = config.EntityTypeCode,
            Name = config.DisplayName,
            Requirements = config.Requirements?.Select(r => new AppInterfaces.EntityRequirement
            {
                FieldPath = r.Code,
                IsRequired = r.IsRequired,
                ValidationRule = r.Type
            }).ToList() ?? new List<AppInterfaces.EntityRequirement>()
        };
    }
}
