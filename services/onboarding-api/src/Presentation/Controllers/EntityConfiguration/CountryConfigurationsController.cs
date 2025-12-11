using MediatR;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Queries;

namespace OnboardingApi.Presentation.Controllers.EntityConfiguration;

[ApiController]
[Route("api/v1/country-configurations")]
[Produces("application/json")]
public class CountryConfigurationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CountryConfigurationsController> _logger;

    public CountryConfigurationsController(IMediator mediator, ILogger<CountryConfigurationsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all country profiles
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<CountryProfileDto>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAllCountryProfilesQuery(includeInactive);
        var profiles = await _mediator.Send(query, cancellationToken);
        return Ok(profiles);
    }

    /// <summary>
    /// Get country profile by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CountryProfileDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetCountryProfileByIdQuery(id);
        var profile = await _mediator.Send(query, cancellationToken);

        if (profile == null)
            return NotFound(new { message = $"Country profile with ID '{id}' not found" });

        return Ok(profile);
    }

    /// <summary>
    /// Get country profile by country code
    /// </summary>
    [HttpGet("by-code/{countryCode}")]
    [ProducesResponseType(typeof(CountryProfileDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByCode(string countryCode, CancellationToken cancellationToken = default)
    {
        var query = new GetCountryProfileByCodeQuery(countryCode);
        var profile = await _mediator.Send(query, cancellationToken);

        if (profile == null)
            return NotFound(new { message = $"Country profile with code '{countryCode}' not found" });

        return Ok(profile);
    }

    /// <summary>
    /// Create a new country profile
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CountryProfileResult), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCountryProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new CreateCountryProfileCommand(
                request.CountryCode,
                request.CountryName,
                request.Description,
                request.CreatedBy ?? "system");

            var result = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update a country profile
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(CountryProfileResult), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCountryProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new UpdateCountryProfileCommand(
                id,
                request.CountryName,
                request.Description,
                request.UpdatedBy);

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a country profile
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeleteCountryProfileCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
            return NotFound(new { message = $"Country profile with ID '{id}' not found" });

        return NoContent();
    }

    /// <summary>
    /// Activate a country profile
    /// </summary>
    [HttpPost("{id}/activate")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ActivateCountryProfileCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
            return NotFound(new { message = $"Country profile with ID '{id}' not found" });

        return Ok(new { message = "Country profile activated" });
    }

    /// <summary>
    /// Deactivate a country profile
    /// </summary>
    [HttpPost("{id}/deactivate")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeactivateCountryProfileCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
            return NotFound(new { message = $"Country profile with ID '{id}' not found" });

        return Ok(new { message = "Country profile deactivated" });
    }

    // Entity Type Override endpoints
    /// <summary>
    /// Add entity type override to a country profile
    /// </summary>
    [HttpPost("{countryProfileId}/entity-type-overrides")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> AddEntityTypeOverride(
        Guid countryProfileId,
        [FromBody] AddEntityTypeOverrideRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new AddEntityTypeOverrideCommand(
                countryProfileId,
                request.EntityTypeId,
                request.IsEnabled,
                request.CustomDisplayName,
                request.CustomDescription,
                request.DisplayOrder);

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(new { success = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update entity type override
    /// </summary>
    [HttpPut("{countryProfileId}/entity-type-overrides/{entityTypeId}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateEntityTypeOverride(
        Guid countryProfileId,
        Guid entityTypeId,
        [FromBody] UpdateEntityTypeOverrideRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new UpdateEntityTypeOverrideCommand(
                countryProfileId,
                entityTypeId,
                request.IsEnabled,
                request.CustomDisplayName,
                request.CustomDescription,
                request.DisplayOrder);

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(new { success = result });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Remove entity type override
    /// </summary>
    [HttpDelete("{countryProfileId}/entity-type-overrides/{entityTypeId}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> RemoveEntityTypeOverride(
        Guid countryProfileId,
        Guid entityTypeId,
        CancellationToken cancellationToken = default)
    {
        var command = new RemoveEntityTypeOverrideCommand(countryProfileId, entityTypeId);
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    // Terminology Override endpoints
    /// <summary>
    /// Add terminology override
    /// </summary>
    [HttpPost("{countryProfileId}/terminology-overrides")]
    [ProducesResponseType(typeof(Guid), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> AddTerminologyOverride(
        Guid countryProfileId,
        [FromBody] AddTerminologyOverrideRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new AddTerminologyOverrideCommand(
                countryProfileId,
                request.TargetType,
                request.TargetCode,
                request.OverrideDisplayName,
                request.OverrideDescription,
                request.OverrideHelpText,
                request.OverridePlaceholder);

            var result = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = countryProfileId }, new { overrideId = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update terminology override
    /// </summary>
    [HttpPut("terminology-overrides/{overrideId}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateTerminologyOverride(
        Guid overrideId,
        [FromBody] UpdateTerminologyOverrideRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateTerminologyOverrideCommand(
            overrideId,
            request.OverrideDisplayName,
            request.OverrideDescription,
            request.OverrideHelpText,
            request.OverridePlaceholder);

        var result = await _mediator.Send(command, cancellationToken);
        if (!result)
            return NotFound(new { message = $"Terminology override with ID '{overrideId}' not found" });

        return Ok(new { success = true });
    }

    /// <summary>
    /// Remove terminology override
    /// </summary>
    [HttpDelete("terminology-overrides/{overrideId}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> RemoveTerminologyOverride(
        Guid overrideId,
        CancellationToken cancellationToken = default)
    {
        var command = new RemoveTerminologyOverrideCommand(overrideId);
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    // Form Bundle endpoints
    /// <summary>
    /// Create form bundle
    /// </summary>
    [HttpPost("{countryProfileId}/form-bundles")]
    [ProducesResponseType(typeof(FormBundleResult), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateFormBundle(
        Guid countryProfileId,
        [FromBody] CreateFormBundleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new CreateFormBundleCommand(
                countryProfileId,
                request.BundleName,
                request.FieldConfigurationJson,
                request.EntityTypeId,
                request.Description);

            var result = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = countryProfileId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update form bundle
    /// </summary>
    [HttpPut("form-bundles/{bundleId}")]
    [ProducesResponseType(typeof(FormBundleResult), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateFormBundle(
        Guid bundleId,
        [FromBody] UpdateFormBundleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new UpdateFormBundleCommand(
                bundleId,
                request.BundleName,
                request.FieldConfigurationJson,
                request.EntityTypeId,
                request.Description);

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete form bundle
    /// </summary>
    [HttpDelete("form-bundles/{bundleId}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteFormBundle(
        Guid bundleId,
        CancellationToken cancellationToken = default)
    {
        var command = new DeleteFormBundleCommand(bundleId);
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    // Field Visibility Rule endpoints
    /// <summary>
    /// Add field visibility rule
    /// </summary>
    [HttpPost("{countryProfileId}/field-visibility-rules")]
    [ProducesResponseType(typeof(Guid), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> AddFieldVisibilityRule(
        Guid countryProfileId,
        [FromBody] AddFieldVisibilityRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new AddFieldVisibilityRuleCommand(
                countryProfileId,
                request.TargetFieldCode,
                request.RuleExpression,
                request.IsVisible,
                request.EntityTypeId,
                request.Priority);

            var result = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = countryProfileId }, new { ruleId = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update field visibility rule
    /// </summary>
    [HttpPut("field-visibility-rules/{ruleId}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateFieldVisibilityRule(
        Guid ruleId,
        [FromBody] UpdateFieldVisibilityRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateFieldVisibilityRuleCommand(
            ruleId,
            request.RuleExpression,
            request.IsVisible,
            request.EntityTypeId,
            request.Priority);

        var result = await _mediator.Send(command, cancellationToken);
        if (!result)
            return NotFound(new { message = $"Field visibility rule with ID '{ruleId}' not found" });

        return Ok(new { success = true });
    }

    /// <summary>
    /// Remove field visibility rule
    /// </summary>
    [HttpDelete("field-visibility-rules/{ruleId}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> RemoveFieldVisibilityRule(
        Guid ruleId,
        CancellationToken cancellationToken = default)
    {
        var command = new RemoveFieldVisibilityRuleCommand(ruleId);
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    // Compliance Toggle endpoints
    /// <summary>
    /// Add compliance toggle
    /// </summary>
    [HttpPost("{countryProfileId}/compliance-toggles")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> AddComplianceToggle(
        Guid countryProfileId,
        [FromBody] AddComplianceToggleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new AddComplianceToggleCommand(
                countryProfileId,
                request.ComplianceCode,
                request.ComplianceName,
                request.IsEnabled,
                request.Description,
                request.ConfigurationJson);

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(new { success = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update compliance toggle
    /// </summary>
    [HttpPut("{countryProfileId}/compliance-toggles/{complianceCode}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateComplianceToggle(
        Guid countryProfileId,
        string complianceCode,
        [FromBody] UpdateComplianceToggleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new UpdateComplianceToggleCommand(
                countryProfileId,
                complianceCode,
                request.ComplianceName,
                request.IsEnabled,
                request.Description,
                request.ConfigurationJson);

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(new { success = result });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Remove compliance toggle
    /// </summary>
    [HttpDelete("{countryProfileId}/compliance-toggles/{complianceCode}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> RemoveComplianceToggle(
        Guid countryProfileId,
        string complianceCode,
        CancellationToken cancellationToken = default)
    {
        var command = new RemoveComplianceToggleCommand(countryProfileId, complianceCode);
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    // Tag endpoints
    /// <summary>
    /// Add tag to country profile
    /// </summary>
    [HttpPost("{countryProfileId}/tags")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> AddTag(
        Guid countryProfileId,
        [FromBody] AddTagRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new AddTagCommand(
                countryProfileId,
                request.TagName,
                request.TagValue);

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(new { success = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Remove tag from country profile
    /// </summary>
    [HttpDelete("{countryProfileId}/tags")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> RemoveTag(
        Guid countryProfileId,
        [FromQuery] string tagName,
        [FromQuery] string? tagValue = null,
        CancellationToken cancellationToken = default)
    {
        var command = new RemoveTagCommand(countryProfileId, tagName, tagValue);
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }
}

// Request DTOs
public record CreateCountryProfileRequest(
    string CountryCode,
    string CountryName,
    string? Description = null,
    string? CreatedBy = null
);

public record UpdateCountryProfileRequest(
    string CountryName,
    string? Description = null,
    string? UpdatedBy = null
);

public record AddEntityTypeOverrideRequest(
    Guid EntityTypeId,
    bool IsEnabled = true,
    string? CustomDisplayName = null,
    string? CustomDescription = null,
    int DisplayOrder = 0
);

public record UpdateEntityTypeOverrideRequest(
    bool IsEnabled,
    string? CustomDisplayName = null,
    string? CustomDescription = null,
    int DisplayOrder = 0
);

public record AddTerminologyOverrideRequest(
    string TargetType,
    string TargetCode,
    string? OverrideDisplayName = null,
    string? OverrideDescription = null,
    string? OverrideHelpText = null,
    string? OverridePlaceholder = null
);

public record UpdateTerminologyOverrideRequest(
    string? OverrideDisplayName = null,
    string? OverrideDescription = null,
    string? OverrideHelpText = null,
    string? OverridePlaceholder = null
);

public record CreateFormBundleRequest(
    string BundleName,
    string FieldConfigurationJson,
    Guid? EntityTypeId = null,
    string? Description = null
);

public record UpdateFormBundleRequest(
    string BundleName,
    string FieldConfigurationJson,
    Guid? EntityTypeId = null,
    string? Description = null
);

public record AddFieldVisibilityRuleRequest(
    string TargetFieldCode,
    string RuleExpression,
    bool IsVisible = true,
    Guid? EntityTypeId = null,
    int Priority = 0
);

public record UpdateFieldVisibilityRuleRequest(
    string RuleExpression,
    bool IsVisible = true,
    Guid? EntityTypeId = null,
    int Priority = 0
);

public record AddComplianceToggleRequest(
    string ComplianceCode,
    string ComplianceName,
    bool IsEnabled = true,
    string? Description = null,
    string? ConfigurationJson = null
);

public record UpdateComplianceToggleRequest(
    string ComplianceName,
    bool IsEnabled,
    string? Description = null,
    string? ConfigurationJson = null
);

public record AddTagRequest(
    string TagName,
    string? TagValue = null
);

