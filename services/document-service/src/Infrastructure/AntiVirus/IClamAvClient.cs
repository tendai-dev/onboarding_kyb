namespace DocumentService.Infrastructure.AntiVirus;

/// <summary>
/// Interface for ClamAV virus scanning client
/// </summary>
public interface IClamAvClient
{
    /// <summary>
    /// Scan a file stream for viruses
    /// </summary>
    /// <param name="stream">File stream to scan</param>
    /// <param name="fileName">Original file name for logging</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Scan result with virus detection status</returns>
    Task<ScanResult> ScanAsync(Stream stream, string fileName, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Check if ClamAV service is available and responsive
    /// </summary>
    Task<bool> PingAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of a virus scan operation
/// </summary>
public record ScanResult
{
    public bool IsClean { get; init; }
    public string? VirusName { get; init; }
    public string? RawResponse { get; init; }
    public TimeSpan ScanDuration { get; init; }
    
    public static ScanResult Clean(TimeSpan duration) => new()
    {
        IsClean = true,
        ScanDuration = duration
    };
    
    public static ScanResult Infected(string virusName, string rawResponse, TimeSpan duration) => new()
    {
        IsClean = false,
        VirusName = virusName,
        RawResponse = rawResponse,
        ScanDuration = duration
    };
}

