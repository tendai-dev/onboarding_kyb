using OnboardingApi.Application.Commands;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Events;
using OnboardingApi.Infrastructure.EventBus;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.EventBus;

public class EventPublisherAdapterEdgeCaseTests
{
    [Fact]
    public async Task PublishAsync_ShouldThrow_WhenEventDoesNotImplementIDomainEvent()
    {
        // Arrange
        var eventBus = new MockEventBus();
        var adapter = new EventPublisherAdapter(eventBus);
        var nonDomainEvent = new { EventType = "Test", Data = "Data" };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            adapter.PublishAsync(nonDomainEvent, CancellationToken.None));
    }

    [Fact]
    public async Task PublishAsync_ShouldPublish_WhenEventImplementsIDomainEvent()
    {
        // Arrange
        var eventBus = new MockEventBus();
        var adapter = new EventPublisherAdapter(eventBus);
        var domainEvent = new TestDomainEventForAdapter();

        // Act
        await adapter.PublishAsync(domainEvent, CancellationToken.None);

        // Assert
        Assert.True(eventBus.PublishCalled);
        Assert.Equal(domainEvent, eventBus.LastPublishedEvent);
    }
}

public class TestDomainEventForAdapter : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

