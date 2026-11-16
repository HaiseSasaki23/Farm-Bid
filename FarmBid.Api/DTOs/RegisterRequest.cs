using System.ComponentModel.DataAnnotations;
using FarmBid.Api.Models;

namespace FarmBid.Api.DTOs;

public class RegisterRequest
{
    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [StringLength(20)]
    public string? PhoneNumber { get; set; }

    [Required]
    [EnumDataType(typeof(UserRole))]
    public UserRole Role { get; set; }
}
