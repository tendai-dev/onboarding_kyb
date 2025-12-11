using AuthenticationService.Infrastructure.ExternalServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AuthenticationService.Presentation.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddKeycloakAdminClient(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient<KeycloakAdminClient>((serviceProvider, client) =>
        {
            var baseUrl = configuration["Keycloak:AdminUrl"] ?? "http://localhost:8080";
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }
}

