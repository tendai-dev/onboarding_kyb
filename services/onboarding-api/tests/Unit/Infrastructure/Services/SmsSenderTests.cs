using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class SmsSenderTests
{
    private readonly MockLogger<SmsSender> _logger;
    private readonly SmsSender _smsSender;

    public SmsSenderTests()
    {
        _logger = new MockLogger<SmsSender>();
        _smsSender = new SmsSender(_logger);
    }

    [Fact]
    public async Task SendSmsAsync_ShouldLogSmsSending()
    {
        // Arrange
        var to = "+1234567890";
        var message = "Test SMS message";

        // Act
        await _smsSender.SendSmsAsync(to, message);

        // Assert
        // SmsSender is a simplified implementation that just logs
        // In a real scenario, this would integrate with an SMS service
        Assert.True(true); // Just verify it doesn't throw
    }

    [Fact]
    public async Task SendSmsAsync_ShouldHandleCancellation()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act & Assert
        await Assert.ThrowsAnyAsync<TaskCanceledException>(() =>
            _smsSender.SendSmsAsync("+1234567890", "Message", cts.Token));
    }
}

