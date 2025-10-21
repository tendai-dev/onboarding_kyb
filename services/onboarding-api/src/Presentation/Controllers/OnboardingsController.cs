using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Commands;
using OnboardingApi.Application.Queries;
using OnboardingApi.Presentation.Filters;
using OnboardingApi.Presentation.Models;
using System.Text.Json;

namespace OnboardingApi.Presentation.Controllers;

/// <summary>
/// Frontend-compatible Onboardings API Controller
/// Matches the frontend's expected API structure
/// </summary>
[ApiController]
[Route("api/v1")]
[Authorize]
[Produces("application/json")]
public class OnboardingsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OnboardingsController> _logger;

    public OnboardingsController(IMediator mediator, ILogger<OnboardingsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get list of onboardings for the current user
    /// </summary>
    [HttpGet("onboardings")]
    [ProducesResponseType(typeof(List<OnboardingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOnboardings(
        [FromQuery] int? limit = 25,
        [FromQuery] int? offset = 0,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst("sub")?.Value ?? "system";
        
        var query = new GetOnboardingsQuery
        {
            UserId = userId,
            Limit = limit ?? 25,
            Offset = offset ?? 0,
            Status = status
        };

        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a new onboarding application
    /// </summary>
    [HttpPost("onboardings")]
    [ProducesResponseType(typeof(OnboardingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateOnboarding(
        [FromBody] CreateOnboardingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirst("sub")?.Value ?? "system";

        // For now, return a mock response
        var response = new OnboardingDto
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            EntityType = request.EntityType,
            Status = "draft",
            LegalName = request.LegalName,
            Country = request.Country,
            Email = request.Email,
            RegistrationNumber = request.RegistrationNumber,
            TaxId = request.TaxId,
            IncorporationDate = request.IncorporationDate,
            BusinessAddress = request.BusinessAddress,
            ContactPerson = request.ContactPerson,
            PhoneNumber = request.PhoneNumber,
            Website = request.Website,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return CreatedAtAction(
            nameof(GetOnboarding),
            new { id = response.Id },
            response);
    }

    /// <summary>
    /// Get a single onboarding by ID
    /// </summary>
    [HttpGet("onboardings/{id}")]
    [ProducesResponseType(typeof(OnboardingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOnboarding(
        string id,
        CancellationToken cancellationToken)
    {
        // For now, return a mock response
        var response = new OnboardingDto
        {
            Id = id,
            UserId = User.FindFirst("sub")?.Value ?? "system",
            EntityType = "company",
            Status = "draft",
            LegalName = "Sample Company",
            Country = "ZA",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return Ok(response);
    }

    /// <summary>
    /// Get documents for an onboarding
    /// </summary>
    [HttpGet("onboardings/{id}/documents")]
    [ProducesResponseType(typeof(List<DocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments(
        string id,
        CancellationToken cancellationToken)
    {
        // TODO: Implement document retrieval
        // For now, return empty list
        return Ok(new List<DocumentDto>());
    }

    /// <summary>
    /// Upload a document for an onboarding
    /// </summary>
    [HttpPost("onboardings/{id}/documents")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> UploadDocument(
        string id,
        [FromForm] IFormFile file,
        [FromForm] string kind,
        CancellationToken cancellationToken)
    {
        // TODO: Implement document upload
        // For now, return a mock response
        var response = new DocumentDto
        {
            Id = Guid.NewGuid().ToString(),
            OnboardingId = id,
            Kind = kind,
            Filename = file.FileName,
            Size = (int)file.Length,
            MimeType = file.ContentType,
            UploadedAt = DateTime.UtcNow
        };

        return CreatedAtAction(
            nameof(GetDocuments),
            new { id },
            response);
    }

    /// <summary>
    /// Get messages for an onboarding
    /// </summary>
    [HttpGet("onboardings/{id}/messages")]
    [ProducesResponseType(typeof(List<MessageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMessages(
        string id,
        CancellationToken cancellationToken)
    {
        // TODO: Implement message retrieval
        // For now, return empty list
        return Ok(new List<MessageDto>());
    }

    /// <summary>
    /// Send a message for an onboarding
    /// </summary>
    [HttpPost("onboardings/{id}/messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> SendMessage(
        string id,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirst("sub")?.Value ?? "system";
        
        // TODO: Implement message sending
        // For now, return a mock response
        var response = new MessageDto
        {
            Id = Guid.NewGuid().ToString(),
            OnboardingId = id,
            From = "customer",
            UserId = userId,
            Body = request.Body,
            CreatedAt = DateTime.UtcNow
        };

        return CreatedAtAction(
            nameof(GetMessages),
            new { id },
            response);
    }

    /// <summary>
    /// Get status history for an onboarding
    /// </summary>
    [HttpGet("onboardings/{id}/history")]
    [ProducesResponseType(typeof(List<StatusHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatusHistory(
        string id,
        CancellationToken cancellationToken)
    {
        // TODO: Implement status history retrieval
        // For now, return empty list
        return Ok(new List<StatusHistoryDto>());
    }
}

// DTOs for frontend compatibility
public class OnboardingDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? Country { get; set; }
    public string? Email { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? TaxId { get; set; }
    public string? IncorporationDate { get; set; }
    public string? BusinessAddress { get; set; }
    public string? ContactPerson { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
    public string? Assignee { get; set; }
    public DateTime? AssignedAt { get; set; }
    public string? AssignedBy { get; set; }
    public bool InjectedToMukuru { get; set; }
    public DateTime? InjectedAt { get; set; }
    public string? InjectedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DocumentDto
{
    public string Id { get; set; } = string.Empty;
    public string OnboardingId { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Filename { get; set; } = string.Empty;
    public int Size { get; set; }
    public string? MimeType { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class MessageDto
{
    public string Id { get; set; } = string.Empty;
    public string OnboardingId { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class StatusHistoryDto
{
    public string Id { get; set; } = string.Empty;
    public string OnboardingId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class CreateOnboardingRequest
{
    public string EntityType { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? RegistrationNumber { get; set; }
    public string? TaxId { get; set; }
    public string? IncorporationDate { get; set; }
    public string? BusinessAddress { get; set; }
    public string? ContactPerson { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }
}

public class SendMessageRequest
{
    public string Body { get; set; } = string.Empty;
}
