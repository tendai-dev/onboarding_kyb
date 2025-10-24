namespace DocumentService.Infrastructure.AntiVirus;

/// <summary>
/// Interface for document quality validation (OCR, readability, authenticity checks)
/// </summary>
public interface IDocumentQualityValidator
{
    /// <summary>
    /// Validate document quality including OCR readability, blur detection, and completeness
    /// </summary>
    /// <param name="stream">Document file stream</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="documentType">Type of document for context-specific validation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result with quality score and issues</returns>
    Task<DocumentQualityResult> ValidateAsync(
        Stream stream,
        string fileName,
        string documentType,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of document quality validation
/// </summary>
public record DocumentQualityResult
{
    /// <summary>
    /// Overall quality score (0-100)
    /// </summary>
    public int QualityScore { get; init; }
    
    /// <summary>
    /// Whether document passes minimum quality threshold
    /// </summary>
    public bool IsAcceptable { get; init; }
    
    /// <summary>
    /// List of quality issues detected
    /// </summary>
    public List<QualityIssue> Issues { get; init; } = new();
    
    /// <summary>
    /// Extracted text from OCR (if applicable)
    /// </summary>
    public string? ExtractedText { get; init; }
    
    /// <summary>
    /// Confidence level of OCR extraction (0-100)
    /// </summary>
    public int? OcrConfidence { get; init; }
    
    /// <summary>
    /// Duration of validation process
    /// </summary>
    public TimeSpan ValidationDuration { get; init; }
    
    public static DocumentQualityResult Acceptable(int score, TimeSpan duration) => new()
    {
        QualityScore = score,
        IsAcceptable = true,
        ValidationDuration = duration
    };
    
    public static DocumentQualityResult Unacceptable(int score, List<QualityIssue> issues, TimeSpan duration) => new()
    {
        QualityScore = score,
        IsAcceptable = false,
        Issues = issues,
        ValidationDuration = duration
    };
}

/// <summary>
/// Represents a specific quality issue detected in a document
/// </summary>
public record QualityIssue
{
    public QualityIssueType Type { get; init; }
    public string Description { get; init; } = string.Empty;
    public int SeverityScore { get; init; } // Deduction from quality score
}

public enum QualityIssueType
{
    Blurred,
    LowResolution,
    PartiallyVisible,
    PoorLighting,
    Unreadable,
    WrongDocumentType,
    Corrupted,
    TextNotDetected,
    LowOcrConfidence
}

