namespace FarmBid.Api.DTOs;

/// <summary>Safe profile data for the authenticated browser session.</summary>
public sealed class CurrentUserResponseDto
{
    public long Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string AccountStatus { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
