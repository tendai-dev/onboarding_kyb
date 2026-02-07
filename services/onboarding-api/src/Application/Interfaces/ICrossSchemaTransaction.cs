using System.Data;

namespace OnboardingApi.Application.Interfaces;

/// <summary>
/// Coordinates transactions across multiple DbContexts/schemas.
/// Since all DbContexts share the same NpgsqlDataSource, we can use
/// a single database transaction that spans multiple schemas.
/// </summary>
public interface ICrossSchemaTransaction : IAsyncDisposable
{
    /// <summary>
    /// Commits all changes across all enlisted DbContexts atomically.
    /// </summary>
    Task CommitAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Rolls back all changes across all enlisted DbContexts.
    /// </summary>
    Task RollbackAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Factory for creating cross-schema transactions.
/// </summary>
public interface ICrossSchemaTransactionFactory
{
    /// <summary>
    /// Begins a new transaction that can span multiple schemas.
    /// All DbContext operations within this scope will use the same transaction.
    /// </summary>
    Task<ICrossSchemaTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default);
}
