using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Events;
using OnboardingApi.Infrastructure.EventBus;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.EventBus;

public class EventPublisherAdapterTests
{
    [Fact]
    public async Task PublishAsync_ShouldPublishDomainEvent_WhenEventImplementsIDomainEvent()
    {
        // Arrange
        var mockEventBus = new MockEventBus();
        var adapter = new EventPublisherAdapter(mockEventBus);
        var domainEvent = new TestDomainEvent();

        // Act
        await adapter.PublishAsync(domainEvent, CancellationToken.None);

        // Assert
        Assert.True(mockEventBus.PublishCalled);
        Assert.Equal(domainEvent, mockEventBus.LastPublishedEvent);
    }

    [Fact]
    public async Task PublishAsync_ShouldThrow_WhenEventDoesNotImplementIDomainEvent()
    {
        // Arrange
        var mockEventBus = new MockEventBus();
        var adapter = new EventPublisherAdapter(mockEventBus);
        var nonDomainEvent = new { Test = "value" };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            adapter.PublishAsync(nonDomainEvent, CancellationToken.None));
    }
}

public class MockEventBus : IEventBus
{
    public bool PublishCalled { get; private set; }
    public IDomainEvent? LastPublishedEvent { get; private set; }

    public Task PublishAsync<TEvent>(TEvent domainEvent, CancellationToken cancellationToken = default) where TEvent : IDomainEvent
    {
        PublishCalled = true;
        LastPublishedEvent = domainEvent;
        return Task.CompletedTask;
    }

    Task IEventBus.PublishIntegrationEventAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}

public class TestDomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

