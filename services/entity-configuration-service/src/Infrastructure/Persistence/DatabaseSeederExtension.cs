using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EntityConfigurationService.Infrastructure.Persistence;

public static class DatabaseSeederExtension
{
    public static async Task<IApplicationBuilder> SeedDatabaseAsync(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<EntityConfigurationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<EntityConfigurationDbContext>>();

        try
        {
            // Apply migrations
            logger.LogInformation("Applying database migrations...");
            await context.Database.MigrateAsync();
            logger.LogInformation("Migrations applied successfully");

            // Seed data
            await SeedData.SeedAsync(context, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }

        return app;
    }
}

