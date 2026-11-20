
namespace FarmBid.Api.Models;


public class User
{
    public long Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public UserRole Role { get; set; }

    public AccountStatus AccountStatus { get; set; } = AccountStatus.Pending;

    public string? EmailVerificationCodeHash { get; set; }

    public int EmailVerificationAttempts { get; set; } = 0;

    public DateTime? EmailVerificationExpiresAt { get; set; }

    public DateTime? EmailVerificationSentAt { get; set; }

    public DateTime? EmailVerifiedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AiMarketReport> GeneratedReports { get; set; }
    = new List<AiMarketReport>();
}

public enum UserRole
{
    Farmer,
    Buyer
}

public enum AccountStatus
{
    Active,
    Pending,
    Disabled
}
