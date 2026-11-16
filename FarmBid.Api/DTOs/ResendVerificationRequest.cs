using System.ComponentModel.DataAnnotations;

namespace FarmBid.Api.DTOs;

public class ResendVerificationRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
