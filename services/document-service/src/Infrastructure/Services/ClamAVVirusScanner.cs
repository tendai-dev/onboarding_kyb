using DocumentService.Application.Commands;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Sockets;

namespace DocumentService.Infrastructure.Services;

public class ClamAVVirusScanner : IVirusScanner
{
    private readonly ClamAVOptions _options;
    private readonly ILogger<ClamAVVirusScanner> _logger;

    public ClamAVVirusScanner(IOptions<ClamAVOptions> options, ILogger<ClamAVVirusScanner> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<VirusScanResult> ScanAsync(Stream fileStream, CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(_options.Host, _options.Port, cancellationToken);
            
            using var stream = client.GetStream();
            
            // Send INSTREAM command
            var command = "nINSTREAM\n";
            var commandBytes = System.Text.Encoding.ASCII.GetBytes(command);
            await stream.WriteAsync(commandBytes, 0, commandBytes.Length, cancellationToken);
            
            // Send file data
            var buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = await fileStream.ReadAsync(buffer, 0, buffer.Length, cancellationToken)) > 0)
            {
                var sizeBytes = BitConverter.GetBytes((uint)bytesRead);
                if (BitConverter.IsLittleEndian)
                    Array.Reverse(sizeBytes);
                
                await stream.WriteAsync(sizeBytes, 0, sizeBytes.Length, cancellationToken);
                await stream.WriteAsync(buffer, 0, bytesRead, cancellationToken);
            }
            
            // Send zero-length chunk to indicate end
            var zeroBytes = new byte[] { 0, 0, 0, 0 };
            await stream.WriteAsync(zeroBytes, 0, zeroBytes.Length, cancellationToken);
            
            // Read response
            var responseBuffer = new byte[1024];
            var responseLength = await stream.ReadAsync(responseBuffer, 0, responseBuffer.Length, cancellationToken);
            var response = System.Text.Encoding.ASCII.GetString(responseBuffer, 0, responseLength);
            
            if (response.Contains("OK"))
            {
                return new VirusScanResult
                {
                    IsClean = true,
                    VirusName = null,
                    ScanCompletedAt = DateTime.UtcNow
                };
            }
            else if (response.Contains("FOUND"))
            {
                var virusName = ExtractVirusName(response);
                return new VirusScanResult
                {
                    IsClean = false,
                    VirusName = virusName,
                    ScanCompletedAt = DateTime.UtcNow
                };
            }
            else
            {
                _logger.LogWarning("Unexpected ClamAV response: {Response}", response);
                return new VirusScanResult
                {
                    IsClean = false,
                    VirusName = "Unknown threat",
                    ScanCompletedAt = DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Virus scan failed");
            return new VirusScanResult
            {
                IsClean = false,
                VirusName = "Scan error",
                ScanCompletedAt = DateTime.UtcNow
            };
        }
    }

    private static string ExtractVirusName(string response)
    {
        var parts = response.Split(' ');
        return parts.Length > 1 ? parts[1] : "Unknown virus";
    }
}

public class ClamAVOptions
{
    public string Host { get; set; } = "clamav";
    public int Port { get; set; } = 3310;
    public int PingTimeoutMs { get; set; } = 5000;
    public int ScanTimeoutMs { get; set; } = 60000;
}
