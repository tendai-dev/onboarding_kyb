using System.Diagnostics;
using System.Net.Sockets;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DocumentService.Infrastructure.AntiVirus;

/// <summary>
/// ClamAV client implementation using clamd socket protocol
/// </summary>
public class ClamAvClient : IClamAvClient
{
    private readonly ClamAvOptions _options;
    private readonly ILogger<ClamAvClient> _logger;
    
    // ClamAV protocol constants
    private const string PingCommand = "PING";
    private const string InstreamCommand = "zINSTREAM\0";
    private const string OkResponse = "OK";
    private const string PongResponse = "PONG";
    private const int ChunkSize = 4096;
    
    public ClamAvClient(IOptions<ClamAvOptions> options, ILogger<ClamAvClient> logger)
    {
        _options = options.Value;
        _logger = logger;
    }
    
    public async Task<ScanResult> ScanAsync(
        Stream stream, 
        string fileName, 
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            _logger.LogInformation(
                "Starting virus scan for file: {FileName} (Size: {Size} bytes)",
                fileName, stream.Length);
            
            using var client = new TcpClient();
            await client.ConnectAsync(_options.Host, _options.Port, cancellationToken);
            
            using var networkStream = client.GetStream();
            
            // Send INSTREAM command
            var command = Encoding.ASCII.GetBytes(InstreamCommand);
            await networkStream.WriteAsync(command, cancellationToken);
            
            // Stream file in chunks
            var buffer = new byte[ChunkSize];
            int bytesRead;
            
            stream.Position = 0; // Reset stream to beginning
            
            while ((bytesRead = await stream.ReadAsync(buffer, cancellationToken)) > 0)
            {
                // Send chunk size (4 bytes, network byte order)
                var sizeBytes = BitConverter.GetBytes(bytesRead);
                if (BitConverter.IsLittleEndian)
                    Array.Reverse(sizeBytes);
                    
                await networkStream.WriteAsync(sizeBytes, cancellationToken);
                
                // Send chunk data
                await networkStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
            }
            
            // Send zero-length chunk to signal end
            await networkStream.WriteAsync(new byte[4], cancellationToken);
            await networkStream.FlushAsync(cancellationToken);
            
            // Read response
            var responseBuffer = new byte[1024];
            var responseBytesRead = await networkStream.ReadAsync(responseBuffer, cancellationToken);
            var response = Encoding.ASCII.GetString(responseBuffer, 0, responseBytesRead).Trim();
            
            stopwatch.Stop();
            
            // Parse response
            // Format: "stream: OK" or "stream: Eicar-Test-Signature FOUND"
            if (response.Contains(OkResponse, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation(
                    "Virus scan completed: {FileName} is CLEAN (Duration: {Duration}ms)",
                    fileName, stopwatch.ElapsedMilliseconds);
                    
                return ScanResult.Clean(stopwatch.Elapsed);
            }
            else if (response.Contains("FOUND", StringComparison.OrdinalIgnoreCase))
            {
                // Extract virus name from response
                var virusName = ExtractVirusName(response);
                
                _logger.LogWarning(
                    "Virus detected in file: {FileName}, Virus: {VirusName}, Response: {Response}",
                    fileName, virusName, response);
                    
                return ScanResult.Infected(virusName, response, stopwatch.Elapsed);
            }
            else
            {
                _logger.LogError(
                    "Unexpected ClamAV response for file: {FileName}, Response: {Response}",
                    fileName, response);
                    
                throw new ClamAvException($"Unexpected ClamAV response: {response}");
            }
        }
        catch (Exception ex) when (ex is not ClamAvException)
        {
            stopwatch.Stop();
            _logger.LogError(ex, 
                "Error scanning file: {FileName} with ClamAV", fileName);
            throw new ClamAvException($"Virus scan failed for {fileName}", ex);
        }
    }
    
    public async Task<bool> PingAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new TcpClient();
            
            // Use shorter timeout for health checks
            var connectTask = client.ConnectAsync(_options.Host, _options.Port, cancellationToken).AsTask();
            var timeoutTask = Task.Delay(_options.PingTimeoutMs, cancellationToken);
            
            if (await Task.WhenAny(connectTask, timeoutTask) == timeoutTask)
            {
                _logger.LogWarning("ClamAV ping timeout after {Timeout}ms", _options.PingTimeoutMs);
                return false;
            }
            
            using var networkStream = client.GetStream();
            
            // Send PING command
            var command = Encoding.ASCII.GetBytes($"z{PingCommand}\0");
            await networkStream.WriteAsync(command, cancellationToken);
            await networkStream.FlushAsync(cancellationToken);
            
            // Read response
            var buffer = new byte[256];
            var bytesRead = await networkStream.ReadAsync(buffer, cancellationToken);
            var response = Encoding.ASCII.GetString(buffer, 0, bytesRead).Trim();
            
            var isHealthy = response.Contains(PongResponse, StringComparison.OrdinalIgnoreCase);
            
            if (isHealthy)
            {
                _logger.LogDebug("ClamAV is healthy: {Response}", response);
            }
            else
            {
                _logger.LogWarning("ClamAV responded but not with PONG: {Response}", response);
            }
            
            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ClamAV ping failed");
            return false;
        }
    }
    
    private string ExtractVirusName(string response)
    {
        // Response format: "stream: Eicar-Test-Signature FOUND"
        var parts = response.Split(':');
        if (parts.Length < 2) return "Unknown";
        
        var virusPart = parts[1].Replace("FOUND", "").Trim();
        return virusPart;
    }
}

/// <summary>
/// Configuration options for ClamAV client
/// </summary>
public class ClamAvOptions
{
    public string Host { get; set; } = "clamav";
    public int Port { get; set; } = 3310;
    public int PingTimeoutMs { get; set; } = 5000;
    public int ScanTimeoutMs { get; set; } = 60000;
}

/// <summary>
/// Exception thrown when ClamAV operations fail
/// </summary>
public class ClamAvException : Exception
{
    public ClamAvException(string message) : base(message) { }
    public ClamAvException(string message, Exception innerException) : base(message, innerException) { }
}

