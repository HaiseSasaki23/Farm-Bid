
namespace FarmBid.Api.DTOs.AI;

public class MarketOverviewDto
{
    public int ActiveListings { get; set; }

    public decimal TotalListedQuantityKg { get; set; }

    public int TotalBids { get; set; }

    public int CompletedTransactions { get; set; }

    public decimal TotalSalesValue { get; set; }
}
