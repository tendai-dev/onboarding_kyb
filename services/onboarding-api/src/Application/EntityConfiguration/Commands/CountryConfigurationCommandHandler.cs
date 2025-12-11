using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

public class CreateCountryProfileCommandHandler : IRequestHandler<CreateCountryProfileCommand, CountryProfileResult>
{
    private readonly ICountryConfigurationRepository _repository;
    private readonly ILogger<CreateCountryProfileCommandHandler> _logger;

    public CreateCountryProfileCommandHandler(
        ICountryConfigurationRepository repository,
        ILogger<CreateCountryProfileCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<CountryProfileResult> Handle(CreateCountryProfileCommand request, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByCountryCodeAsync(request.CountryCode, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException($"Country profile with code '{request.CountryCode}' already exists");

        var profile = new CountryProfile(
            request.CountryCode,
            request.CountryName,
            request.Description,
            request.CreatedBy);

        await _repository.AddAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created country profile: {CountryCode} ({Id})", request.CountryCode, profile.Id);

        return new CountryProfileResult(
            profile.Id,
            profile.CountryCode,
            profile.CountryName,
            profile.Description,
            profile.IsActive);
    }
}

public class UpdateCountryProfileCommandHandler : IRequestHandler<UpdateCountryProfileCommand, CountryProfileResult>
{
    private readonly ICountryConfigurationRepository _repository;

    public UpdateCountryProfileCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<CountryProfileResult> Handle(UpdateCountryProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.Id}' not found");

        profile.UpdateDetails(request.CountryName, request.Description, request.UpdatedBy);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CountryProfileResult(
            profile.Id,
            profile.CountryCode,
            profile.CountryName,
            profile.Description,
            profile.IsActive);
    }
}

public class DeleteCountryProfileCommandHandler : IRequestHandler<DeleteCountryProfileCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;
    private readonly ILogger<DeleteCountryProfileCommandHandler> _logger;

