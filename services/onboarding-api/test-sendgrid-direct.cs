using System;
using System.Threading.Tasks;
using SendGrid;
using SendGrid.Helpers.Mail;

class Program
{
    static async Task Main()
    {
        var apiKey = "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";
        var fromEmail = "tendai@kurasika.tech";
        var fromName = "Mukuru Onboarding";
        var toEmail = "tendai@kurasika.tech";
        var subject = "Test Email from Mukuru Onboarding API";

        var htmlContent = $@"
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Test Email</title>
</head>
<body style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"">
    <div style=""background-color: #FF6B35; padding: 20px; text-align: center;"">
        <h1 style=""color: white; margin: 0;"">Test Email</h1>
    </div>
    
    <div style=""background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;"">
        <p>This is a test email from the Mukuru Onboarding system.</p>
        
        <p><strong>Timestamp:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
        <p><strong>Recipient:</strong> {toEmail}</p>
        <p><strong>Sender:</strong> {fromEmail}</p>
        
        <p>If you received this email, your SendGrid integration is working correctly!</p>
        
        <p>Best regards,<br>The Mukuru Onboarding Team</p>
    </div>
    
    <div style=""margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #666;"">
        <p>This is a test message. Please do not reply to this email.</p>
    </div>
</body>
</html>";

        var plainTextContent = $@"Test Email

This is a test email from the Mukuru Onboarding system.

Timestamp: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC
Recipient: {toEmail}
Sender: {fromEmail}

If you received this email, your SendGrid integration is working correctly!

Best regards,
The Mukuru Onboarding Team";

        try
        {
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail, fromName);
            var to = new EmailAddress(toEmail);
            
            var msg = MailHelper.CreateSingleEmail(
                from,
                to,
                subject,
                plainTextContent,
                htmlContent);

            Console.WriteLine($"Sending email from {fromEmail} to {toEmail}...");
            var response = await client.SendEmailAsync(msg);

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"✅ SUCCESS! Email sent successfully!");
                Console.WriteLine($"Status Code: {response.StatusCode}");
                Console.WriteLine($"Response Headers: {string.Join(", ", response.Headers)}");
            }
            else
            {
                var errorBody = await response.Body.ReadAsStringAsync();
                Console.WriteLine($"❌ FAILED to send email");
                Console.WriteLine($"Status Code: {response.StatusCode}");
                Console.WriteLine($"Error: {errorBody}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ ERROR: {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
        }
    }
}

