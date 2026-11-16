namespace FarmBid.Api.Models;

public class ListingImage
{
    public long Id { get; set; }

    public long ListingId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public HarvestingListing? Listing { get; set; }
}
