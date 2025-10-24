namespace DocumentService.Application.Interfaces;

/// <summary>
/// Service for comprehensive document validation (virus scanning + quality checks)
/// </summary>
public interface IDocumentValidationService
{
    /// <summary>
    /// Perform full validation pipeline on uploaded document
    /// </summary>
    /// <param name="documentId">Document identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result with pass/fail status and details</returns>
    Task<ValidationResult> ValidateDocumentAsync(Guid documentId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of complete document validation
/// </summary>
public record ValidationResult
{
    public bool Passed { get; init; }
    public bool VirusScanned { get; init; }
    public bool IsVirusClean { get; init; }
    public string? VirusName { get; init; }
    public bool QualityChecked { get; init; }
    public int? QualityScore { get; init; }
    public List<string> ValidationErrors { get; init; } = new();
    public List<string> ValidationWarnings { get; init; } = new();
    public TimeSpan TotalDuration { get; init; }
    
    public static ValidationResult Success(TimeSpan duration) => new()
    {
        Passed = true,
        VirusScanned = true,
        IsVirusClean = true,
        QualityChecked = true,
        QualityScore = 100,
        TotalDuration = duration
    };
    
    public static ValidationResult Failure(List<string> errors, TimeSpan duration) => new()
    {
        Passed = false,
        ValidationErrors = errors,
        TotalDuration = duration
    };
}

