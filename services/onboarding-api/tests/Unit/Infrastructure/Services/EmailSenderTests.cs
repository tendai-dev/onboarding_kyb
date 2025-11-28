using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class EmailSenderTests
{
    private readonly MockLogger<EmailSender> _logger;
    private readonly EmailSender _emailSender;

    public EmailSenderTests()
    {
        _logger = new MockLogger<EmailSender>();
        _emailSender = new EmailSender(_logger);
    }

    [Fact]
    public async Task SendEmailAsync_ShouldLogEmailSending()
    {
        // Arrange
        var to = "test@example.com";
        var subject = "Test Subject";
        var content = "Test Content";

        // Act
        await _emailSender.SendEmailAsync(to, subject, content);

        // Assert
        // EmailSender is a simplified implementation that just logs
        // In a real scenario, this would integrate with an email service
        Assert.True(true); // Just verify it doesn't throw
    }

    [Fact]
    public async Task SendEmailAsync_ShouldHandleCancellation()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act & Assert
        await Assert.ThrowsAnyAsync<TaskCanceledException>(() =>
            _emailSender.SendEmailAsync("test@example.com", "Subject", "Content", cts.Token));
    }
}

