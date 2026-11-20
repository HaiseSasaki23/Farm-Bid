namespace FarmBid.Api.Models;

public class Crop
{
    public long Id { get; set; }

    public long CategoryId { get; set; }

    public string CropName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public CropCategory? Category { get; set; }

    public ICollection<HarvestingListing> HarvestingListings { get; set; }
        = new List<HarvestingListing>();
}
