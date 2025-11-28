using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.Events;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;
using WorkItem = OnboardingApi.Domain.WorkQueue.Aggregates.WorkItem;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;
using AuditLogEntry = OnboardingApi.Domain.Audit.Aggregates.AuditLogEntry;
using Message = OnboardingApi.Domain.Messaging.Aggregates.Message;
using MessageThread = OnboardingApi.Domain.Messaging.Aggregates.MessageThread;

namespace OnboardingApi.Tests.Unit.TestHelpers;

/// <summary>
/// Manual mock implementations to avoid Castle.Core dependency
/// </summary>
public class MockOnboardingCaseRepository : IOnboardingCaseRepository
{
    private readonly Dictionary<Guid, OnboardingCase> _cases = new();
    private readonly MockUnitOfWork _unitOfWork = new();
    
    public IUnitOfWork UnitOfWork => _unitOfWork;
    
    public Task<OnboardingCase?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _cases.TryGetValue(id, out var value);
        return Task.FromResult(value);
    }
    
    public Task<OnboardingCase?> GetByCaseNumberAsync(string caseNumber, CancellationToken cancellationToken = default)
    {
        var result = _cases.Values.FirstOrDefault(c => c.CaseNumber == caseNumber);
        return Task.FromResult(result);
    }
    
    public Task<IEnumerable<OnboardingCase>> GetByPartnerIdAsync(Guid partnerId, CancellationToken cancellationToken = default)
    {
        var result = _cases.Values.Where(c => c.PartnerId == partnerId);
        return Task.FromResult(result);
    }
    
    public Task<(IEnumerable<OnboardingCase> Items, int TotalCount)> GetByPartnerIdWithFiltersAsync(
        Guid partnerId,
        int limit = 25,
        int offset = 0,
        string? status = null,
        string? assignee = null,
        CancellationToken cancellationToken = default)
    {
        var query = _cases.Values.Where(c => c.PartnerId == partnerId).AsQueryable();
        
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status.ToString() == status);
        }
        
        var items = query.Skip(offset).Take(limit).ToList();
        var total = query.Count();
        
        return Task.FromResult(((IEnumerable<OnboardingCase>)items, total));
    }
    
    public Task AddAsync(OnboardingCase onboardingCase, CancellationToken cancellationToken = default)
    {
        _cases[onboardingCase.Id] = onboardingCase;
        return Task.CompletedTask;
    }
    
    public void Update(OnboardingCase onboardingCase)
    {
        if (_cases.ContainsKey(onboardingCase.Id))
        {
            _cases[onboardingCase.Id] = onboardingCase;
        }
    }
    
    public void Delete(OnboardingCase onboardingCase)
    {
        _cases.Remove(onboardingCase.Id);
    }
    
    // Test helpers
    public void SetupGetById(Guid id, OnboardingCase? result)
    {
        if (result != null)
        {
            _cases[id] = result;
        }
        else
        {
            // Ensure null is returned by removing any existing entry
            _cases.Remove(id);
        }
    }
    
    public void SetupGetByPartnerId(Guid partnerId, List<OnboardingCase> results)
    {
        foreach (var result in results)
        {
            _cases[result.Id] = result;
        }
    }
    
    public void Clear()
    {
        _cases.Clear();
    }
    
    public List<OnboardingCase> GetAddedCases()
    {
        return _cases.Values.ToList();
    }
}

public class MockUnitOfWork : IUnitOfWork
{
    public int SaveChangesCallCount { get; private set; }
    public bool SaveChangesAsyncCalled => SaveChangesCallCount > 0;
    
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCallCount++;
        return Task.FromResult(1);
    }
    
    public Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCallCount++;
        return Task.FromResult(true);
    }
    
    public void Dispose()
    {
        // Nothing to dispose
    }
}

public class MockEventBus : IEventBus
{
    public List<IDomainEvent> PublishedEvents { get; } = new();
    public List<IIntegrationEvent> PublishedIntegrationEvents { get; } = new();
    
    public Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IDomainEvent
    {
        PublishedEvents.Add(@event);
        return Task.CompletedTask;
    }
    
    public Task PublishIntegrationEventAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IIntegrationEvent
    {
        PublishedIntegrationEvents.Add(@event);
        return Task.CompletedTask;
    }
    
    public void Clear()
    {
        PublishedEvents.Clear();
        PublishedIntegrationEvents.Clear();
    }
    
    public bool WasEventPublished<T>() where T : IDomainEvent
    {
        return PublishedEvents.OfType<T>().Any();
    }
}

public class MockLogger<T> : Microsoft.Extensions.Logging.ILogger<T>
{
    public List<string> LogMessages { get; } = new();
    
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    
    public bool IsEnabled(Microsoft.Extensions.Logging.LogLevel logLevel) => true;
    
