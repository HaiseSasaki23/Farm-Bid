namespace FarmBid.Api.DTOs;

public class ListingResponseDto
{
    public long Id { get; set; }
    public long FarmerId { get; set; }
    public long CropId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal StartingPrice { get; set; }

    public string Quality { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;

    public DateTime HarvestDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = string.Empty;

    public FarmerSummaryDto? Farmer { get; set; }
    public CropSummaryDto? Crop { get; set; }
}

public class FarmerSummaryDto
{
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
}

public class CropSummaryDto
{
    public long Id { get; set; }
    public string CropName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
