using DocumentService.Application.Commands;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DocumentService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class DocumentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(IMediator mediator, ILogger<DocumentsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Upload a document for a KYC case
    /// </summary>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(UploadDocumentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentRequest request)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { error = "No file provided" });

            var command = new UploadDocumentCommand
            {
                CaseId = request.CaseId,
                PartnerId = request.PartnerId,
                Type = request.Type,
                FileName = request.File.FileName,
                ContentType = request.File.ContentType,
                FileStream = request.File.OpenReadStream(),
                FileSizeBytes = request.File.Length,
                UploadedBy = request.UploadedBy ?? "system"
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Generate presigned URL for direct upload
    /// </summary>
    [HttpPost("presigned-url")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GeneratePresignedUrl([FromBody] GeneratePresignedUploadUrlCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating presigned URL");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Bulk import documents
    /// </summary>
    [HttpPost("bulk-import")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BulkImport([FromBody] BulkImportDocumentsCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk import");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

public class UploadDocumentRequest
{
    public Guid CaseId { get; set; }
    public Guid PartnerId { get; set; }
    public DocumentService.Domain.ValueObjects.DocumentType Type { get; set; }
    public IFormFile File { get; set; } = null!;
    public string? UploadedBy { get; set; }
}
