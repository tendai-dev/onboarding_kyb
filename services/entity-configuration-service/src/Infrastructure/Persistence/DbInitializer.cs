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
            
            logger.LogInformation("Initializing database...");
            
            // Verify we can connect to the database
            var canConnect = await context.Database.CanConnectAsync();
            if (!canConnect)
            {
                logger.LogWarning("Cannot connect to database. Initialization will be skipped.");
                return;
            }
            
            // Use EnsureCreatedAsync which will create all tables defined in DbContext
            // Note: This is safe - it only creates missing tables and won't drop existing ones
            logger.LogInformation("Ensuring database schema exists...");
            await context.Database.EnsureCreatedAsync();
            logger.LogInformation("Database schema ensured.");
            
            // Always attempt seeding - the seeder will check if data already exists
            logger.LogInformation("Seeding database...");
            try
            {
                await EntityConfigurationSeeder.SeedAsync(context);
                logger.LogInformation("Database seeding completed successfully.");
            }
            catch (Exception seedEx)
            {
                logger.LogError(seedEx, "Error during database seeding, but continuing startup.");
                // Don't throw - allow service to start even if seeding fails
            }
            
            logger.LogInformation("Database initialization completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing the database");
            // Don't throw - allow service to start even if initialization fails
            // The database might be accessible later
        }
    }
}
