using DocumentService.Application.Interfaces;
using DocumentService.Infrastructure.AntiVirus;
using DocumentService.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DocumentService.Presentation.Configuration;

/// <summary>
/// Extension methods for configuring document validation services
/// </summary>
public static class DocumentValidationConfiguration
{
    public static IServiceCollection AddDocumentValidation(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure ClamAV options
        services.Configure<ClamAvOptions>(configuration.GetSection("ClamAv"));
        
        // Configure document quality options
        services.Configure<DocumentQualityOptions>(configuration.GetSection("DocumentQuality"));
        
        // Register services
        services.AddScoped<IClamAvClient, ClamAvClient>();
        services.AddScoped<IDocumentQualityValidator, TesseractDocumentQualityValidator>();
        services.AddScoped<IDocumentValidationService, DocumentValidationService>();
        
        // Add health check for ClamAV
        services.AddHealthChecks()
            .AddCheck<ClamAvHealthCheck>("clamav");
        
        return services;
    }
}

