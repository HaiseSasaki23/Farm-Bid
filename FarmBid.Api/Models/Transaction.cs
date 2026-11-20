
namespace FarmBid.Api.Models;

public class Transaction
{
    public long Id { get; set; }

    public long BidId { get; set; }

    public decimal AgreedPrice { get; set; }

    public decimal AgreedQuantity { get; set; }

    public decimal TotalAmount { get; set; }

    public string TransactionStatus { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public Bid? Bid { get; set; }
}
