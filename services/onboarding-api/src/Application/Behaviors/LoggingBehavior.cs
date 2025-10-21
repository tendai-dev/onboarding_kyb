using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace OnboardingApi.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior for logging and performance monitoring
/// </summary>
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        
        _logger.LogInformation(
            "Handling {RequestName}",
            requestName);

        var sw = Stopwatch.StartNew();
        
        try
        {
            var response = await next();
            
            sw.Stop();
            
            _logger.LogInformation(
                "Handled {RequestName} in {ElapsedMs}ms",
                requestName,
                sw.ElapsedMilliseconds);

            // Alert on slow requests
            if (sw.ElapsedMilliseconds > 500)
            {
                _logger.LogWarning(
                    "Slow request detected: {RequestName} took {ElapsedMs}ms",
                    requestName,
                    sw.ElapsedMilliseconds);
            }

            return response;
        }
        catch (Exception ex)
        {
            sw.Stop();
            
            _logger.LogError(
                ex,
                "Error handling {RequestName} after {ElapsedMs}ms",
                requestName,
                sw.ElapsedMilliseconds);
            
            throw;
        }
    }
}

