using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EntityConfigurationService.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(IHost app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<EntityConfigurationDbContext>>();

        try
        {
            var context = services.GetRequiredService<EntityConfigurationDbContext>();
            
            logger.LogInformation("Applying database migrations...");
            await context.Database.MigrateAsync();
            
            logger.LogInformation("Seeding database...");
            await EntityConfigurationSeeder.SeedAsync(context);
            
            logger.LogInformation("Database initialization completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing the database");
            throw;
        }
    }
}

