using System.ComponentModel.DataAnnotations;

namespace FarmBid.Api.DTOs;

public class CreateBidRequest
{
    [Range(typeof(long), "1", "9223372036854775807")]
    public long ListingId { get; set; }

    [Range(0.01, 999999999)]
    public decimal OfferedPrice { get; set; }

    [Range(0.01, 999999999)]
    public decimal RequestedQuantity { get; set; }

    [StringLength(500)]
    public string? Message { get; set; }
}
