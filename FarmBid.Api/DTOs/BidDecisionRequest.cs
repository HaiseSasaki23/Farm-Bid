using System.ComponentModel.DataAnnotations;

namespace FarmBid.Api.DTOs;

public class BidDecisionRequest
{
    [Required]
    public string Decision { get; set; } = string.Empty;
}
