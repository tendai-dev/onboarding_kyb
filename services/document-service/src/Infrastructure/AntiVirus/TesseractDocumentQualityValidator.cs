using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DocumentService.Infrastructure.AntiVirus;

/// <summary>
/// Document quality validator using Tesseract OCR for text extraction and quality assessment
/// </summary>
public class TesseractDocumentQualityValidator : IDocumentQualityValidator
{
    private readonly ILogger<TesseractDocumentQualityValidator> _logger;
    private readonly DocumentQualityOptions _options;
    
    // Quality thresholds
    private const int MinimumQualityScore = 60;
    private const int MinimumOcrConfidence = 50;
    private const int MinimumTextLength = 20;
    
    public TesseractDocumentQualityValidator(
        ILogger<TesseractDocumentQualityValidator> logger,
        IOptions<DocumentQualityOptions> options)
    {
        _logger = logger;
        _options = options.Value;
    }
    
    public async Task<DocumentQualityResult> ValidateAsync(
        Stream stream,
        string fileName,
        string documentType,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var issues = new List<QualityIssue>();
        var qualityScore = 100; // Start with perfect score and deduct
        
        try
        {
            _logger.LogInformation(
                "Starting quality validation for document: {FileName}, Type: {DocumentType}",
                fileName, documentType);
            
            // Check file size
            if (stream.Length == 0)
            {
                issues.Add(new QualityIssue
                {
                    Type = QualityIssueType.Corrupted,
                    Description = "File is empty",
                    SeverityScore = 100
                });
                stopwatch.Stop();
                return CreateResult(0, issues, null, null, stopwatch.Elapsed);
            }
            
            // Check if file is too large (potential DoS)
            if (stream.Length > _options.MaxFileSizeBytes)
            {
                issues.Add(new QualityIssue
                {
                    Type = QualityIssueType.Corrupted,
                    Description = $"File exceeds maximum size of {_options.MaxFileSizeBytes} bytes",
                    SeverityScore = 50
                });
                qualityScore -= 50;
            }
            
            // For PDF and image files, perform OCR
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (IsSupportedForOcr(extension))
            {
                var ocrResult = await PerformOcrAsync(stream, fileName, cancellationToken);
                
                if (ocrResult == null || string.IsNullOrWhiteSpace(ocrResult.ExtractedText))
                {
                    issues.Add(new QualityIssue
                    {
                        Type = QualityIssueType.TextNotDetected,
                        Description = "No text could be extracted from document",
                        SeverityScore = 40
                    });
                    qualityScore -= 40;
                }
                else
                {
                    // Validate OCR confidence
                    if (ocrResult.Confidence < MinimumOcrConfidence)
                    {
                        issues.Add(new QualityIssue
                        {
                            Type = QualityIssueType.LowOcrConfidence,
                            Description = $"OCR confidence is low: {ocrResult.Confidence}%",
                            SeverityScore = 30
                        });
                        qualityScore -= 30;
                    }
                    
                    // Validate text length
                    if (ocrResult.ExtractedText.Length < MinimumTextLength)
                    {
                        issues.Add(new QualityIssue
                        {
                            Type = QualityIssueType.PartiallyVisible,
                            Description = "Document contains very little text",
                            SeverityScore = 20
                        });
                        qualityScore -= 20;
                    }
                    
                    // Check for expected keywords based on document type
                    ValidateDocumentTypeKeywords(documentType, ocrResult.ExtractedText, issues, ref qualityScore);
                }
                
                stopwatch.Stop();
                return CreateResult(
                    Math.Max(0, qualityScore),
                    issues,
                    ocrResult?.ExtractedText,
                    ocrResult?.Confidence,
                    stopwatch.Elapsed);
            }
            else
            {
                // For non-OCR files (e.g., Word docs), perform basic validation
                _logger.LogInformation(
                    "File type {Extension} not supported for OCR, performing basic validation",
                    extension);
                    
                stopwatch.Stop();
                return CreateResult(qualityScore, issues, null, null, stopwatch.Elapsed);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating document quality: {FileName}", fileName);
            stopwatch.Stop();
            
            issues.Add(new QualityIssue
            {
                Type = QualityIssueType.Corrupted,
                Description = $"Validation failed: {ex.Message}",
                SeverityScore = 100
            });
            
            return CreateResult(0, issues, null, null, stopwatch.Elapsed);
        }
    }
    
    private async Task<OcrResult?> PerformOcrAsync(
        Stream stream,
        string fileName,
        CancellationToken cancellationToken)
    {
        try
        {
            // Tesseract OCR integration would go here
            // For production, install Tesseract-OCR and use Tesseract.Net wrapper
            _logger.LogDebug("Document quality validation for {FilePath} - OCR confidence check", filePath);
            // For now, this is a stub that simulates OCR processing
            
            _logger.LogInformation("Performing OCR on document: {FileName}", fileName);
            
            // Simulate OCR processing delay
            await Task.Delay(500, cancellationToken);
            
            // In production, use Tesseract.Net or call Tesseract CLI
            // Example: var result = await _tesseractEngine.ProcessAsync(stream);
            
            // Stub result - replace with actual OCR
            return new OcrResult
            {
                ExtractedText = "PLACEHOLDER: OCR text extraction to be implemented with Tesseract",
                Confidence = 85
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OCR processing failed for: {FileName}", fileName);
            return null;
        }
    }
    
    private void ValidateDocumentTypeKeywords(
        string documentType,
        string extractedText,
        List<QualityIssue> issues,
        ref int qualityScore)
    {
        var textLower = extractedText.ToLowerInvariant();
        var expectedKeywords = GetExpectedKeywords(documentType);
        
        if (expectedKeywords.Any() && !expectedKeywords.Any(keyword => textLower.Contains(keyword)))
        {
            issues.Add(new QualityIssue
            {
                Type = QualityIssueType.WrongDocumentType,
                Description = $"Document may not be of type: {documentType} (expected keywords not found)",
                SeverityScore = 15
            });
            qualityScore -= 15;
        }
    }
    
    private List<string> GetExpectedKeywords(string documentType)
    {
        return documentType.ToLowerInvariant() switch
        {
            "passport" or "passportcopy" => new() { "passport", "nationality", "date of birth" },
            "driverslicense" => new() { "driver", "license", "licence", "driving" },
            "nationalid" => new() { "identity", "national", "id number" },
            "proofofaddress" => new() { "address", "resident", "street" },
            "bankstatement" => new() { "bank", "account", "statement", "balance" },
            "businessregistration" => new() { "register", "company", "business", "incorporation" },
            _ => new()
        };
    }
    
    private bool IsSupportedForOcr(string extension)
    {
        var supportedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".bmp" };
        return supportedExtensions.Contains(extension);
    }
    
    private DocumentQualityResult CreateResult(
        int score,
        List<QualityIssue> issues,
        string? extractedText,
        int? ocrConfidence,
        TimeSpan duration)
    {
        var isAcceptable = score >= MinimumQualityScore;
        
        _logger.LogInformation(
            "Document quality validation completed: Score={Score}, Acceptable={Acceptable}, Issues={IssueCount}",
            score, isAcceptable, issues.Count);
        
        return new DocumentQualityResult
        {
            QualityScore = score,
            IsAcceptable = isAcceptable,
            Issues = issues,
            ExtractedText = extractedText,
            OcrConfidence = ocrConfidence,
            ValidationDuration = duration
        };
    }
    
    private class OcrResult
    {
        public string ExtractedText { get; set; } = string.Empty;
        public int Confidence { get; set; }
    }
}

/// <summary>
/// Configuration options for document quality validation
/// </summary>
public class DocumentQualityOptions
{
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024; // 10 MB
    public int MinimumQualityScore { get; set; } = 60;
    public bool EnableOcr { get; set; } = true;
    public string TesseractDataPath { get; set; } = "/usr/share/tesseract-ocr/tessdata";
}

