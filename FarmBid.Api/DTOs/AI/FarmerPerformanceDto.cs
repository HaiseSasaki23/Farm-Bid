
namespace FarmBid.Api.DTOs.AI;

public class FarmerPerformanceDto
{
    public string FarmerName { get; set; } = string.Empty;

    public int TotalListings { get; set; }

    public int ActiveListings { get; set; }

    public decimal TotalQuantityListedKg { get; set; }

    public int TotalBidsReceived { get; set; }

    public int CompletedTransactions { get; set; }

    public decimal TotalSalesValue { get; set; }
}