    public void Log<TState>(Microsoft.Extensions.Logging.LogLevel logLevel, Microsoft.Extensions.Logging.EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        LogMessages.Add(formatter(state, exception));
    }
}

public class MockChecklistRepository : OnboardingApi.Application.Checklist.Interfaces.IChecklistRepository
{
    private readonly Dictionary<Guid, DomainChecklist> _checklists = new();
    private readonly Dictionary<string, DomainChecklist> _checklistsByCaseId = new();
    
    public Task<DomainChecklist?> GetByIdAsync(OnboardingApi.Domain.Checklist.ValueObjects.ChecklistId id, CancellationToken cancellationToken = default)
    {
        _checklists.TryGetValue(id.Value, out var value);
        return Task.FromResult(value);
    }
    
    public Task<DomainChecklist?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        _checklistsByCaseId.TryGetValue(caseId, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<DomainChecklist>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default)
    {
        var result = _checklists.Values.Where(c => c.PartnerId == partnerId).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<DomainChecklist>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_checklists.Values.ToList());
    }
    
    public Task AddAsync(DomainChecklist checklist, CancellationToken cancellationToken = default)
    {
        _checklists[checklist.Id.Value] = checklist;
        _checklistsByCaseId[checklist.CaseId] = checklist;
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(DomainChecklist checklist, CancellationToken cancellationToken = default)
    {
        if (_checklists.ContainsKey(checklist.Id.Value))
        {
            _checklists[checklist.Id.Value] = checklist;
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public DomainChecklist? LastAddedChecklist { get; private set; }
    
    public void SetupAdd(DomainChecklist checklist)
    {
        LastAddedChecklist = checklist;
    }
    
    public void SetupGetById(OnboardingApi.Domain.Checklist.ValueObjects.ChecklistId id, DomainChecklist? result)
    {
        if (result != null)
        {
            _checklists[id.Value] = result;
        }
        else
        {
            _checklists.Remove(id.Value);
        }
    }
}

public class MockChecklistTemplateService : OnboardingApi.Application.Checklist.Interfaces.IChecklistTemplateService
{
    private readonly Dictionary<OnboardingApi.Domain.Checklist.ValueObjects.ChecklistType, List<OnboardingApi.Domain.Checklist.ValueObjects.ChecklistItemTemplate>> _templates = new();
    
    public Task<List<OnboardingApi.Domain.Checklist.ValueObjects.ChecklistItemTemplate>> GetTemplatesAsync(
        OnboardingApi.Domain.Checklist.ValueObjects.ChecklistType type, 
        CancellationToken cancellationToken = default)
    {
        _templates.TryGetValue(type, out var templates);
        return Task.FromResult(templates ?? new List<OnboardingApi.Domain.Checklist.ValueObjects.ChecklistItemTemplate>());
    }
    
    public void SetupTemplates(OnboardingApi.Domain.Checklist.ValueObjects.ChecklistType type, List<OnboardingApi.Domain.Checklist.ValueObjects.ChecklistItemTemplate> templates)
    {
        _templates[type] = templates;
    }
}

public class MockWorkItemRepository : OnboardingApi.Application.WorkQueue.Interfaces.IWorkItemRepository
{
    private readonly Dictionary<Guid, WorkItem> _workItems = new();
    private readonly Dictionary<Guid, WorkItem> _workItemsByApplicationId = new();
    
    public Task<WorkItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _workItems.TryGetValue(id, out var value);
        return Task.FromResult(value);
    }
    
    public Task<WorkItem?> GetByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        _workItemsByApplicationId.TryGetValue(applicationId, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<WorkItem>> GetAllAsync(
        OnboardingApi.Domain.WorkQueue.ValueObjects.WorkItemStatus? status = null,
        Guid? assignedTo = null,
        OnboardingApi.Domain.WorkQueue.ValueObjects.RiskLevel? riskLevel = null,
        string? country = null,
        bool? isOverdue = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        if (_allWorkItems != null)
        {
            return Task.FromResult(_allWorkItems);
        }
        var query = _workItems.Values.AsQueryable();
        // Simplified filtering for tests
        return Task.FromResult(query.ToList());
    }
    
    public Task<List<WorkItem>> GetByAssignedUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        if (_assignedWorkItems != null)
        {
            return Task.FromResult(_assignedWorkItems);
        }
        var result = _workItems.Values.Where(w => w.AssignedTo == userId).ToList();
        return Task.FromResult(result);
    }
    
    private List<WorkItem>? _pendingApprovals;
    private List<WorkItem>? _itemsDueForRefresh;
    private List<WorkItem>? _allWorkItems;
    private List<WorkItem>? _assignedWorkItems;
    
    public Task<List<WorkItem>> GetPendingApprovalsAsync(OnboardingApi.Domain.WorkQueue.ValueObjects.RiskLevel? minimumRiskLevel = null, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_pendingApprovals ?? new List<WorkItem>());
    }
    
    public Task<List<WorkItem>> GetItemsDueForRefreshAsync(DateTime? asOfDate = null, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_itemsDueForRefresh ?? new List<WorkItem>());
    }
    
    public void SetupGetAll(
        OnboardingApi.Domain.WorkQueue.ValueObjects.WorkItemStatus? status,
        Guid? assignedTo,
        OnboardingApi.Domain.WorkQueue.ValueObjects.RiskLevel? riskLevel,
        string? country,
        bool? isOverdue,
        string? searchTerm,
        List<WorkItem> workItems)
    {
        _allWorkItems = workItems;
        foreach (var wi in workItems)
        {
            _workItems[wi.Id] = wi;
        }
    }
    
    public void SetupGetByAssignedUser(Guid userId, List<WorkItem> workItems)
    {
        _assignedWorkItems = workItems;
        foreach (var wi in workItems)
        {
            _workItems[wi.Id] = wi;
        }
    }
    
    public void SetupGetPendingApprovals(OnboardingApi.Domain.WorkQueue.ValueObjects.RiskLevel? minimumRiskLevel, List<WorkItem> workItems)
    {
        _pendingApprovals = workItems;
        foreach (var wi in workItems)
        {
            _workItems[wi.Id] = wi;
        }
    }
    
    public void SetupGetItemsDueForRefresh(DateTime? asOfDate, List<WorkItem> workItems)
    {
        _itemsDueForRefresh = workItems;
        foreach (var wi in workItems)
        {
            _workItems[wi.Id] = wi;
        }
    }
    
    public bool ShouldThrowOnAdd { get; set; }
    
    public Task AddAsync(WorkItem workItem, CancellationToken cancellationToken = default)
    {
        if (ShouldThrowOnAdd)
            throw new Exception("Repository add failed");
            
        _workItems[workItem.Id] = workItem;
        // Use reflection to get ApplicationId if needed
        var appIdProp = typeof(WorkItem).GetProperty("ApplicationId");
        if (appIdProp != null)
        {
            var appId = (Guid?)appIdProp.GetValue(workItem);
            if (appId.HasValue)
            {
                _workItemsByApplicationId[appId.Value] = workItem;
            }
        }
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(WorkItem workItem, CancellationToken cancellationToken = default)
    {
        if (_workItems.ContainsKey(workItem.Id))
        {
            _workItems[workItem.Id] = workItem;
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public void SetupGetById(Guid id, WorkItem? result)
    {
        if (result != null)
        {
            _workItems[id] = result;
        }
        else
        {
            // Ensure null is returned by removing any existing entry
            _workItems.Remove(id);
        }
    }
    
    public void SetupGetByApplicationId(Guid applicationId, WorkItem? result)
    {
        if (result != null)
        {
            _workItemsByApplicationId[applicationId] = result;
            _workItems[result.Id] = result;
        }
        else
        {
            // Ensure null is returned by removing any existing entry
            _workItemsByApplicationId.Remove(applicationId);
        }
    }
    
    public WorkItem? LastAddedWorkItem { get; private set; }
    
    public void SetupAdd(WorkItem workItem)
    {
        LastAddedWorkItem = workItem;
    }
}

public class MockNotificationRepository : OnboardingApi.Application.Notification.Interfaces.INotificationRepository
{
    private readonly Dictionary<Guid, DomainNotification> _notifications = new();
    
    public Task AddAsync(DomainNotification notification, CancellationToken cancellationToken = default)
    {
        _notifications[notification.Id.Value] = notification;
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(DomainNotification notification, CancellationToken cancellationToken = default)
    {
        if (_notifications.ContainsKey(notification.Id.Value))
        {
            _notifications[notification.Id.Value] = notification;
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public Task<List<DomainNotification>> ListByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        var result = _notifications.Values.Where(n => n.CaseId == caseId).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<DomainNotification>> ListByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        var result = _notifications.Values.Where(n => n.Status.ToString() == status).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<DomainNotification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_notifications.Values.ToList());
    }
    
    public Task<DomainNotification?> GetByIdAsync(OnboardingApi.Domain.Notification.ValueObjects.NotificationId id, CancellationToken cancellationToken = default)
    {
        _notifications.TryGetValue(id.Value, out var value);
        return Task.FromResult(value);
    }
}

public class MockNotificationSender : OnboardingApi.Application.Notification.Interfaces.INotificationSender
{
    public List<DomainNotification> SentNotifications { get; } = new();
    
    public Task SendAsync(DomainNotification notification, CancellationToken cancellationToken = default)
    {
        SentNotifications.Add(notification);
        return Task.CompletedTask;
    }
}

public class MockAuditLogRepository : OnboardingApi.Application.Audit.Interfaces.IAuditLogRepository
{
    private readonly Dictionary<Guid, AuditLogEntry> _entries = new();
    
    public Task<AuditLogEntry?> GetByIdAsync(OnboardingApi.Domain.Audit.ValueObjects.AuditLogEntryId id, CancellationToken cancellationToken = default)
    {
        _entries.TryGetValue(id.Value, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<AuditLogEntry>> GetByEntityAsync(string entityType, string entityId, CancellationToken cancellationToken = default)
    {
        var result = _entries.Values.Where(e => e.EntityType == entityType && e.EntityId == entityId).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<AuditLogEntry>> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        var result = _entries.Values.Where(e => e.CaseId == caseId).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<AuditLogEntry>> GetByUserIdAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _entries.Values.Where(e => e.UserId == userId).AsQueryable();
        if (fromDate.HasValue)
            query = query.Where(e => e.Timestamp >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(e => e.Timestamp <= toDate.Value);
        return Task.FromResult(query.ToList());
    }
    
    public Task<List<AuditLogEntry>> GetByComplianceCategoryAsync(OnboardingApi.Domain.Audit.ValueObjects.ComplianceCategory category, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _entries.Values.Where(e => e.ComplianceCategory == category).AsQueryable();
        if (fromDate.HasValue)
            query = query.Where(e => e.Timestamp >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(e => e.Timestamp <= toDate.Value);
        return Task.FromResult(query.ToList());
    }
    
    public Task<List<AuditLogEntry>> SearchAsync(OnboardingApi.Application.Audit.Interfaces.AuditLogSearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        var query = _entries.Values.AsQueryable();
        if (!string.IsNullOrEmpty(criteria.EventType))
            query = query.Where(e => e.EventType == criteria.EventType);
        if (!string.IsNullOrEmpty(criteria.EntityType))
            query = query.Where(e => e.EntityType == criteria.EntityType);
        if (!string.IsNullOrEmpty(criteria.EntityId))
            query = query.Where(e => e.EntityId == criteria.EntityId);
        if (criteria.FromDate.HasValue)
            query = query.Where(e => e.Timestamp >= criteria.FromDate.Value);
        if (criteria.ToDate.HasValue)
            query = query.Where(e => e.Timestamp <= criteria.ToDate.Value);
        return Task.FromResult(query.Skip(criteria.Skip).Take(criteria.Take).ToList());
    }
    
    public Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken = default)
    {
        _entries[entry.Id.Value] = entry;
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public Task<bool> VerifyIntegrityAsync(OnboardingApi.Domain.Audit.ValueObjects.AuditLogEntryId id, CancellationToken cancellationToken = default)
    {
        _entries.TryGetValue(id.Value, out var entry);
        return Task.FromResult(entry != null);
    }
}

public class MockMessageRepository : OnboardingApi.Application.Messaging.Interfaces.IMessageRepository
{
    private readonly Dictionary<Guid, Message> _messages = new();
    private readonly Dictionary<Guid, MessageThread> _threads = new();
    private readonly Dictionary<Guid, MessageThread> _threadsByApplicationId = new();
    
    public Task<Message?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _messages.TryGetValue(id, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<Message>> GetByCaseIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        var result = _messages.Values.Where(m => m.ApplicationId == applicationId).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<Message>> GetByThreadIdAsync(Guid threadId, CancellationToken cancellationToken = default)
    {
        var result = _messages.Values.Where(m => m.ThreadId == threadId).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<Message>> GetAccessibleMessagesForUserAsync(Guid userId, OnboardingApi.Domain.Messaging.ValueObjects.UserRole role, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<Message>());
    }
    
    public Task<List<Message>> GetAllMessagesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_messages.Values.ToList());
    }
    
    public Task<MessageThread?> GetThreadByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        _threadsByApplicationId.TryGetValue(applicationId, out var value);
        return Task.FromResult(value);
    }
    
    public Task<MessageThread?> GetThreadByIdAsync(Guid threadId, CancellationToken cancellationToken = default)
    {
        _threads.TryGetValue(threadId, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<MessageThread>> GetThreadsForUserAsync(Guid userId, OnboardingApi.Domain.Messaging.ValueObjects.UserRole role, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<MessageThread>());
    }
    
    public Task<List<MessageThread>> GetAllThreadsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_threads.Values.ToList());
    }
    
    public bool ShouldThrowOnAdd { get; set; }
    
    public Task AddAsync(Message message, CancellationToken cancellationToken = default)
    {
        if (ShouldThrowOnAdd)
            throw new Exception("Repository add failed");
        _messages[message.Id] = message;
        return Task.CompletedTask;
    }
    
    public Task AddThreadAsync(MessageThread thread, CancellationToken cancellationToken = default)
    {
        _threads[thread.Id] = thread;
        var appIdProp = typeof(MessageThread).GetProperty("ApplicationId");
        if (appIdProp != null)
        {
            var appId = (Guid?)appIdProp.GetValue(thread);
            if (appId.HasValue)
            {
                _threadsByApplicationId[appId.Value] = thread;
            }
        }
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(Message message, CancellationToken cancellationToken = default)
    {
        if (_messages.ContainsKey(message.Id))
        {
            _messages[message.Id] = message;
        }
        return Task.CompletedTask;
    }
    
    public Task UpdateThreadAsync(MessageThread thread, CancellationToken cancellationToken = default)
    {
        if (_threads.ContainsKey(thread.Id))
        {
            _threads[thread.Id] = thread;
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public void SetupGetById(Guid id, Message? result)
    {
        if (result != null)
        {
            _messages[id] = result;
        }
        else
        {
            _messages.Remove(id);
        }
    }
    
    public void SetupGetThreadByApplicationId(Guid applicationId, MessageThread? result)
    {
        if (result != null)
        {
            _threadsByApplicationId[applicationId] = result;
            _threads[result.Id] = result;
        }
        else
        {
            _threadsByApplicationId.Remove(applicationId);
        }
    }
}

public class MockDocumentRepository : OnboardingApi.Application.Document.Interfaces.IDocumentRepository
{
    private readonly Dictionary<Guid, OnboardingApi.Domain.Document.Aggregates.Document> _documents = new();
    private readonly Dictionary<string, OnboardingApi.Domain.Document.Aggregates.Document> _documentsByStorageKey = new();
    private readonly Dictionary<Guid, List<OnboardingApi.Domain.Document.Aggregates.Document>> _documentsByCaseId = new();
    
    public Task<OnboardingApi.Domain.Document.Aggregates.Document?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _documents.TryGetValue(id, out var value);
        return Task.FromResult(value);
    }
    
    public Task<OnboardingApi.Domain.Document.Aggregates.Document?> GetByStorageKeyAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        _documentsByStorageKey.TryGetValue(storageKey, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<OnboardingApi.Domain.Document.Aggregates.Document>> GetByCaseIdAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        _documentsByCaseId.TryGetValue(caseId, out var value);
        return Task.FromResult(value ?? new List<OnboardingApi.Domain.Document.Aggregates.Document>());
    }
    
    public Task<List<OnboardingApi.Domain.Document.Aggregates.Document>> GetAllAsync(int skip = 0, int take = 100, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_documents.Values.Skip(skip).Take(take).ToList());
    }
    
    public Task<int> GetCountAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_documents.Count);
    }
    
    public Task AddAsync(OnboardingApi.Domain.Document.Aggregates.Document document, CancellationToken cancellationToken = default)
    {
        _documents[document.Id] = document;
        _documentsByStorageKey[document.StorageKey] = document;
        var caseIdProp = typeof(OnboardingApi.Domain.Document.Aggregates.Document).GetProperty("CaseId");
        if (caseIdProp != null)
        {
            var caseId = (Guid?)caseIdProp.GetValue(document);
            if (caseId.HasValue)
            {
                if (!_documentsByCaseId.ContainsKey(caseId.Value))
                    _documentsByCaseId[caseId.Value] = new List<OnboardingApi.Domain.Document.Aggregates.Document>();
                _documentsByCaseId[caseId.Value].Add(document);
            }
        }
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(OnboardingApi.Domain.Document.Aggregates.Document document, CancellationToken cancellationToken = default)
    {
        if (_documents.ContainsKey(document.Id))
        {
            _documents[document.Id] = document;
            _documentsByStorageKey[document.StorageKey] = document;
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public void SetupGetById(Guid id, OnboardingApi.Domain.Document.Aggregates.Document? result)
    {
        if (result != null)
        {
            _documents[id] = result;
        }
        else
        {
            _documents.Remove(id);
        }
    }
    
    public void SetupGetByCaseId(Guid caseId, List<OnboardingApi.Domain.Document.Aggregates.Document> documents)
    {
        _documentsByCaseId[caseId] = documents;
        foreach (var doc in documents)
        {
            _documents[doc.Id] = doc;
        }
    }
}

public class MockObjectStorage : OnboardingApi.Application.Document.Interfaces.IObjectStorage
{
    public Dictionary<string, Stream> Storage { get; } = new();
    public List<string> UploadedKeys { get; } = new();
    
    public Task<string> UploadObjectAsync(string bucketName, string objectKey, Stream fileStream, string contentType, CancellationToken cancellationToken = default)
    {
        var memoryStream = new MemoryStream();
        fileStream.CopyTo(memoryStream);
        memoryStream.Position = 0;
        Storage[objectKey] = memoryStream;
        UploadedKeys.Add(objectKey);
        return Task.FromResult(objectKey);
    }
    
    public Task<Stream> DownloadObjectAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default)
    {
        Storage.TryGetValue(objectKey, out var stream);
        return Task.FromResult(stream ?? new MemoryStream());
    }
    
    public Task<bool> ObjectExistsAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Storage.ContainsKey(objectKey));
    }
    
    public Task<string> GeneratePresignedUploadUrlAsync(string bucketName, string objectKey, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"https://storage.example.com/{bucketName}/{objectKey}?expires={expiry.TotalSeconds}");
    }
    
    public Task<string> GeneratePresignedDownloadUrlAsync(string bucketName, string objectKey, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        return Task.FromResult($"https://storage.example.com/{bucketName}/{objectKey}?expires={expiry.TotalSeconds}");
    }
    
    public Task DeleteObjectAsync(string bucketName, string objectKey, CancellationToken cancellationToken = default)
    {
        Storage.Remove(objectKey);
        return Task.CompletedTask;
    }
}

public class MockRiskAssessmentRepository : OnboardingApi.Application.Risk.Interfaces.IRiskAssessmentRepository
{
    private readonly Dictionary<Guid, OnboardingApi.Domain.Risk.Aggregates.RiskAssessment> _assessments = new();
    private readonly Dictionary<string, OnboardingApi.Domain.Risk.Aggregates.RiskAssessment> _assessmentsByCaseId = new();
    
    public Task<OnboardingApi.Domain.Risk.Aggregates.RiskAssessment?> GetByIdAsync(OnboardingApi.Domain.Risk.ValueObjects.RiskAssessmentId id, CancellationToken cancellationToken = default)
    {
        _assessments.TryGetValue(id.Value, out var value);
        return Task.FromResult(value);
    }
    
    public Task<OnboardingApi.Domain.Risk.Aggregates.RiskAssessment?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        _assessmentsByCaseId.TryGetValue(caseId, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<OnboardingApi.Domain.Risk.Aggregates.RiskAssessment>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default)
    {
        var result = _assessments.Values.Where(a => a.PartnerId == partnerId).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<OnboardingApi.Domain.Risk.Aggregates.RiskAssessment>> GetByRiskLevelAsync(OnboardingApi.Domain.Risk.ValueObjects.RiskLevel riskLevel, CancellationToken cancellationToken = default)
    {
        var result = _assessments.Values.Where(a => a.OverallRiskLevel == riskLevel).ToList();
        return Task.FromResult(result);
    }
    
    public Task<List<OnboardingApi.Domain.Risk.Aggregates.RiskAssessment>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_assessments.Values.ToList());
    }
    
    public Task<List<OnboardingApi.Domain.Risk.Aggregates.RiskAssessment>> SearchAsync(string? partnerId = null, OnboardingApi.Domain.Risk.ValueObjects.RiskLevel? riskLevel = null, string? status = null, string? caseId = null, CancellationToken cancellationToken = default)
    {
        var query = _assessments.Values.AsQueryable();
        if (!string.IsNullOrEmpty(partnerId))
            query = query.Where(a => a.PartnerId == partnerId);
        if (riskLevel.HasValue)
            query = query.Where(a => a.OverallRiskLevel == riskLevel.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status.ToString() == status);
        if (!string.IsNullOrEmpty(caseId))
            query = query.Where(a => a.CaseId == caseId);
        return Task.FromResult(query.ToList());
    }
    
    public Task AddAsync(OnboardingApi.Domain.Risk.Aggregates.RiskAssessment assessment, CancellationToken cancellationToken = default)
    {
        _assessments[assessment.Id.Value] = assessment;
        _assessmentsByCaseId[assessment.CaseId] = assessment;
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(OnboardingApi.Domain.Risk.Aggregates.RiskAssessment assessment, CancellationToken cancellationToken = default)
    {
        if (_assessments.ContainsKey(assessment.Id.Value))
        {
            _assessments[assessment.Id.Value] = assessment;
            _assessmentsByCaseId[assessment.CaseId] = assessment;
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public void SetupGetById(OnboardingApi.Domain.Risk.ValueObjects.RiskAssessmentId id, OnboardingApi.Domain.Risk.Aggregates.RiskAssessment? result)
    {
        if (result != null)
        {
            _assessments[id.Value] = result;
        }
        else
        {
            _assessments.Remove(id.Value);
        }
    }
    
    public void SetupGetByCaseId(string caseId, OnboardingApi.Domain.Risk.Aggregates.RiskAssessment? result)
    {
        if (result != null)
        {
            _assessmentsByCaseId[caseId] = result;
            _assessments[result.Id.Value] = result;
        }
        else
        {
            _assessmentsByCaseId.Remove(caseId);
        }
    }
    
    public void SetupSearch(string? partnerId, OnboardingApi.Domain.Risk.ValueObjects.RiskLevel? riskLevel, string? status, string? caseId, List<OnboardingApi.Domain.Risk.Aggregates.RiskAssessment> results)
    {
        // Clear existing assessments and add the ones that match the search criteria
        foreach (var assessment in results)
        {
            _assessments[assessment.Id.Value] = assessment;
            _assessmentsByCaseId[assessment.CaseId] = assessment;
        }
    }
}

public class MockRequirementRepository : OnboardingApi.Application.EntityConfiguration.Interfaces.IRequirementRepository
{
    private readonly Dictionary<Guid, OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement> _requirements = new();
    private readonly Dictionary<string, OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement> _requirementsByCode = new();
    
    public Task<OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _requirements.TryGetValue(id, out var value);
        return Task.FromResult(value);
    }
    
    public Task<OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        _requirementsByCode.TryGetValue(code, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var result = _requirements.Values.AsQueryable();
        if (!includeInactive)
        {
            var isActiveProp = typeof(OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement).GetProperty("IsActive");
            if (isActiveProp != null)
            {
                result = result.Where(r => (bool)(isActiveProp.GetValue(r) ?? true));
            }
        }
        return Task.FromResult(result.ToList());
    }
    
    public Task AddAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement requirement, CancellationToken cancellationToken = default)
    {
        _requirements[requirement.Id] = requirement;
        _requirementsByCode[requirement.Code] = requirement;
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement requirement, CancellationToken cancellationToken = default)
    {
        if (_requirements.ContainsKey(requirement.Id))
        {
            _requirements[requirement.Id] = requirement;
            _requirementsByCode[requirement.Code] = requirement;
        }
        return Task.CompletedTask;
    }
    
    public Task DeleteAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement requirement, CancellationToken cancellationToken = default)
    {
        _requirements.Remove(requirement.Id);
        _requirementsByCode.Remove(requirement.Code);
        return Task.CompletedTask;
    }
    
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (_requirements.TryGetValue(id, out var requirement))
        {
            _requirements.Remove(id);
            _requirementsByCode.Remove(requirement.Code);
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public void SetupGetById(Guid id, OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement? result)
    {
        if (result != null)
        {
            _requirements[id] = result;
        }
        else
        {
            _requirements.Remove(id);
        }
    }
    
    public void SetupGetByCode(string code, OnboardingApi.Domain.EntityConfiguration.Aggregates.Requirement? result)
    {
        if (result != null)
        {
            _requirementsByCode[code] = result;
            _requirements[result.Id] = result;
        }
        else
        {
            _requirementsByCode.Remove(code);
        }
    }
}

public class MockApplicationRepository : OnboardingApi.Application.Commands.IApplicationRepository
{
    private readonly Dictionary<Guid, List<OnboardingApi.Application.Commands.Application>> _applicationsByUserId = new();
    
    public Task<List<OnboardingApi.Application.Commands.Application>> GetApplicationsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _applicationsByUserId.TryGetValue(userId, out var value);
        return Task.FromResult(value ?? new List<OnboardingApi.Application.Commands.Application>());
    }
    
    public Task UpdateAsync(OnboardingApi.Application.Commands.Application application, CancellationToken cancellationToken = default)
    {
        // Update logic handled in test setup
        return Task.CompletedTask;
    }
    
    public void SetupGetApplicationsByUserId(Guid userId, List<OnboardingApi.Application.Commands.Application> applications)
    {
        _applicationsByUserId[userId] = applications;
    }
}

public class MockEventPublisher : OnboardingApi.Application.Commands.IEventPublisher
{
    public List<object> PublishedEvents { get; } = new();
    
    public Task PublishAsync<T>(T domainEvent, CancellationToken cancellationToken = default) where T : class
    {
        PublishedEvents.Add(domainEvent);
        return Task.CompletedTask;
    }
}

public class MockWizardConfigurationRepository : OnboardingApi.Application.EntityConfiguration.Interfaces.IWizardConfigurationRepository
{
    private readonly Dictionary<Guid, OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration> _configurations = new();
    private readonly Dictionary<Guid, OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration> _configurationsByEntityTypeId = new();
    
    public Task<OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _configurations.TryGetValue(id, out var value);
        return Task.FromResult(value);
    }
    
    public Task<OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration?> GetByEntityTypeIdAsync(Guid entityTypeId, CancellationToken cancellationToken = default)
    {
        _configurationsByEntityTypeId.TryGetValue(entityTypeId, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var result = _configurations.Values.AsQueryable();
        if (!includeInactive)
        {
            var isActiveProp = typeof(OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration).GetProperty("IsActive");
            if (isActiveProp != null)
            {
                result = result.Where(c => (bool)(isActiveProp.GetValue(c) ?? true));
            }
        }
        return Task.FromResult(result.ToList());
    }
    
    public Task AddAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        _configurations[wizardConfiguration.Id] = wizardConfiguration;
        _configurationsByEntityTypeId[wizardConfiguration.EntityTypeId] = wizardConfiguration;
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        if (_configurations.ContainsKey(wizardConfiguration.Id))
        {
            _configurations[wizardConfiguration.Id] = wizardConfiguration;
            _configurationsByEntityTypeId[wizardConfiguration.EntityTypeId] = wizardConfiguration;
        }
        return Task.CompletedTask;
    }
    
    public Task DeleteAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        _configurations.Remove(wizardConfiguration.Id);
        _configurationsByEntityTypeId.Remove(wizardConfiguration.EntityTypeId);
        return Task.CompletedTask;
    }
    
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (_configurations.TryGetValue(id, out var config))
        {
            _configurations.Remove(id);
            _configurationsByEntityTypeId.Remove(config.EntityTypeId);
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public void SetupGetById(Guid id, OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration? result)
    {
        if (result != null)
        {
            _configurations[id] = result;
        }
        else
        {
            _configurations.Remove(id);
        }
    }
    
    public void SetupGetByEntityTypeId(Guid entityTypeId, OnboardingApi.Domain.EntityConfiguration.Aggregates.WizardConfiguration? result)
    {
        if (result != null)
        {
            _configurationsByEntityTypeId[entityTypeId] = result;
            _configurations[result.Id] = result;
        }
        else
        {
            _configurationsByEntityTypeId.Remove(entityTypeId);
        }
    }
}

