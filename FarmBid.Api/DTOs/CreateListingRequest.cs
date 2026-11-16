using System.ComponentModel.DataAnnotations;

namespace FarmBid.Api.DTOs;

public class CreateListingRequest
{
    [StringLength(1000)]
    public string? Description { get; set; }

    [Range(0.01, 999999999)]
    public decimal Quantity { get; set; }

    [Required]
    [StringLength(30)]
    public string Unit { get; set; } = string.Empty;

    [Range(0.01, 999999999)]
    public decimal StartingPrice { get; set; }

    [Required]
    [StringLength(50)]
    public string Quality { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string Location { get; set; } = string.Empty;

    [Required]
    public DateTime HarvestDate { get; set; }

    [Required]
    public DateTime BidDeadline { get; set; }

    [Range(typeof(long), "1", "9223372036854775807")]
    public long CropId { get; set; }
}
