using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Infrastructure.Persistence.Audit;
using OnboardingApi.Infrastructure.Persistence.WorkQueue;

namespace OnboardingApi.Infrastructure.Persistence;

/// <summary>
/// Coordinates transactions across multiple DbContexts that share the same NpgsqlDataSource.
/// Uses a single database connection and transaction to ensure atomicity across schemas.
/// </summary>
public class CrossSchemaTransaction : ICrossSchemaTransaction
{
    private readonly NpgsqlConnection _connection;
    private readonly NpgsqlTransaction _transaction;
    private readonly List<DbContext> _enlistedContexts = new();
    private readonly ILogger<CrossSchemaTransaction> _logger;
    private bool _committed;
    private bool _disposed;

    internal CrossSchemaTransaction(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        ILogger<CrossSchemaTransaction> logger)
    {
        _connection = connection;
        _transaction = transaction;
        _logger = logger;
    }

    /// <summary>
    /// Enlists a DbContext in this transaction.
    /// The context will use the shared connection and transaction.
    /// </summary>
    public void Enlist(DbContext context)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(CrossSchemaTransaction));

        context.Database.SetDbConnection(_connection);
        context.Database.UseTransaction(_transaction);
        _enlistedContexts.Add(context);
        
        _logger.LogDebug("Enlisted {ContextType} in cross-schema transaction", context.GetType().Name);
    }

    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(CrossSchemaTransaction));
        
        if (_committed)
            throw new InvalidOperationException("Transaction has already been committed");

        try
        {
            // Save changes on all enlisted contexts
            foreach (var context in _enlistedContexts)
            {
                await context.SaveChangesAsync(cancellationToken);
            }

            // Commit the shared transaction
            await _transaction.CommitAsync(cancellationToken);
            _committed = true;
            
            _logger.LogDebug("Cross-schema transaction committed successfully with {Count} contexts", _enlistedContexts.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to commit cross-schema transaction, rolling back");
            await RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        if (_disposed || _committed)
            return;

        try
        {
            await _transaction.RollbackAsync(cancellationToken);
            _logger.LogDebug("Cross-schema transaction rolled back");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during transaction rollback");
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
            return;

        _disposed = true;

        if (!_committed)
        {
            await RollbackAsync();
        }

        // Clear context connections to avoid issues
        foreach (var context in _enlistedContexts)
        {
            try
            {
                context.Database.SetDbConnection(null);
            }
            catch
            {
                // Ignore cleanup errors
            }
        }

        await _transaction.DisposeAsync();
        await _connection.DisposeAsync();
    }
}

/// <summary>
/// Factory for creating cross-schema transactions using the shared NpgsqlDataSource.
/// </summary>
public class CrossSchemaTransactionFactory : ICrossSchemaTransactionFactory
{
    private readonly NpgsqlDataSource _dataSource;
    private readonly ILogger<CrossSchemaTransaction> _transactionLogger;

    public CrossSchemaTransactionFactory(
        NpgsqlDataSource dataSource,
        ILogger<CrossSchemaTransaction> transactionLogger)
    {
        _dataSource = dataSource;
        _transactionLogger = transactionLogger;
    }

    public async Task<ICrossSchemaTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default)
    {
        var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        var transaction = await connection.BeginTransactionAsync(isolationLevel, cancellationToken);
        
        return new CrossSchemaTransaction(connection, transaction, _transactionLogger);
    }
}

/// <summary>
/// Extension methods for cross-schema transaction support.
/// </summary>
public static class CrossSchemaTransactionExtensions
{
    /// <summary>
    /// Enlists a DbContext in the cross-schema transaction.
    /// </summary>
    public static T EnlistIn<T>(this T context, ICrossSchemaTransaction transaction) where T : DbContext
    {
        if (transaction is CrossSchemaTransaction cst)
        {
            cst.Enlist(context);
        }
        return context;
    }
}
