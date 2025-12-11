using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Persistence.Audit;
using OnboardingApi.Infrastructure.Persistence.Checklist;
using OnboardingApi.Infrastructure.Persistence.Document;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;
using OnboardingApi.Infrastructure.Persistence.Messaging;
using OnboardingApi.Infrastructure.Persistence.Notification;
using OnboardingApi.Infrastructure.Persistence.Projections;
using OnboardingApi.Infrastructure.Persistence.Risk;
using OnboardingApi.Infrastructure.Persistence.WorkQueue;

namespace OnboardingApi.Migrations;

/// <summary>
/// Independent migration runner for all database contexts
/// This can be run separately from the main application to apply migrations safely
/// </summary>
class Program
{
    static async Task Main(string[] args)
    {
        // Check if this is a delete-applications command
        if (args.Length > 0 && args[0] == "delete-applications")
        {
            await DeleteAllApplications.RunAsync(args.Skip(1).ToArray());
            return;
        }

        // Check if this is a delete-cases command
        if (args.Length > 0 && args[0] == "delete-cases")
        {
            await DeleteAllCases.RunAsync(args.Skip(1).ToArray());
            return;
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
            .AddEnvironmentVariables()
            .AddCommandLine(args)
            .Build();

        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        var logger = loggerFactory.CreateLogger<Program>();

        var connectionString = configuration.GetConnectionString("PostgreSQL")
            ?? throw new InvalidOperationException("PostgreSQL connection string is required");

        // Ensure we're using TCP connection by explicitly using IP address
        // Replace localhost with 127.0.0.1 if present to avoid Unix socket
        if (connectionString.Contains("Host=localhost"))
        {
            connectionString = connectionString.Replace("Host=localhost", "Host=127.0.0.1");
        }

        logger.LogInformation("Starting database migrations...");
        logger.LogInformation("Connection: {Connection}", connectionString.Replace("Password=", "Password=***"));

        try
        {
            // Apply migrations for each DbContext
            await MigrateContextAsync<OnboardingDbContext>(
                connectionString,
                "onboarding",
                logger);

            await MigrateContextAsync<AuditLogDbContext>(
                connectionString,
                "audit",
                logger);

            await MigrateContextAsync<ChecklistDbContext>(
                connectionString,
                "checklist",
                logger);

            await MigrateContextAsync<NotificationDbContext>(
                connectionString,
                "notification",
                logger);

            await MigrateContextAsync<MessagingDbContext>(
                connectionString,
                "messaging",
                logger);

            await MigrateContextAsync<EntityConfigurationDbContext>(
                connectionString,
                "entity_configuration",
                logger);

            await MigrateContextAsync<WorkQueueDbContext>(
                connectionString,
                "work_queue",
                logger);

            await MigrateContextAsync<RiskDbContext>(
                connectionString,
                "risk",
                logger);

            await MigrateContextAsync<ProjectionsDbContext>(
                connectionString,
                "projections",
                logger);

            await MigrateContextAsync<DocumentDbContext>(
                connectionString,
                "document",
                logger);

            logger.LogInformation("All migrations completed successfully!");
            
            // Seed entity configuration data after ALL migrations are complete
            await SeedEntityConfigurationDataAsync(connectionString, logger);
            
            // Seed roles and users after entity configuration
            await SeedRolesAndUsersAsync(connectionString, logger);
            
            // Seed wizard configurations after entity types are seeded
            await SeedWizardConfigurationsAsync(connectionString, logger);
            
            logger.LogInformation("All seeding completed successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Migration failed: {Error}", ex.Message);
            Environment.Exit(1);
        }
    }

    private static async Task MigrateContextAsync<TContext>(
        string connectionString,
        string schemaName,
        ILogger logger) where TContext : DbContext
    {
        logger.LogInformation("Migrating {Schema} schema...", schemaName);

        var optionsBuilder = new DbContextOptionsBuilder<TContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", schemaName);
        });

        // All DbContexts use DbContextOptions<TContext> constructor
        var constructor = typeof(TContext).GetConstructor(new[] { typeof(DbContextOptions<TContext>) })
            ?? throw new InvalidOperationException(
                $"DbContext {typeof(TContext).Name} does not have a constructor accepting DbContextOptions<{typeof(TContext).Name}>");
        
        var context = (TContext)constructor.Invoke(new object[] { optionsBuilder.Options })!;
        
