using MediatR;
using OnboardingApi.Application.EntityConfiguration.Interfaces;

namespace OnboardingApi.Application.EntityConfiguration.Queries;

public class GetCountryProfileByCodeQueryHandler : IRequestHandler<GetCountryProfileByCodeQuery, CountryProfileDto?>
{
    private readonly ICountryConfigurationRepository _repository;

    public GetCountryProfileByCodeQueryHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<CountryProfileDto?> Handle(GetCountryProfileByCodeQuery request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByCountryCodeAsync(request.CountryCode, cancellationToken);
        return profile == null ? null : CountryProfileMapper.MapToDto(profile);
    }
}

public class GetCountryProfileByIdQueryHandler : IRequestHandler<GetCountryProfileByIdQuery, CountryProfileDto?>
{
    private readonly ICountryConfigurationRepository _repository;

    public GetCountryProfileByIdQueryHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<CountryProfileDto?> Handle(GetCountryProfileByIdQuery request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.Id, cancellationToken);
        return profile == null ? null : CountryProfileMapper.MapToDto(profile);
    }
}

public class GetAllCountryProfilesQueryHandler : IRequestHandler<GetAllCountryProfilesQuery, List<CountryProfileDto>>
{
    private readonly ICountryConfigurationRepository _repository;

    public GetAllCountryProfilesQueryHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CountryProfileDto>> Handle(GetAllCountryProfilesQuery request, CancellationToken cancellationToken)
    {
        var profiles = await _repository.GetAllAsync(request.IncludeInactive, cancellationToken);
        return profiles.Select(CountryProfileMapper.MapToDto).ToList();
    }
}

// Helper method to map domain entity to DTO
internal static class CountryProfileMapper
{
    public static CountryProfileDto MapToDto(OnboardingApi.Domain.EntityConfiguration.Aggregates.CountryProfile profile)
    {
        return new CountryProfileDto
        {
            Id = profile.Id,
            CountryCode = profile.CountryCode,
            CountryName = profile.CountryName,
            Description = profile.Description,
            IsActive = profile.IsActive,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
            CreatedBy = profile.CreatedBy,
            UpdatedBy = profile.UpdatedBy,
            EntityTypeOverrides = profile.EntityTypeOverrides.Select(o => new CountryEntityTypeOverrideDto
            {
                Id = o.Id,
                EntityTypeId = o.EntityTypeId,
                IsEnabled = o.IsEnabled,
                CustomDisplayName = o.CustomDisplayName,
                CustomDescription = o.CustomDescription,
                DisplayOrder = o.DisplayOrder
            }).ToList(),
            TerminologyOverrides = profile.TerminologyOverrides.Select(o => new CountryTerminologyOverrideDto
            {
                Id = o.Id,
                TargetType = o.TargetType,
                TargetCode = o.TargetCode,
                OverrideDisplayName = o.OverrideDisplayName,
                OverrideDescription = o.OverrideDescription,
                OverrideHelpText = o.OverrideHelpText,
                OverridePlaceholder = o.OverridePlaceholder
            }).ToList(),
            FormBundles = profile.FormBundles.Select(b => new CountryFormBundleDto
            {
                Id = b.Id,
                EntityTypeId = b.EntityTypeId,
                BundleName = b.BundleName,
                Description = b.Description,
                IsActive = b.IsActive,
                FieldConfigurationJson = b.FieldConfigurationJson
            }).ToList(),
            FieldVisibilityRules = profile.FieldVisibilityRules.Select(r => new CountryFieldVisibilityRuleDto
            {
                Id = r.Id,
                TargetFieldCode = r.TargetFieldCode,
                EntityTypeId = r.EntityTypeId,
                RuleExpression = r.RuleExpression,
                IsVisible = r.IsVisible,
                Priority = r.Priority,
                IsActive = r.IsActive
            }).ToList(),
            ComplianceToggles = profile.ComplianceToggles.Select(t => new CountryComplianceToggleDto
            {
                Id = t.Id,
                ComplianceCode = t.ComplianceCode,
                ComplianceName = t.ComplianceName,
                Description = t.Description,
                IsEnabled = t.IsEnabled,
                ConfigurationJson = t.ConfigurationJson
            }).ToList(),
            Tags = profile.Tags.Select(t => new ConfigurationTagDto
            {
                Id = t.Id,
                TagName = t.TagName,
                TagValue = t.TagValue
            }).ToList()
        };
    }
}

