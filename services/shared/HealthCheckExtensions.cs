using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Npgsql;
using StackExchange.Redis;
using System.Text.Json;
using System.Threading.Tasks;

namespace Shared.HealthChecks
{
    public static class HealthCheckExtensions
    {
        public static IServiceCollection AddCustomHealthChecks(
            this IServiceCollection services, 
            IConfiguration configuration,
            bool includePostgres = true,
            bool includeRedis = false,
            bool includeKafka = false,
            bool includeMinIO = false,
            bool includeKeycloak = false)
        {
            var hcBuilder = services.AddHealthChecks();

            // Add PostgreSQL health check
            if (includePostgres)
            {
                var connectionString = configuration.GetConnectionString("PostgreSQL") 
                    ?? configuration.GetConnectionString("DefaultConnection");
                    
                if (!string.IsNullOrEmpty(connectionString))
                {
                    hcBuilder.AddNpgSql(
                        connectionString,
                        name: "postgres",
                        tags: new[] { "db", "sql", "postgres" });
                }
            }

            // Add Redis health check
            if (includeRedis)
            {
                var redisConnection = configuration.GetConnectionString("Redis");
                if (!string.IsNullOrEmpty(redisConnection))
                {
                    hcBuilder.AddRedis(
                        redisConnection,
                        name: "redis",
                        tags: new[] { "cache", "redis" });
                }
            }

            // Add Kafka health check
            if (includeKafka)
            {
                var kafkaConfig = configuration.GetSection("Kafka:BootstrapServers").Value;
                if (!string.IsNullOrEmpty(kafkaConfig))
                {
                    hcBuilder.AddKafka(
                        setup =>
                        {
                            setup.BootstrapServers = kafkaConfig;
                        },
                        name: "kafka",
                        tags: new[] { "messaging", "kafka" });
                }
            }

            // Add MinIO health check
            if (includeMinIO)
            {
                var minioEndpoint = configuration.GetSection("MinIO:Endpoint").Value;
                if (!string.IsNullOrEmpty(minioEndpoint))
                {
                    hcBuilder.AddTypeActivatedCheck<MinIOHealthCheck>(
                        "minio",
                        args: new object[] { configuration },
                        tags: new[] { "storage", "minio" });
                }
            }

            // Add Keycloak health check
            if (includeKeycloak)
            {
                var authority = configuration.GetSection("Keycloak:Authority").Value;
                if (!string.IsNullOrEmpty(authority))
                {
                    hcBuilder.AddUrlGroup(
                        new Uri($"{authority}/.well-known/openid-configuration"),
                        name: "keycloak",
                        tags: new[] { "auth", "keycloak" });
                }
            }

            return services;
        }

        public static IApplicationBuilder UseCustomHealthChecks(this IApplicationBuilder app)
        {
            app.UseHealthChecks("/health/live", new HealthCheckOptions
            {
                Predicate = _ => false, // Run no checks, just return 200 OK
                ResponseWriter = async (context, report) =>
                {
                    context.Response.ContentType = "application/json";
                    var response = new
                    {
                        status = "healthy",
                        timestamp = DateTime.UtcNow
                    };
                    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                }
            });

            app.UseHealthChecks("/health/ready", new HealthCheckOptions
            {
                ResponseWriter = async (context, report) =>
                {
                    context.Response.ContentType = "application/json";
                    context.Response.StatusCode = report.Status == HealthStatus.Healthy ? 200 : 503;

                    var response = new
                    {
                        status = report.Status.ToString(),
                        checks = report.Entries.Select(x => new
                        {
                            name = x.Key,
                            status = x.Value.Status.ToString(),
                            description = x.Value.Description,
                            duration = x.Value.Duration.TotalMilliseconds,
                            error = x.Value.Exception?.Message,
                            data = x.Value.Data
                        }),
                        totalDuration = report.TotalDuration.TotalMilliseconds,
                        timestamp = DateTime.UtcNow
                    };

                    await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
                    {
                        WriteIndented = true
                    }));
                }
            });

            return app;
        }
    }

    // Custom MinIO health check
    public class MinIOHealthCheck : IHealthCheck
    {
        private readonly IConfiguration _configuration;

        public MinIOHealthCheck(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var endpoint = _configuration.GetSection("MinIO:Endpoint").Value;
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(5);
                
                var response = await httpClient.GetAsync($"http://{endpoint}/minio/health/live", cancellationToken);
                
                if (response.IsSuccessStatusCode)
                {
                    return HealthCheckResult.Healthy("MinIO is reachable");
                }
                
                return HealthCheckResult.Unhealthy($"MinIO returned {response.StatusCode}");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("MinIO is not reachable", ex);
            }
        }
    }
}
