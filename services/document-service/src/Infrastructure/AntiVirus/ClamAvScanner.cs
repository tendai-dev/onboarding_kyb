using Microsoft.Extensions.Logging;
using System.Net.Sockets;
using System.Text;

namespace DocumentService.Infrastructure.AntiVirus;

/// <summary>
/// ClamAV antivirus scanner integration
/// Scans files via ClamAV daemon (clamd) using TCP socket
/// </summary>
public interface IVirusScanner
{
    Task<VirusScanResult> ScanAsync(Stream fileStream, CancellationToken cancellationToken = default);
    Task<bool> PingAsync(CancellationToken cancellationToken = default);
}

public class ClamAvScanner : IVirusScanner
{
    private readonly string _host;
    private readonly int _port;
    private readonly ILogger<ClamAvScanner> _logger;
    private const int ChunkSize = 8192;

    public ClamAvScanner(ILogger<ClamAvScanner> logger, string host = "clamav", int port = 3310)
    {
        _host = host;
        _port = port;
        _logger = logger;
    }

    public async Task<VirusScanResult> ScanAsync(Stream fileStream, CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(_host, _port, cancellationToken);

            using var networkStream = client.GetStream();

            // Send INSTREAM command
            var command = Encoding.ASCII.GetBytes("zINSTREAM\0");
            await networkStream.WriteAsync(command, cancellationToken);

            // Stream file data in chunks
            var buffer = new byte[ChunkSize];
            int bytesRead;

            while ((bytesRead = await fileStream.ReadAsync(buffer, cancellationToken)) > 0)
            {
                // Send chunk size (4 bytes, big-endian)
                var sizeBytes = BitConverter.GetBytes(bytesRead);
                if (BitConverter.IsLittleEndian)
                {
                    Array.Reverse(sizeBytes);
                }
                await networkStream.WriteAsync(sizeBytes, cancellationToken);

                // Send chunk data
                await networkStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
            }

            // Send termination (zero-length chunk)
            await networkStream.WriteAsync(new byte[4], cancellationToken);

            // Read response
            var responseBuffer = new byte[1024];
            var responseLength = await networkStream.ReadAsync(responseBuffer, cancellationToken);
            var response = Encoding.ASCII.GetString(responseBuffer, 0, responseLength).Trim();

            _logger.LogInformation("ClamAV scan response: {Response}", response);

            // Parse response
            if (response.Contains("OK"))
            {
                return new VirusScanResult
                {
                    IsClean = true,
                    ScanCompletedAt = DateTime.UtcNow
                };
            }
            else if (response.Contains("FOUND"))
            {
                var virusName = ExtractVirusName(response);
                _logger.LogWarning("Virus detected: {VirusName}", virusName);

                return new VirusScanResult
                {
                    IsClean = false,
                    VirusName = virusName,
                    ScanCompletedAt = DateTime.UtcNow
                };
            }
            else
            {
                throw new Exception($"Unexpected ClamAV response: {response}");
            }
        }
        catch (SocketException ex)
        {
            _logger.LogError(ex, "Failed to connect to ClamAV at {Host}:{Port}", _host, _port);
            throw new VirusScanException("Virus scanner unavailable", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Virus scan failed");
            throw new VirusScanException("Virus scan failed", ex);
        }
    }

    public async Task<bool> PingAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(_host, _port, cancellationToken);

            using var networkStream = client.GetStream();

            // Send PING command
            var command = Encoding.ASCII.GetBytes("zPING\0");
            await networkStream.WriteAsync(command, cancellationToken);

            // Read response
            var buffer = new byte[256];
            var bytesRead = await networkStream.ReadAsync(buffer, cancellationToken);
            var response = Encoding.ASCII.GetString(buffer, 0, bytesRead).Trim();

            return response.Contains("PONG");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ClamAV ping failed");
            return false;
        }
    }

    private static string ExtractVirusName(string response)
    {
        // Response format: "stream: Eicar-Test-Signature FOUND"
        var parts = response.Split(':');
        if (parts.Length > 1)
        {
            var virusPart = parts[1].Replace("FOUND", "").Trim();
            return virusPart;
        }
        return "Unknown";
    }
}

public class VirusScanResult
{
    public bool IsClean { get; set; }
    public string? VirusName { get; set; }
    public DateTime ScanCompletedAt { get; set; }
}

public class VirusScanException : Exception
{
    public VirusScanException(string message) : base(message) { }
    public VirusScanException(string message, Exception innerException) : base(message, innerException) { }
}