    public DeleteCountryProfileCommandHandler(
        ICountryConfigurationRepository repository,
        ILogger<DeleteCountryProfileCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<bool> Handle(DeleteCountryProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (profile == null)
            return false;

        await _repository.DeleteAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted country profile: {CountryCode} ({Id})", profile.CountryCode, profile.Id);
        return true;
    }
}

public class ActivateCountryProfileCommandHandler : IRequestHandler<ActivateCountryProfileCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public ActivateCountryProfileCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(ActivateCountryProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (profile == null)
            return false;

        profile.Activate();
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class DeactivateCountryProfileCommandHandler : IRequestHandler<DeactivateCountryProfileCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public DeactivateCountryProfileCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeactivateCountryProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (profile == null)
            return false;

        profile.Deactivate();
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class AddEntityTypeOverrideCommandHandler : IRequestHandler<AddEntityTypeOverrideCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public AddEntityTypeOverrideCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(AddEntityTypeOverrideCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.CountryProfileId}' not found");

        var overrideConfig = new CountryEntityTypeOverride(
            request.CountryProfileId,
            request.EntityTypeId,
            request.IsEnabled,
            request.CustomDisplayName,
            request.CustomDescription,
            request.DisplayOrder);

        profile.AddEntityTypeOverride(overrideConfig);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class UpdateEntityTypeOverrideCommandHandler : IRequestHandler<UpdateEntityTypeOverrideCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public UpdateEntityTypeOverrideCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(UpdateEntityTypeOverrideCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.CountryProfileId}' not found");

        var overrideConfig = profile.EntityTypeOverrides.FirstOrDefault(o => o.EntityTypeId == request.EntityTypeId);
        if (overrideConfig == null)
            throw new InvalidOperationException($"Entity type override not found");

        overrideConfig.Update(
            request.IsEnabled,
            request.CustomDisplayName,
            request.CustomDescription,
            request.DisplayOrder);

        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class RemoveEntityTypeOverrideCommandHandler : IRequestHandler<RemoveEntityTypeOverrideCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public RemoveEntityTypeOverrideCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(RemoveEntityTypeOverrideCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            return false;

        profile.RemoveEntityTypeOverride(request.EntityTypeId);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class AddTerminologyOverrideCommandHandler : IRequestHandler<AddTerminologyOverrideCommand, Guid>
{
    private readonly ICountryConfigurationRepository _repository;

    public AddTerminologyOverrideCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(AddTerminologyOverrideCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.CountryProfileId}' not found");

        var overrideConfig = new CountryTerminologyOverride(
            request.CountryProfileId,
            request.TargetType,
            request.TargetCode,
            request.OverrideDisplayName,
            request.OverrideDescription,
            request.OverrideHelpText,
            request.OverridePlaceholder);

        profile.AddTerminologyOverride(overrideConfig);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return overrideConfig.Id;
    }
}

public class UpdateTerminologyOverrideCommandHandler : IRequestHandler<UpdateTerminologyOverrideCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public UpdateTerminologyOverrideCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(UpdateTerminologyOverrideCommand request, CancellationToken cancellationToken)
    {
        // Find the profile that contains this override
        var profiles = await _repository.GetAllAsync(true, cancellationToken);
        var profile = profiles.FirstOrDefault(p => p.TerminologyOverrides.Any(o => o.Id == request.OverrideId));
        if (profile == null)
            return false;

        var overrideConfig = profile.TerminologyOverrides.FirstOrDefault(o => o.Id == request.OverrideId);
        if (overrideConfig == null)
            return false;

        overrideConfig.Update(
            request.OverrideDisplayName,
            request.OverrideDescription,
            request.OverrideHelpText,
            request.OverridePlaceholder);

        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class RemoveTerminologyOverrideCommandHandler : IRequestHandler<RemoveTerminologyOverrideCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public RemoveTerminologyOverrideCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(RemoveTerminologyOverrideCommand request, CancellationToken cancellationToken)
    {
        var profiles = await _repository.GetAllAsync(true, cancellationToken);
        var profile = profiles.FirstOrDefault(p => p.TerminologyOverrides.Any(o => o.Id == request.OverrideId));
        if (profile == null)
            return false;

        profile.RemoveTerminologyOverride(request.OverrideId);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class CreateFormBundleCommandHandler : IRequestHandler<CreateFormBundleCommand, FormBundleResult>
{
    private readonly ICountryConfigurationRepository _repository;

    public CreateFormBundleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<FormBundleResult> Handle(CreateFormBundleCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.CountryProfileId}' not found");

        var bundle = new CountryFormBundle(
            request.CountryProfileId,
            request.BundleName,
            request.FieldConfigurationJson,
            request.EntityTypeId,
            request.Description);

        profile.AddFormBundle(bundle);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new FormBundleResult(
            bundle.Id,
            bundle.BundleName,
            bundle.EntityTypeId,
            bundle.IsActive);
    }
}

public class UpdateFormBundleCommandHandler : IRequestHandler<UpdateFormBundleCommand, FormBundleResult>
{
    private readonly ICountryConfigurationRepository _repository;

    public UpdateFormBundleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<FormBundleResult> Handle(UpdateFormBundleCommand request, CancellationToken cancellationToken)
    {
        var profiles = await _repository.GetAllAsync(true, cancellationToken);
        var profile = profiles.FirstOrDefault(p => p.FormBundles.Any(b => b.Id == request.BundleId));
        if (profile == null)
            throw new InvalidOperationException($"Form bundle with ID '{request.BundleId}' not found");

        var bundle = profile.FormBundles.FirstOrDefault(b => b.Id == request.BundleId);
        if (bundle == null)
            throw new InvalidOperationException($"Form bundle with ID '{request.BundleId}' not found");

        bundle.Update(
            request.BundleName,
            request.FieldConfigurationJson,
            request.EntityTypeId,
            request.Description);

        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new FormBundleResult(
            bundle.Id,
            bundle.BundleName,
            bundle.EntityTypeId,
            bundle.IsActive);
    }
}

public class DeleteFormBundleCommandHandler : IRequestHandler<DeleteFormBundleCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public DeleteFormBundleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteFormBundleCommand request, CancellationToken cancellationToken)
    {
        var profiles = await _repository.GetAllAsync(true, cancellationToken);
        var profile = profiles.FirstOrDefault(p => p.FormBundles.Any(b => b.Id == request.BundleId));
        if (profile == null)
            return false;

        profile.RemoveFormBundle(request.BundleId);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class AddFieldVisibilityRuleCommandHandler : IRequestHandler<AddFieldVisibilityRuleCommand, Guid>
{
    private readonly ICountryConfigurationRepository _repository;

    public AddFieldVisibilityRuleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(AddFieldVisibilityRuleCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.CountryProfileId}' not found");

        var rule = new CountryFieldVisibilityRule(
            request.CountryProfileId,
            request.TargetFieldCode,
            request.RuleExpression,
            request.IsVisible,
            request.EntityTypeId,
            request.Priority);

        profile.AddFieldVisibilityRule(rule);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return rule.Id;
    }
}

public class UpdateFieldVisibilityRuleCommandHandler : IRequestHandler<UpdateFieldVisibilityRuleCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public UpdateFieldVisibilityRuleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(UpdateFieldVisibilityRuleCommand request, CancellationToken cancellationToken)
    {
        var profiles = await _repository.GetAllAsync(true, cancellationToken);
        var profile = profiles.FirstOrDefault(p => p.FieldVisibilityRules.Any(r => r.Id == request.RuleId));
        if (profile == null)
            return false;

        var rule = profile.FieldVisibilityRules.FirstOrDefault(r => r.Id == request.RuleId);
        if (rule == null)
            return false;

        rule.Update(
            request.RuleExpression,
            request.IsVisible,
            request.EntityTypeId,
            request.Priority);

        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class RemoveFieldVisibilityRuleCommandHandler : IRequestHandler<RemoveFieldVisibilityRuleCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public RemoveFieldVisibilityRuleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(RemoveFieldVisibilityRuleCommand request, CancellationToken cancellationToken)
    {
        var profiles = await _repository.GetAllAsync(true, cancellationToken);
        var profile = profiles.FirstOrDefault(p => p.FieldVisibilityRules.Any(r => r.Id == request.RuleId));
        if (profile == null)
            return false;

        profile.RemoveFieldVisibilityRule(request.RuleId);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class AddComplianceToggleCommandHandler : IRequestHandler<AddComplianceToggleCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public AddComplianceToggleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(AddComplianceToggleCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.CountryProfileId}' not found");

        var toggle = new CountryComplianceToggle(
            request.CountryProfileId,
            request.ComplianceCode,
            request.ComplianceName,
            request.IsEnabled,
            request.Description,
            request.ConfigurationJson);

        profile.AddComplianceToggle(toggle);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class UpdateComplianceToggleCommandHandler : IRequestHandler<UpdateComplianceToggleCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public UpdateComplianceToggleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(UpdateComplianceToggleCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.CountryProfileId}' not found");

        var toggle = profile.ComplianceToggles.FirstOrDefault(t => t.ComplianceCode == request.ComplianceCode);
        if (toggle == null)
            throw new InvalidOperationException($"Compliance toggle with code '{request.ComplianceCode}' not found");

        toggle.Update(
            request.ComplianceName,
            request.IsEnabled,
            request.Description,
            request.ConfigurationJson);

        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class RemoveComplianceToggleCommandHandler : IRequestHandler<RemoveComplianceToggleCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public RemoveComplianceToggleCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(RemoveComplianceToggleCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            return false;

        profile.RemoveComplianceToggle(request.ComplianceCode);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class AddTagCommandHandler : IRequestHandler<AddTagCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public AddTagCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(AddTagCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            throw new InvalidOperationException($"Country profile with ID '{request.CountryProfileId}' not found");

        profile.AddTag(request.TagName, request.TagValue);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class RemoveTagCommandHandler : IRequestHandler<RemoveTagCommand, bool>
{
    private readonly ICountryConfigurationRepository _repository;

    public RemoveTagCommandHandler(ICountryConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(RemoveTagCommand request, CancellationToken cancellationToken)
    {
        var profile = await _repository.GetByIdAsync(request.CountryProfileId, cancellationToken);
        if (profile == null)
            return false;

        profile.RemoveTag(request.TagName, request.TagValue);
        await _repository.UpdateAsync(profile, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

