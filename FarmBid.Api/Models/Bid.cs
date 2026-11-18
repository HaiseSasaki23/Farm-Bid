namespace FarmBid.Api.Models;

public class Bid
{
    public long Id { get; set; }

    public long ListingId { get; set; }

    public long BuyerId { get; set; }

    public decimal OfferedPrice { get; set; }

    public decimal RequestedQuantity { get; set; }

    public string? Message { get; set; }

    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public HarvestingListing? Listing { get; set; }

    public User? Buyer { get; set; }

    public Transaction? Transaction { get; set; }
}