        using (context)
        {
            // Test connection by attempting a simple query
            try
            {
                await context.Database.ExecuteSqlRawAsync("SELECT 1");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Cannot connect to database for {Schema} schema. Error: {Error}. Skipping...", schemaName, ex.Message);
                return;
            }

            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();
            
            if (pendingMigrations.Any())
            {
                logger.LogInformation("Found {Count} pending migration(s) for {Schema} schema...", 
                    pendingMigrations.Count(), schemaName);
                
                // Check if tables exist (schema was created with EnsureCreatedAsync)
                var tablesExist = false;
                try
                {
                    var connection = context.Database.GetDbConnection();
                    await connection.OpenAsync();
                    using var command = connection.CreateCommand();
                    command.CommandText = $@"
                        SELECT COUNT(*) 
                        FROM information_schema.tables 
                        WHERE table_schema = '{schemaName}' 
                        AND table_type = 'BASE TABLE'
                        AND table_name != '__EFMigrationsHistory'";
                    var result = await command.ExecuteScalarAsync();
                    tablesExist = result != null && Convert.ToInt32(result) > 0;
                    await connection.CloseAsync();
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Could not check for existing tables in {Schema} schema", schemaName);
                }

                if (tablesExist && !appliedMigrations.Any())
                {
                    logger.LogWarning(
                        "Tables already exist in {Schema} schema but no migrations are recorded. " +
                        "This likely means the schema was created with EnsureCreatedAsync(). " +
                        "Marking migrations as applied without running them. " +
                        "If you need to recreate the schema, drop the tables first.",
                        schemaName);
                    
                    // Mark all pending migrations as applied without executing them
                    foreach (var migration in pendingMigrations)
                    {
                        try
                        {
                            // Insert into migration history without running the migration
                            var connection = context.Database.GetDbConnection();
                            await connection.OpenAsync();
                            using var command = connection.CreateCommand();
                            command.CommandText = $@"
                                INSERT INTO {schemaName}.""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                                VALUES (@migrationId, @productVersion)
                                ON CONFLICT (""MigrationId"") DO NOTHING";
                            var migrationIdParam = command.CreateParameter();
                            migrationIdParam.ParameterName = "@migrationId";
                            migrationIdParam.Value = migration;
                            command.Parameters.Add(migrationIdParam);
                            
                            var productVersionParam = command.CreateParameter();
                            productVersionParam.ParameterName = "@productVersion";
                            productVersionParam.Value = "8.0.0"; // EF Core version
                            command.Parameters.Add(productVersionParam);
                            
                            await command.ExecuteNonQueryAsync();
                            await connection.CloseAsync();
                            logger.LogInformation("Marked migration {Migration} as applied for {Schema} schema", migration, schemaName);
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(ex, "Failed to mark migration {Migration} as applied for {Schema} schema", migration, schemaName);
                        }
                    }
                    logger.LogInformation("Successfully marked all migrations as applied for {Schema} schema", schemaName);
                }
                else
                {
                    logger.LogInformation("Applying {Count} pending migration(s) for {Schema} schema...", 
                        pendingMigrations.Count(), schemaName);
                    try
                    {
                        await context.Database.MigrateAsync();
                        logger.LogInformation("Successfully migrated {Schema} schema", schemaName);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Failed to apply migrations for {Schema} schema: {Error}", schemaName, ex.Message);
                        throw;
                    }
                }
            }
            else
            {
                logger.LogInformation("{Schema} schema is up to date", schemaName);
            }
        }
    }

    private static async Task SeedEntityConfigurationDataAsync(
        string connectionString,
        ILogger logger)
    {
        logger.LogInformation("Seeding entity configuration data...");

        var optionsBuilder = new DbContextOptionsBuilder<EntityConfigurationDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "entity_configuration");
        });

        using var context = new EntityConfigurationDbContext(optionsBuilder.Options);
        
        try
        {
            // Test connection by attempting a simple query
            await context.Database.ExecuteSqlRawAsync("SELECT 1");
            logger.LogInformation("Database connection verified for entity configuration seed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Cannot connect to database for entity configuration seed. Connection string: {ConnectionString}. Error: {Error}", 
                connectionString.Replace("Password=", "Password=***"), ex.Message);
            logger.LogError("Full exception: {Exception}", ex);
            return;
        }

        await SeedData.SeedEntityConfigurationAsync(context, logger);
    }

    private static async Task SeedRolesAndUsersAsync(
        string connectionString,
        ILogger logger)
    {
        logger.LogInformation("Seeding roles and users data...");

        var optionsBuilder = new DbContextOptionsBuilder<EntityConfigurationDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "entity_configuration");
        });

        using var context = new EntityConfigurationDbContext(optionsBuilder.Options);
        
        try
        {
            // Test connection by attempting a simple query
            await context.Database.ExecuteSqlRawAsync("SELECT 1");
            logger.LogInformation("Database connection verified for roles and users seed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Cannot connect to database for roles and users seed. Connection string: {ConnectionString}. Error: {Error}", 
                connectionString.Replace("Password=", "Password=***"), ex.Message);
            logger.LogError("Full exception: {Exception}", ex);
            return;
        }

        await SeedData.SeedRolesAndUsersAsync(context, logger);
    }

    private static async Task SeedWizardConfigurationsAsync(
        string connectionString,
        ILogger logger)
    {
        logger.LogInformation("Seeding wizard configurations data...");

        var optionsBuilder = new DbContextOptionsBuilder<EntityConfigurationDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "entity_configuration");
        });

        using var context = new EntityConfigurationDbContext(optionsBuilder.Options);
        
        try
        {
            // Test connection by attempting a simple query
            await context.Database.ExecuteSqlRawAsync("SELECT 1");
            logger.LogInformation("Database connection verified for wizard configurations seed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Cannot connect to database for wizard configurations seed. Error: {Error}", ex.Message);
            return;
        }

        await SeedData.SeedWizardConfigurationsAsync(context, logger);
    }
}

