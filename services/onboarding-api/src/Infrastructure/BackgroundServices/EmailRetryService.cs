using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Services;

namespace OnboardingApi.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that processes failed emails from the dead letter queue.
/// Runs periodically to retry sending emails that previously failed.
/// </summary>
public class EmailRetryService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailRetryService> _logger;
    private readonly TimeSpan _processingInterval = TimeSpan.FromMinutes(5);

    public EmailRetryService(
        IServiceScopeFactory scopeFactory,
        ILogger<EmailRetryService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email retry service started. Processing interval: {Interval}",
            _processingInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessFailedEmailsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing failed emails");
            }

            await Task.Delay(_processingInterval, stoppingToken);
        }

        _logger.LogInformation("Email retry service stopped");
    }

    private async Task ProcessFailedEmailsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var deadLetterQueue = scope.ServiceProvider.GetRequiredService<IEmailDeadLetterQueue>();
        var emailSender = scope.ServiceProvider.GetRequiredService<SendGridEmailSender>();

        var failedEmails = await deadLetterQueue.DequeueAsync(10, cancellationToken);

        if (failedEmails.Count == 0)
        {
            _logger.LogDebug("No failed emails to process");
            return;
        }

        _logger.LogInformation("Processing {Count} failed emails", failedEmails.Count);

        foreach (var email in failedEmails)
        {
            try
            {
                await emailSender.SendEmailAsync(
                    email.To,
                    email.Subject,
                    email.Content,
                    cancellationToken);

                await deadLetterQueue.MarkAsProcessedAsync(email.Id, cancellationToken);

                _logger.LogInformation(
                    "Successfully resent email {Id} to {To} (attempt {Attempt})",
                    email.Id, email.To, email.RetryCount + 1);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to resend email {Id} to {To} (attempt {Attempt})",
                    email.Id, email.To, email.RetryCount + 1);

                await deadLetterQueue.IncrementRetryCountAsync(email.Id, ex.Message, cancellationToken);
            }
        }
    }
}
