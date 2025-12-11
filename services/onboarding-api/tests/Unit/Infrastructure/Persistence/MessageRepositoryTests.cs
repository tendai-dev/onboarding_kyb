using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Messaging;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class MessageRepositoryTests
{
    private readonly MockLogger<MessageRepository> _logger;

    public MessageRepositoryTests()
    {
        _logger = new MockLogger<MessageRepository>();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnMessage_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var message = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender", UserRole.Admin, "Test message");

        context.Set<Message>().Add(message);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByIdAsync(message.Id, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(message.Id, result.Id);
    }

    [Fact]
    public async Task GetByCaseIdAsync_ShouldReturnMessages()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var applicationId = Guid.NewGuid();
        var threadId = Guid.NewGuid();
        var message1 = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender1", UserRole.Admin, "Message 1");
        var message2 = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender2", UserRole.Applicant, "Message 2");
        var message3 = Message.Create(threadId, Guid.NewGuid(), Guid.NewGuid(), "Sender3", UserRole.Admin, "Message 3");

        context.Set<Message>().AddRange(message1, message2, message3);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByCaseIdAsync(applicationId, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, m => Assert.Equal(applicationId, m.ApplicationId));
    }

    [Fact]
    public async Task GetByThreadIdAsync_ShouldReturnMessages()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var message1 = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender1", UserRole.Admin, "Message 1");
        var message2 = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender2", UserRole.Applicant, "Message 2");
        var message3 = Message.Create(Guid.NewGuid(), applicationId, Guid.NewGuid(), "Sender3", UserRole.Admin, "Message 3");

        context.Set<Message>().AddRange(message1, message2, message3);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByThreadIdAsync(threadId, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, m => Assert.Equal(threadId, m.ThreadId));
    }

    [Fact]
    public async Task GetAccessibleMessagesForUserAsync_ShouldReturnAllMessages_WhenAdmin()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var message1 = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender1", UserRole.Admin, "Message 1");
        var message2 = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender2", UserRole.Applicant, "Message 2");

        context.Set<Message>().AddRange(message1, message2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAccessibleMessagesForUserAsync(Guid.NewGuid(), UserRole.Admin, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAccessibleMessagesForUserAsync_ShouldReturnUserMessages_WhenRegularUser()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var userId = Guid.NewGuid();
        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var message1 = Message.Create(threadId, applicationId, userId, "Sender1", UserRole.Applicant, "Message 1");
        var message2 = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender2", UserRole.Admin, "Message 2");

        context.Set<Message>().AddRange(message1, message2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAccessibleMessagesForUserAsync(userId, UserRole.Applicant, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(userId, result[0].SenderId);
    }

    [Fact]
    public async Task GetThreadByApplicationIdAsync_ShouldReturnThread_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var applicationId = Guid.NewGuid();
        var thread = MessageThread.Create(applicationId, "APP-123", Guid.NewGuid(), "Applicant Name");

        context.Set<MessageThread>().Add(thread);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetThreadByApplicationIdAsync(applicationId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(applicationId, result.ApplicationId);
    }

    [Fact]
    public async Task GetThreadsForUserAsync_ShouldReturnAllThreads_WhenAdmin()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var thread1 = MessageThread.Create(Guid.NewGuid(), "APP-123", Guid.NewGuid(), "Applicant 1");
        var thread2 = MessageThread.Create(Guid.NewGuid(), "APP-456", Guid.NewGuid(), "Applicant 2");

        context.Set<MessageThread>().AddRange(thread1, thread2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetThreadsForUserAsync(Guid.NewGuid(), UserRole.Admin, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task AddAsync_ShouldAddMessage()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var threadId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var message = Message.Create(threadId, applicationId, Guid.NewGuid(), "Sender", UserRole.Admin, "Test message");

        // Act
        await repository.AddAsync(message, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(message.Id, CancellationToken.None);
        Assert.NotNull(result);
    }

    [Fact]
    public async Task AddThreadAsync_ShouldAddThread()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MessagingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new MessagingDbContext(options);
        var repository = new MessageRepository(context, _logger);

        var thread = MessageThread.Create(Guid.NewGuid(), "APP-123", Guid.NewGuid(), "Applicant Name");

        // Act
        await repository.AddThreadAsync(thread, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetThreadByIdAsync(thread.Id, CancellationToken.None);
        Assert.NotNull(result);
    }
}

