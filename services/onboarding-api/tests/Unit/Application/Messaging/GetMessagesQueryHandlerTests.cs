using OnboardingApi.Application.Messaging.Interfaces;
using OnboardingApi.Application.Messaging.Queries;
using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Messaging;

public class GetMessagesQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnPagedMessages()
    {
        // Arrange
        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var sender1 = Guid.NewGuid();
        var sender2 = Guid.NewGuid();
        var sender3 = Guid.NewGuid();
        var message1 = Message.Create(threadId, applicationId, sender1, "Sender1", UserRole.Admin, "Message 1");
        var message2 = Message.Create(threadId, applicationId, sender2, "Sender2", UserRole.Applicant, "Message 2");
        var message3 = Message.Create(threadId, applicationId, sender3, "Sender3", UserRole.Admin, "Message 3");

        var repository = new MockMessageQueryRepository();
        repository.SetupGetByThreadId(threadId, new List<Message> { message1, message2, message3 });
        var handler = new GetMessagesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetMessagesQuery(threadId, 1, 2), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(3, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(2, result.PageSize);
    }

    [Fact]
    public async Task Handle_ShouldOrderMessagesBySentAtDescending()
    {
        // Arrange
        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var sender1 = Guid.NewGuid();
        var sender2 = Guid.NewGuid();
        var message1 = Message.Create(threadId, applicationId, sender1, "Sender1", UserRole.Admin, "Message 1");
        var message2 = Message.Create(threadId, applicationId, sender2, "Sender2", UserRole.Applicant, "Message 2");

        var repository = new MockMessageQueryRepository();
        repository.SetupGetByThreadId(threadId, new List<Message> { message1, message2 });
        var handler = new GetMessagesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetMessagesQuery(threadId, 1, 10), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Items.Count);
        // Most recent should be first
        Assert.True(result.Items[0].SentAt >= result.Items[1].SentAt);
    }
}

public class GetThreadByApplicationIdQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnThreadDto_WhenThreadExists()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var thread = MessageThread.Create(applicationId, "APP-123", Guid.NewGuid(), "Applicant");

        var repository = new MockMessageQueryRepository();
        repository.SetupGetThreadByApplicationId(applicationId, thread);
        var handler = new GetThreadByApplicationIdQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetThreadByApplicationIdQuery(applicationId), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(thread.Id, result.Id);
        Assert.Equal(applicationId, result.ApplicationId);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenThreadNotFound()
    {
        // Arrange
        var repository = new MockMessageQueryRepository();
        repository.SetupGetThreadByApplicationId(Guid.NewGuid(), null);
        var handler = new GetThreadByApplicationIdQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetThreadByApplicationIdQuery(Guid.NewGuid()), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class GetUnreadCountQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnUnreadCount()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var sender1 = Guid.NewGuid();
        var message1 = Message.Create(threadId, applicationId, sender1, "Sender1", UserRole.Admin, "Unread 1");
        var message2 = Message.Create(threadId, applicationId, userId, "Sender2", UserRole.Applicant, "Read");
        message2.MarkAsRead(userId);

        var repository = new MockMessageQueryRepository();
        repository.SetupGetAccessibleMessages(userId, UserRole.Admin, new List<Message> { message1, message2 });
        var handler = new GetUnreadCountQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetUnreadCountQuery(userId, UserRole.Admin), CancellationToken.None);

        // Assert
        Assert.Equal(1, result); // Only message1 is unread and not sent by userId
    }
}

// Mock repository for query handlers
public class MockMessageQueryRepository : IMessageRepository
{
    private readonly Dictionary<Guid, List<Message>> _messagesByThreadId = new();
    private readonly Dictionary<Guid, MessageThread?> _threadsByApplicationId = new();
    private readonly Dictionary<(Guid, UserRole), List<Message>> _accessibleMessages = new();

    public Task<Message?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Message?>(null);
    }

    public Task<List<Message>> GetByCaseIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<Message>());
    }

    public Task<List<Message>> GetByThreadIdAsync(Guid threadId, CancellationToken cancellationToken = default)
    {
        _messagesByThreadId.TryGetValue(threadId, out var messages);
        return Task.FromResult(messages ?? new List<Message>());
    }

    public Task<List<Message>> GetAccessibleMessagesForUserAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default)
    {
        _accessibleMessages.TryGetValue((userId, role), out var messages);
        return Task.FromResult(messages ?? new List<Message>());
    }

    public Task<List<Message>> GetAllMessagesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<Message>());
    }

    public Task<MessageThread?> GetThreadByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        _threadsByApplicationId.TryGetValue(applicationId, out var thread);
        return Task.FromResult(thread);
    }

    public Task<MessageThread?> GetThreadByIdAsync(Guid threadId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<MessageThread?>(null);
    }

    public Task<List<MessageThread>> GetThreadsForUserAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<MessageThread>());
    }

    public Task<List<MessageThread>> GetAllThreadsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<MessageThread>());
    }

    public Task AddAsync(Message message, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task AddThreadAsync(MessageThread thread, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Message message, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task UpdateThreadAsync(MessageThread thread, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public void SetupGetByThreadId(Guid threadId, List<Message> messages)
    {
        _messagesByThreadId[threadId] = messages;
    }

    public void SetupGetThreadByApplicationId(Guid applicationId, MessageThread? thread)
    {
        _threadsByApplicationId[applicationId] = thread;
    }

    public void SetupGetAccessibleMessages(Guid userId, UserRole role, List<Message> messages)
    {
        _accessibleMessages[(userId, role)] = messages;
    }
}

