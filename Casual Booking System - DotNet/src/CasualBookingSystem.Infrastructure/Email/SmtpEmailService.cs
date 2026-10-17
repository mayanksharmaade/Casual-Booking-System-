using System.Net;
using System.Net.Mail;
using CasualBookingSystem.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CasualBookingSystem.Infrastructure.Email;

public class SmtpEmailService(IOptions<EmailSettings> options, ILogger<SmtpEmailService> logger) : IEmailService
{
    private readonly EmailSettings settings = options.Value;

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (!settings.Enabled)
        {
            logger.LogInformation("Email delivery disabled. Would send '{Subject}' to {To}.", subject, to);
            return;
        }

        if (string.IsNullOrWhiteSpace(settings.Host) || string.IsNullOrWhiteSpace(settings.FromEmail))
        {
            logger.LogWarning("Email is enabled but SMTP host/from address is not configured.");
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(settings.FromEmail, settings.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(to);

            using var client = new SmtpClient(settings.Host, settings.Port)
            {
                EnableSsl = settings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };

            if (!string.IsNullOrWhiteSpace(settings.Username))
                client.Credentials = new NetworkCredential(settings.Username, settings.Password);

            cancellationToken.ThrowIfCancellationRequested();
            await client.SendMailAsync(message);
        }
        catch (Exception ex)
        {
            // Email failure must never roll back a booking that was already created.
            logger.LogWarning(ex, "Unable to send email '{Subject}' to {To}.", subject, to);
        }
    }
}
