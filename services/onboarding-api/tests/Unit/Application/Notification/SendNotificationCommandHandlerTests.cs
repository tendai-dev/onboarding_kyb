using OnboardingApi.Application.Notification.Commands;
using OnboardingApi.Application.Notification.Interfaces;
using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Notification;

public class SendNotificationCommandHandlerTests
{
    private readonly MockNotificationRepository _repositoryMock;
    private readonly MockNotificationSender _senderMock;
    private readonly SendNotificationCommandHandler _handler;

    public SendNotificationCommandHandlerTests()
    {
        _repositoryMock = new MockNotificationRepository();
        _senderMock = new MockNotificationSender();
        _handler = new SendNotificationCommandHandler(_repositoryMock, _senderMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateAndSendNotification_WhenNotScheduled()
    {
        // Arrange
        var command = new SendNotificationCommand(
            Type: NotificationType.Welcome,
            Channel: NotificationChannel.Email,
            Recipient: "test@example.com",
            Subject: "Test Subject",
            Content: "Test Content",
            Priority: NotificationPriority.High,
            CaseId: Guid.NewGuid().ToString(),
            PartnerId: Guid.NewGuid().ToString()
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.NotificationId);
        Assert.Equal("Pending", result.Status);
        Assert.Single(_senderMock.SentNotifications);
    }

    [Fact]
    public async Task Handle_ShouldCreateButNotSend_WhenScheduled()
    {
        // Arrange
        var scheduledAt = DateTime.UtcNow.AddHours(1);
        var command = new SendNotificationCommand(
            Type: NotificationType.Welcome,
            Channel: NotificationChannel.Email,
            Recipient: "test@example.com",
            Subject: "Test Subject",
            Content: "Test Content",
            ScheduledAt: scheduledAt
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(_senderMock.SentNotifications); // Should not send immediately
    }
}

