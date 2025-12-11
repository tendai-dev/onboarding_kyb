using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Infrastructure.Utilities;

namespace OnboardingApi.Presentation.Controllers;

/// <summary>
/// Partner utilities controller
/// Provides endpoints for partner-related operations
/// </summary>
[ApiController]
[Route("api/v1/partner")]
public class PartnerController : ControllerBase
{
    private readonly ILogger<PartnerController> _logger;

    public PartnerController(ILogger<PartnerController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get PartnerId for the authenticated user
    /// This is the single source of truth for PartnerId generation
    /// Frontend should use this instead of generating MD5 locally
    /// </summary>
    [HttpGet("id")]
#if DEBUG
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
#endif
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetPartnerId()
    {
        // Get authenticated user's email from headers (set by DevelopmentAuthMiddleware or JWT)
        var userEmail = Request.Headers["X-User-Email"].FirstOrDefault();
        
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            _logger.LogWarning("GetPartnerId request rejected - user email not found");
            return Unauthorized(new { error = "User email not found in authentication headers" });
        }

        // Generate PartnerId from authenticated user's email (single source of truth)
        var partnerId = PartnerIdGenerator.GenerateFromEmail(userEmail);
        
        _logger.LogInformation("Generated PartnerId for user: {Email} -> {PartnerId}", userEmail, partnerId);
        
        return Ok(new
        {
            email = userEmail,
            partnerId = partnerId.ToString(),
            partnerIdGuid = partnerId
        });
    }

    /// <summary>
    /// Validate that a PartnerId matches the authenticated user
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult ValidatePartnerId([FromBody] ValidatePartnerIdRequest request)
    {
        var userEmail = Request.Headers["X-User-Email"].FirstOrDefault();
        
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            return Unauthorized(new { error = "User email not found" });
        }

        if (!Guid.TryParse(request.PartnerId, out var partnerIdGuid))
        {
            return BadRequest(new { error = "Invalid PartnerId format" });
        }

        var isValid = PartnerIdGenerator.Validate(userEmail, partnerIdGuid);
        
        return Ok(new
        {
            email = userEmail,
            partnerId = request.PartnerId,
            isValid = isValid
        });
    }
}

public class ValidatePartnerIdRequest
{
    public string PartnerId { get; set; } = string.Empty;
}

