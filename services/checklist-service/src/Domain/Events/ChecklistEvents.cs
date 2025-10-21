using MediatR;

namespace ChecklistService.Domain.Events;

public record ChecklistCreatedEvent(
    Guid ChecklistId,
    string CaseId,
    string Type,
    string PartnerId,
    int ItemCount) : INotification;

public record ChecklistCompletedEvent(
    Guid ChecklistId,
    string CaseId,
    string Type,
    string PartnerId,
    DateTime CompletedAt) : INotification;

public record ChecklistItemCompletedEvent(
    Guid ChecklistId,
    string CaseId,
    Guid ItemId,
    string ItemName,
    string CompletedBy) : INotification;

public record ChecklistItemSkippedEvent(
    Guid ChecklistId,
    string CaseId,
    Guid ItemId,
    string ItemName,
    string SkippedBy,
    string Reason) : INotification;

public record ChecklistItemResetEvent(
    Guid ChecklistId,
    string CaseId,
    Guid ItemId,
    string ItemName,
    string ResetBy,
    string Reason) : INotification;
