using System.Text.Json;

namespace OnboardingApi.Application.Sagas;

/// <summary>
/// Persistent saga state entity for tracking saga execution
/// </summary>
public class SagaStateEntity
{
    public Guid Id { get; set; }
    public string SagaType { get; set; } = string.Empty;
    public string StateJson { get; set; } = "{}";
    public SagaStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }
    public int CurrentStep { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Repository for saga state persistence
/// </summary>
public interface ISagaStateRepository
{
    Task<SagaStateEntity?> GetByIdAsync(Guid sagaId, CancellationToken cancellationToken = default);
    Task<IEnumerable<SagaStateEntity>> GetPendingSagasAsync(CancellationToken cancellationToken = default);
    Task SaveAsync(SagaStateEntity state, CancellationToken cancellationToken = default);
    Task UpdateAsync(SagaStateEntity state, CancellationToken cancellationToken = default);
}
