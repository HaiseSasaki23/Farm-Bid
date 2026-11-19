
namespace FarmBid.Api.DTOs.AI;

public class PriceTrendDto
{
    public string CropName { get; set; } = string.Empty;

    public int Year { get; set; }

    public int Month { get; set; }

    public decimal AverageStartingPrice { get; set; }

    public decimal LowestStartingPrice { get; set; }

    public decimal HighestStartingPrice { get; set; }

    public int TotalListings { get; set; }
}
