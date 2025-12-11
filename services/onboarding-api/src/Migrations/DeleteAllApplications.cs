using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Persistence;

namespace OnboardingApi.Migrations;

/// <summary>
/// Utility to delete all applications from the database
/// WARNING: This is a destructive operation that cannot be undone
/// 
/// Usage:
///   dotnet run --project services/onboarding-api/src/Migrations/OnboardingApi.Migrations.csproj -- delete-applications
/// </summary>
public class DeleteAllApplications
{
    public static async Task RunAsync(string[] args)
    {
        // Check for --force flag to skip confirmation
        var force = args.Contains("--force") || args.Contains("-f");
        
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
            .AddEnvironmentVariables()
            .AddCommandLine(args)
            .Build();

        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        var logger = loggerFactory.CreateLogger<DeleteAllApplications>();

        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? throw new InvalidOperationException("PostgreSQL connection string is required");

        // Ensure we're using TCP connection by explicitly using IP address
        if (connectionString.Contains("Host=localhost"))
        {
            connectionString = connectionString.Replace("Host=localhost", "Host=127.0.0.1");
        }

        logger.LogInformation("Delete All Applications Utility");
        logger.LogInformation("==============================");
        logger.LogInformation("Connection: {Connection}", connectionString.Replace("Password=", "Password=***"));
        logger.LogWarning("⚠️  WARNING: This will permanently delete ALL applications from the database!");
        logger.LogWarning("⚠️  This operation CANNOT be undone!");
        if (force)
        {
            logger.LogWarning("⚠️  FORCE MODE: Skipping confirmation prompt!");
        }
        logger.LogInformation("");

        try
        {
            var optionsBuilder = new DbContextOptionsBuilder<OnboardingDbContext>();
            optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null);
            });

            using var context = new OnboardingDbContext(optionsBuilder.Options);

            // Test connection
            try
            {
                await context.Database.ExecuteSqlRawAsync("SELECT 1");
                logger.LogInformation("✅ Database connection verified");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Cannot connect to database. Error: {Error}", ex.Message);
                Environment.Exit(1);
                return;
            }

            // Count applications
            var applicationCount = await context.Applications.CountAsync();
            logger.LogInformation("📊 Found {Count} application(s) in the database", applicationCount);

            if (applicationCount == 0)
            {
                logger.LogInformation("✅ No applications to delete. Exiting.");
                return;
            }

            // Show sample applications (first 5)
            logger.LogInformation("");
            logger.LogInformation("Sample applications (first 5):");
            var sampleApplications = await context.Applications
                .Take(5)
                .Select(a => new { a.Id, a.Email, a.ApplicantName, a.UserId })
                .ToListAsync();

            foreach (var app in sampleApplications)
            {
                logger.LogInformation("  - ID: {Id}, Email: {Email}, Name: {Name}, UserId: {UserId}",
                    app.Id, app.Email, app.ApplicantName, app.UserId);
            }

            if (applicationCount > 5)
            {
                logger.LogInformation("  ... and {Count} more", applicationCount - 5);
            }

            // Confirm deletion (unless force mode)
            if (!force)
            {
                logger.LogInformation("");
                logger.LogWarning("⚠️  Are you sure you want to delete ALL {Count} application(s)?", applicationCount);
                logger.LogWarning("⚠️  Type 'DELETE ALL' (in uppercase) to confirm:");
                
                var confirmation = Console.ReadLine();
                
                if (confirmation != "DELETE ALL")
                {
                    logger.LogInformation("❌ Deletion cancelled. No applications were deleted.");
                    return;
                }
            }
            else
            {
                logger.LogInformation("");
                logger.LogWarning("⚠️  FORCE MODE: Proceeding with deletion of {Count} application(s) without confirmation", applicationCount);
            }

            // Delete all applications
            logger.LogInformation("");
            logger.LogInformation("🗑️  Deleting all applications...");
            
            var deletedCount = await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM onboarding.\"Applications\"");
            
            logger.LogInformation("✅ Successfully deleted {Count} application(s)", deletedCount);
            logger.LogInformation("");
            logger.LogInformation("✅ Operation completed successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Error deleting applications: {Error}", ex.Message);
            throw;
        }
    }
}

