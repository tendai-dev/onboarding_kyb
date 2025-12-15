using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Notification.Interfaces;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// SendGrid implementation of IEmailSender
/// Sends emails using SendGrid API
/// </summary>
public class SendGridEmailSender : IEmailSender
{
    private readonly ILogger<SendGridEmailSender> _logger;
    private readonly IConfiguration _configuration;
    private readonly string? _apiKey;
    private readonly string? _fromEmail;
    private readonly string? _fromName;

    public SendGridEmailSender(
        ILogger<SendGridEmailSender> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _apiKey = _configuration["SendGrid:ApiKey"] ?? _configuration["SENDGRID_API_KEY"];
        _fromEmail = _configuration["SendGrid:FromEmail"] ?? _configuration["SENDGRID_FROM_EMAIL"] ?? "tendai@kurasika.tech";
        _fromName = _configuration["SendGrid:FromName"] ?? _configuration["SENDGRID_FROM_NAME"] ?? "Mukuru Onboarding";
    }

    public async Task SendEmailAsync(
        string to,
        string subject,
        string content,
        CancellationToken cancellationToken = default)
    {
        // If no API key is configured, log and skip (for development)
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning(
                "SendGrid API key not configured. Email to {To} with subject '{Subject}' was not sent. " +
                "Set SENDGRID_API_KEY environment variable to enable email sending.",
                to,
                subject);
            return;
        }

        try
        {
            var client = new SendGridClient(_apiKey);
            var from = new EmailAddress(_fromEmail, _fromName);
            var toAddress = new EmailAddress(to);
            
            // Determine if content is HTML or plain text
            var isHtml = content.Contains("<html") || content.Contains("<div") || content.Contains("<p>");
            
            var msg = MailHelper.CreateSingleEmail(
                from,
                toAddress,
                subject,
                isHtml ? null : content, // Plain text version
                isHtml ? content : null); // HTML version

            var response = await client.SendEmailAsync(msg, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation(
                    "Email sent successfully to {To} with subject '{Subject}' via SendGrid",
                    to,
                    subject);
            }
            else
            {
                var errorBody = await response.Body.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to send email to {To} via SendGrid. Status: {Status}, Body: {Body}",
                    to,
                    response.StatusCode,
                    errorBody);
                throw new Exception($"SendGrid API returned status {response.StatusCode}: {errorBody}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Exception while sending email to {To} via SendGrid with subject '{Subject}'",
                to,
                subject);
            throw;
        }
    }

    /// <summary>
    /// Send email with HTML content
    /// </summary>
    public async Task SendHtmlEmailAsync(
        string to,
        string subject,
        string htmlContent,
        string? plainTextContent = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning(
                "SendGrid API key not configured. Email to {To} with subject '{Subject}' was not sent.",
                to,
                subject);
            return;
        }

        try
        {
            var client = new SendGridClient(_apiKey);
            var from = new EmailAddress(_fromEmail, _fromName);
            var toAddress = new EmailAddress(to);
            
            var msg = MailHelper.CreateSingleEmail(
                from,
                toAddress,
                subject,
                plainTextContent ?? "Please view this email in an HTML-capable email client.",
                htmlContent);

            var response = await client.SendEmailAsync(msg, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation(
                    "HTML email sent successfully to {To} with subject '{Subject}' via SendGrid",
                    to,
                    subject);
            }
            else
            {
                var errorBody = await response.Body.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to send HTML email to {To} via SendGrid. Status: {Status}, Body: {Body}",
                    to,
                    response.StatusCode,
                    errorBody);
                throw new Exception($"SendGrid API returned status {response.StatusCode}: {errorBody}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Exception while sending HTML email to {To} via SendGrid with subject '{Subject}'",
                to,
                subject);
            throw;
        }
    }
}

