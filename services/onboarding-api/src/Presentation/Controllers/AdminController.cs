using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Commands;
using OnboardingApi.Application.Queries;
using OnboardingApi.Presentation.Models;

namespace OnboardingApi.Presentation.Controllers;

/// <summary>
/// Admin API Controller for administrative functions
/// Matches the frontend's expected admin API structure
/// </summary>
[ApiController]
[Route("api/v1/admin")]
[Authorize]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IMediator mediator, ILogger<AdminController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all onboardings for admin view
    /// </summary>
    [HttpGet("onboardings")]
    [ProducesResponseType(typeof(List<OnboardingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminOnboardings(
        [FromQuery] int? limit = 25,
        [FromQuery] int? offset = 0,
        [FromQuery] string? status = null,
        [FromQuery] string? assignee = null,
        CancellationToken cancellationToken = default)
    {
        // TODO: Implement admin onboardings query with filtering
        // For now, return empty list
        return Ok(new List<OnboardingDto>());
    }

    /// <summary>
    /// Inject an onboarding to Mukuru server
    /// </summary>
    [HttpPost("onboardings/{id}/inject")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> InjectToMukuru(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirst("sub")?.Value ?? "system";
        
        // TODO: Implement Mukuru injection logic
        // For now, return success response
        var response = new
        {
            success = true,
            message = "Application injected to Mukuru server"
        };

        return Ok(response);
    }

    /// <summary>
    /// Get work items queue
    /// </summary>
    [HttpGet("work-items")]
    [ProducesResponseType(typeof(List<WorkItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkItems(
        [FromQuery] string? state = null,
        [FromQuery] string? assignee = null,
        [FromQuery] string? priority = null,
        CancellationToken cancellationToken = default)
    {
        // TODO: Implement work items query
        // For now, return empty list
        return Ok(new List<WorkItemDto>());
    }

    /// <summary>
    /// Assign a work item
    /// </summary>
    [HttpPost("work-items/{id}/assign")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignWorkItem(
        Guid id,
        [FromBody] AssignWorkItemRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirst("sub")?.Value ?? "system";
        
        // TODO: Implement work item assignment
        // For now, return success response
        var response = new
        {
            success = true,
            message = "Work item assigned successfully"
        };

        return Ok(response);
    }

    /// <summary>
    /// Get audit events
    /// </summary>
    [HttpGet("audit-events")]
    [ProducesResponseType(typeof(List<AuditEventDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditEvents(
        [FromQuery] string? entity = null,
        [FromQuery] string? entityId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int? limit = 100,
        CancellationToken cancellationToken = default)
    {
        // TODO: Implement audit events query
        // For now, return empty list
        return Ok(new List<AuditEventDto>());
    }

    /// <summary>
    /// Get webhook deliveries
    /// </summary>
    [HttpGet("webhook-deliveries")]
    [ProducesResponseType(typeof(List<WebhookDeliveryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWebhookDeliveries(
        [FromQuery] string? eventType = null,
        [FromQuery] bool? verified = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int? limit = 100,
        CancellationToken cancellationToken = default)
    {
        // TODO: Implement webhook deliveries query
        // For now, return empty list
        return Ok(new List<WebhookDeliveryDto>());
    }

    /// <summary>
    /// Get entity types
    /// </summary>
    [HttpGet("entity-types")]
    [ProducesResponseType(typeof(List<EntityTypeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEntityTypes(
        CancellationToken cancellationToken = default)
    {
        // Return the entity types that match the frontend expectations
        var entityTypes = new List<EntityTypeDto>
        {
            new()
            {
                Id = "et_1",
                Name = "company",
                DisplayName = "Company",
                Description = "Registered companies and corporations",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "et_2",
                Name = "ngo",
                DisplayName = "NGO",
                Description = "Non-Governmental Organizations",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "et_3",
                Name = "sole_proprietor",
                DisplayName = "Sole Proprietor",
                Description = "Individual business owners",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            }
        };

        return Ok(entityTypes);
    }

    /// <summary>
    /// Get requirements
    /// </summary>
    [HttpGet("requirements")]
    [ProducesResponseType(typeof(List<RequirementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRequirements(
        CancellationToken cancellationToken = default)
    {
        // Return the requirements that match the frontend expectations
        var requirements = new List<RequirementDto>
        {
            new()
            {
                Id = "req_1",
                Name = "legal_name",
                DisplayName = "Legal Name",
                Description = "Official registered name of the entity",
                FieldType = "text",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "req_2",
                Name = "registration_number",
                DisplayName = "Registration Number",
                Description = "Official registration or incorporation number",
                FieldType = "text",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "req_3",
                Name = "tax_id",
                DisplayName = "Tax ID",
                Description = "Tax identification number",
                FieldType = "text",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "req_4",
                Name = "incorporation_date",
                DisplayName = "Incorporation Date",
                Description = "Date when the entity was registered",
                FieldType = "date",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "req_5",
                Name = "business_address",
                DisplayName = "Business Address",
                Description = "Primary business location",
                FieldType = "text",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "req_6",
                Name = "proof_of_address",
                DisplayName = "Proof of Address",
                Description = "Document verifying business address",
                FieldType = "file",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "req_7",
                Name = "certificate_of_incorporation",
                DisplayName = "Certificate of Incorporation",
                Description = "Official incorporation certificate",
                FieldType = "file",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            }
        };

        return Ok(requirements);
    }

    /// <summary>
    /// Get admin users
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(List<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminUsers(
        CancellationToken cancellationToken = default)
    {
        // Return mock admin users that match the frontend expectations
        var users = new List<UserDto>
        {
            new()
            {
                Id = "user_admin_1",
                Email = "admin@mukuru.com",
                FirstName = "Sarah",
                LastName = "Williams",
                Role = "admin",
                ProfileImageUrl = null,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow.AddDays(-365)
            },
            new()
            {
                Id = "user_admin_2",
                Email = "james.miller@mukuru.com",
                FirstName = "James",
                LastName = "Miller",
                Role = "admin",
                ProfileImageUrl = null,
                CreatedAt = DateTime.UtcNow.AddDays(-200),
                UpdatedAt = DateTime.UtcNow.AddDays(-200)
            },
            new()
            {
                Id = "user_admin_3",
                Email = "lisa.chen@mukuru.com",
                FirstName = "Lisa",
                LastName = "Chen",
                Role = "admin",
                ProfileImageUrl = null,
                CreatedAt = DateTime.UtcNow.AddDays(-100),
                UpdatedAt = DateTime.UtcNow.AddDays(-100)
            },
            new()
            {
                Id = "user_commercial_1",
                Email = "david.jones@mukuru.com",
                FirstName = "David",
                LastName = "Jones",
                Role = "commercial",
                ProfileImageUrl = null,
                CreatedAt = DateTime.UtcNow.AddDays(-300),
                UpdatedAt = DateTime.UtcNow.AddDays(-300)
            }
        };

        return Ok(users);
    }
}

// DTOs for admin endpoints
public class WorkItemDto
{
    public string Id { get; set; } = string.Empty;
    public string OnboardingId { get; set; } = string.Empty;
    public string? Assignee { get; set; }
    public DateTime? AssignedAt { get; set; }
    public string? AssignedBy { get; set; }
    public string State { get; set; } = string.Empty;
    public string? Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AuditEventDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime At { get; set; }
    public string Actor { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public object? Before { get; set; }
    public object? After { get; set; }
}

public class WebhookDeliveryDto
{
    public string Id { get; set; } = string.Empty;
    public string DeliveryId { get; set; } = string.Empty;
    public string Event { get; set; } = string.Empty;
    public string? Source { get; set; }
    public DateTime EventDate { get; set; }
    public DateTime CallbackDate { get; set; }
    public object? Data { get; set; }
    public string? Signature { get; set; }
    public bool Verified { get; set; }
}

public class EntityTypeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class RequirementDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FieldType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AssignWorkItemRequest
{
    public string AssigneeId { get; set; } = string.Empty;
}
