namespace FarmBid.Api.Models;

public class AiAnalysis
{
    public long Id { get; set; }

    public long ListingId { get; set; }

    public long GeneratedBy { get; set; }

    public string AnalysisResult { get; set; } = string.Empty;

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public HarvestingListing? Listing { get; set; }

    public User? GeneratedByUser { get; set; }
}
