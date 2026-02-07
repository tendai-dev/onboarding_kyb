namespace OnboardingApi.Application.Sagas;

/// <summary>
/// Base interface for Saga state
/// </summary>
public interface ISagaState
{
    Guid SagaId { get; }
    string SagaType { get; }
    SagaStatus Status { get; set; }
    DateTime StartedAt { get; }
    DateTime? CompletedAt { get; set; }
    string? FailureReason { get; set; }
    int CurrentStep { get; set; }
    Dictionary<string, string> CompletedSteps { get; }
}

/// <summary>
/// Saga execution status
/// </summary>
public enum SagaStatus
{
    Started = 1,
    InProgress = 2,
    Completed = 3,
    Failed = 4,
    Compensating = 5,
    Compensated = 6
}

/// <summary>
/// Interface for saga orchestrators
/// </summary>
public interface ISagaOrchestrator<TState> where TState : ISagaState
{
    Task<SagaResult> ExecuteAsync(TState state, CancellationToken cancellationToken = default);
    Task CompensateAsync(TState state, CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of saga execution
/// </summary>
public class SagaResult
{
    public bool Success { get; init; }
    public Guid SagaId { get; init; }
    public string? ErrorMessage { get; init; }
    public Dictionary<string, object> Results { get; init; } = new();

    public static SagaResult Succeeded(Guid sagaId, Dictionary<string, object>? results = null) =>
        new() { Success = true, SagaId = sagaId, Results = results ?? new() };

    public static SagaResult Failed(Guid sagaId, string error) =>
        new() { Success = false, SagaId = sagaId, ErrorMessage = error };
}

/// <summary>
/// Individual saga step
/// </summary>
public interface ISagaStep<TState> where TState : ISagaState
{
    string StepName { get; }
    Task<StepResult> ExecuteAsync(TState state, CancellationToken cancellationToken);
    Task CompensateAsync(TState state, CancellationToken cancellationToken);
}

/// <summary>
/// Result of a saga step
/// </summary>
public class StepResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public Dictionary<string, object> Data { get; init; } = new();

    public static StepResult Succeeded(Dictionary<string, object>? data = null) =>
        new() { Success = true, Data = data ?? new() };

    public static StepResult Failed(string error) =>
        new() { Success = false, ErrorMessage = error };
}
