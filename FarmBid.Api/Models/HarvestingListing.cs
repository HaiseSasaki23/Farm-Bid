namespace FarmBid.Api.Models;

public class HarvestingListing
{
    public long Id { get; set; }

    public long FarmerId { get; set; }

    public long CropId { get; set; }

    public decimal Quantity { get; set; }

    public string Unit { get; set; } = string.Empty;

    public string? QualityGrade { get; set; }

    public decimal StartingPrice { get; set; }

    public string Location { get; set; } = string.Empty;

    public DateTime HarvestDate { get; set; }

    public DateTime BidDeadline { get; set; }

    public string? Description { get; set; }

    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Farmer { get; set; }

    public Crop? Crop { get; set; }

    public ICollection<Bid> Bids { get; set; } = new List<Bid>();

    public ICollection<ListingImage> Images { get; set; } = new List<ListingImage>();

    public ICollection<AiAnalysis> AiAnalyses { get; set; } = new List<AiAnalysis>();
}
