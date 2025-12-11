using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Persistence.Projections;

namespace OnboardingApi.Migrations;

/// <summary>
/// Utility to delete all onboarding cases from the database
/// WARNING: This is a destructive operation that cannot be undone
/// 
/// Usage:
///   dotnet run --project services/onboarding-api/src/Migrations/OnboardingApi.Migrations.csproj -- delete-cases
/// </summary>
public class DeleteAllCases
{
    public static async Task RunAsync(string[] args)
    {
        // Check for --force flag to skip confirmation
        var force = args.Contains("--force") || args.Contains("-f");
        // Check if we should also delete projections
        var includeProjections = args.Contains("--include-projections");
        
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
            .AddEnvironmentVariables()
            .AddCommandLine(args)
            .Build();

        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        var logger = loggerFactory.CreateLogger<DeleteAllCases>();

        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? throw new InvalidOperationException("PostgreSQL connection string is required");

        // Ensure we're using TCP connection by explicitly using IP address
        if (connectionString.Contains("Host=localhost"))
        {
            connectionString = connectionString.Replace("Host=localhost", "Host=127.0.0.1");
        }

        logger.LogInformation("Delete All Onboarding Cases Utility");
        logger.LogInformation("==================================");
        logger.LogInformation("Connection: {Connection}", connectionString.Replace("Password=", "Password=***"));
        logger.LogWarning("⚠️  WARNING: This will permanently delete ALL onboarding cases from the database!");
        logger.LogWarning("⚠️  This operation CANNOT be undone!");
        if (force)
        {
            logger.LogWarning("⚠️  FORCE MODE: Skipping confirmation prompt!");
        }
        if (includeProjections)
        {
            logger.LogWarning("⚠️  Will also delete case projections!");
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

            // Count cases
            var caseCount = await context.OnboardingCases.CountAsync();
            logger.LogInformation("📊 Found {Count} onboarding case(s) in the database", caseCount);

            // Count projections if requested
            int projectionCount = 0;
            if (includeProjections)
            {
                var projectionOptionsBuilder = new DbContextOptionsBuilder<ProjectionsDbContext>();
                projectionOptionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorCodesToAdd: null);
                    npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "projections");
                });

                using var projectionContext = new ProjectionsDbContext(projectionOptionsBuilder.Options);
                projectionCount = await projectionContext.OnboardingCases.CountAsync();
                logger.LogInformation("📊 Found {Count} case projection(s) in the database", projectionCount);
            }

            if (caseCount == 0 && projectionCount == 0)
            {
                logger.LogInformation("✅ No cases to delete. Exiting.");
                return;
            }

            // Show sample cases (first 5)
            if (caseCount > 0)
            {
                logger.LogInformation("");
                logger.LogInformation("Sample cases (first 5):");
                var sampleCases = await context.OnboardingCases
                    .Take(5)
                    .Select(c => new { c.Id, c.CaseNumber, c.Status, c.PartnerId })
                    .ToListAsync();

                foreach (var caseItem in sampleCases)
                {
                    logger.LogInformation("  - ID: {Id}, Case Number: {CaseNumber}, Status: {Status}, PartnerId: {PartnerId}",
                        caseItem.Id, caseItem.CaseNumber, caseItem.Status, caseItem.PartnerId);
                }

                if (caseCount > 5)
                {
                    logger.LogInformation("  ... and {Count} more", caseCount - 5);
                }
            }

            // Confirm deletion (unless force mode)
            if (!force)
            {
                logger.LogInformation("");
                logger.LogWarning("⚠️  Are you sure you want to delete ALL {Count} case(s)?", caseCount);
                if (includeProjections && projectionCount > 0)
                {
                    logger.LogWarning("⚠️  This will also delete {Count} projection(s)!", projectionCount);
                }
                logger.LogWarning("⚠️  Type 'DELETE ALL' (in uppercase) to confirm:");
                
                var confirmation = Console.ReadLine();
                
                if (confirmation != "DELETE ALL")
                {
                    logger.LogInformation("❌ Deletion cancelled. No cases were deleted.");
                    return;
                }
            }
            else
            {
                logger.LogInformation("");
                logger.LogWarning("⚠️  FORCE MODE: Proceeding with deletion of {Count} case(s) without confirmation", caseCount);
                if (includeProjections && projectionCount > 0)
                {
                    logger.LogWarning("⚠️  Will also delete {Count} projection(s)", projectionCount);
                }
            }

            // Delete projections first if requested
            if (includeProjections && projectionCount > 0)
            {
                logger.LogInformation("");
                logger.LogInformation("🗑️  Deleting case projections...");
                
                var projectionOptionsBuilder = new DbContextOptionsBuilder<ProjectionsDbContext>();
                projectionOptionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorCodesToAdd: null);
                    npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "projections");
                });

                using var projectionContext = new ProjectionsDbContext(projectionOptionsBuilder.Options);
                var deletedProjections = await projectionContext.Database.ExecuteSqlRawAsync(
                    "DELETE FROM projections.onboarding_case_projections");
                
                logger.LogInformation("✅ Successfully deleted {Count} projection(s)", deletedProjections);
            }

            // Delete all cases
            logger.LogInformation("");
            logger.LogInformation("🗑️  Deleting all onboarding cases...");
            
            var deletedCount = await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM onboarding.onboarding_cases");
            
            logger.LogInformation("✅ Successfully deleted {Count} case(s)", deletedCount);
            logger.LogInformation("");
            logger.LogInformation("✅ Operation completed successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Error deleting cases: {Error}", ex.Message);
            throw;
        }
    }
}

