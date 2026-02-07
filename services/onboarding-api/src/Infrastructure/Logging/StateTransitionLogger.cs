using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.Logging;

/// <summary>
/// Structured logger for state transitions - makes debugging production issues easier.
/// Logs old state, new state, trigger, and context for any entity state change.
/// </summary>
public interface IStateTransitionLogger
{
    void LogTransition<TState>(string entityType, string entityId, TState oldState, TState newState, 
        string trigger, string? userId = null, object? metadata = null) where TState : Enum;
}

public class StateTransitionLogger : IStateTransitionLogger
{
    private readonly ILogger<StateTransitionLogger> _logger;

    public StateTransitionLogger(ILogger<StateTransitionLogger> logger)
    {
        _logger = logger;
    }

    public void LogTransition<TState>(string entityType, string entityId, TState oldState, TState newState,
        string trigger, string? userId = null, object? metadata = null) where TState : Enum
    {
        _logger.LogInformation(
            "STATE_TRANSITION | Entity: {EntityType}:{EntityId} | {OldState} -> {NewState} | Trigger: {Trigger} | User: {UserId} | Meta: {@Metadata}",
            entityType, entityId, oldState, newState, trigger, userId ?? "system", metadata);
    }
}

/// <summary>
/// Extension methods for logging common state transitions.
/// </summary>
public static class StateTransitionLoggerExtensions
{
    public static void LogCaseStatusChange(this IStateTransitionLogger logger, 
        Guid caseId, string oldStatus, string newStatus, string trigger, string? userId = null)
    {
        logger.LogTransition("Case", caseId.ToString(), 
            ParseEnum<CaseStatus>(oldStatus), ParseEnum<CaseStatus>(newStatus), trigger, userId);
    }

    public static void LogWorkItemStatusChange(this IStateTransitionLogger logger,
        Guid workItemId, string oldStatus, string newStatus, string trigger, string? userId = null)
    {
        logger.LogTransition("WorkItem", workItemId.ToString(),
            ParseEnum<WorkItemStatus>(oldStatus), ParseEnum<WorkItemStatus>(newStatus), trigger, userId);
    }

    private static T ParseEnum<T>(string value) where T : struct, Enum
        => Enum.TryParse<T>(value, true, out var result) ? result : default;

    private enum CaseStatus { Draft, Submitted, InReview, Approved, Rejected, Cancelled }
    private enum WorkItemStatus { Pending, InProgress, Completed, OnHold, Cancelled }
}
