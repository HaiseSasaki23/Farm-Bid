using System.Net;
using System.Net.Mail;

namespace FarmBid.Api.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendVerificationCodeAsync(
        string recipientEmail,
        string verificationCode)
    {
        var username = _configuration["EmailSettings:Username"]
            ?? throw new InvalidOperationException(
                "SMTP username is missing.");

        var appPassword = _configuration["EmailSettings:AppPassword"]
            ?? throw new InvalidOperationException(
                "SMTP app password is missing.");

        using var message = new MailMessage();
        message.From = new MailAddress(username, "FarmBid");
        message.To.Add(recipientEmail);
        message.Subject = "FarmBid Email Verification";

        message.Body = $"""
            Hello!

            Thank you for registering with FarmBid.

            Your email verification code is:

            {verificationCode}

            This code will expire in 10 minutes.

            If you did not create a FarmBid account, please ignore this email.

            FarmBid Team
            """;

        using var smtp = new SmtpClient("smtp.gmail.com", 587)
        {
            Credentials = new NetworkCredential(username, appPassword),
            EnableSsl = true
        };

        await smtp.SendMailAsync(message);
    }
}