public class MockEntityTypeRepository : OnboardingApi.Application.EntityConfiguration.Interfaces.IEntityTypeRepository
{
    private readonly Dictionary<Guid, OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType> _entityTypes = new();
    private readonly Dictionary<string, OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType> _entityTypesByCode = new();
    
    public Task<OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _entityTypes.TryGetValue(id, out var value);
        return Task.FromResult(value);
    }
    
    public Task<OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        _entityTypesByCode.TryGetValue(code, out var value);
        return Task.FromResult(value);
    }
    
    public Task<List<OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var result = _entityTypes.Values.AsQueryable();
        if (!includeInactive)
        {
            var isActiveProp = typeof(OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType).GetProperty("IsActive");
            if (isActiveProp != null)
            {
                result = result.Where(e => (bool)(isActiveProp.GetValue(e) ?? true));
            }
        }
        return Task.FromResult(result.ToList());
    }
    
    public Task<List<OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType>> GetAllWithRequirementsAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        return GetAllAsync(includeInactive);
    }
    
    public Task AddAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType entityType, CancellationToken cancellationToken = default)
    {
        _entityTypes[entityType.Id] = entityType;
        _entityTypesByCode[entityType.Code] = entityType;
        return Task.CompletedTask;
    }
    
    public Task UpdateAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType entityType, CancellationToken cancellationToken = default)
    {
        if (_entityTypes.ContainsKey(entityType.Id))
        {
            _entityTypes[entityType.Id] = entityType;
            _entityTypesByCode[entityType.Code] = entityType;
        }
        return Task.CompletedTask;
    }
    
    public Task DeleteAsync(OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType entityType, CancellationToken cancellationToken = default)
    {
        _entityTypes.Remove(entityType.Id);
        _entityTypesByCode.Remove(entityType.Code);
        return Task.CompletedTask;
    }
    
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (_entityTypes.TryGetValue(id, out var entityType))
        {
            _entityTypes.Remove(id);
            _entityTypesByCode.Remove(entityType.Code);
        }
        return Task.CompletedTask;
    }
    
    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    
    public void SetupGetById(Guid id, OnboardingApi.Domain.EntityConfiguration.Aggregates.EntityType? result)
    {
        if (result != null)
        {
            _entityTypes[id] = result;
        }
        else
        {
            _entityTypes.Remove(id);
        }
    }
}

