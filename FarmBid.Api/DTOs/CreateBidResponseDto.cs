namespace FarmBid.Api.DTOs;

public class CreatedBidResponseDto
{
    public long Id { get; set; }
    public long ListingId { get; set; }
    public long BuyerId { get; set; }
    public decimal OfferedPrice { get; set; }
    public decimal RequestedQuantity { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
