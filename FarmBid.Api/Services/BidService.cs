
using FarmBid.Api.DTOs;
using FarmBid.Api.Models;
using FarmBid.Api.Repositories;

namespace FarmBid.Api.Services;

public class BidService
{
    private readonly BidRepository _bidRepository;

    public BidService(BidRepository bidRepository)
    {
        _bidRepository = bidRepository;
    }

    // Get bids based on user role
    public async Task<List<object>> GetAllAsync(
        long userId,
        string? role)
    {
        var bids = await _bidRepository.GetAllAsync();

        var filteredBids = role switch
        {
            "Farmer" => bids.Where(b =>
                b.Listing?.FarmerId == userId),

            "Buyer" => bids.Where(b =>
                b.BuyerId == userId),

            _ => throw new UnauthorizedAccessException(
                "You are not allowed to view bids.")
        };

        return filteredBids.Select(MapBid).ToList();
    }

    // Get bid by ID
    public async Task<object?> GetByIdAsync(
        long id,
        long userId,
        string? role)
    {
        var bid = await _bidRepository.GetByIdAsync(id);

        if (bid == null)
            return null;

        if (role == "Buyer" && bid.BuyerId != userId)
            throw new UnauthorizedAccessException(
                "You are not allowed to view this bid.");

        if (role == "Farmer" && bid.Listing?.FarmerId != userId)
            throw new UnauthorizedAccessException(
                "You are not allowed to view this bid.");

        if (role != "Buyer" && role != "Farmer")
            throw new UnauthorizedAccessException(
                "You are not allowed to view bids.");

        return MapBid(bid);
    }

    // Create bid
    public async Task<CreatedBidResponseDto> CreateAsync(
        CreateBidRequest request,
        long buyerId)
    {
        var listing = await _bidRepository.GetListingByIdAsync(
            request.ListingId);

        if (listing == null)
            throw new KeyNotFoundException("Listing not found.");

        if (listing.Status != "Active")
            throw new ArgumentException(
                "This listing is not available for bidding.");

        if (listing.BidDeadline <= DateTime.UtcNow)
            throw new ArgumentException(
                "The bidding deadline for this listing has passed.");

        if (listing.FarmerId == buyerId)
            throw new ArgumentException(
                "You cannot bid on your own listing.");

        var hasAcceptedBid =
            await _bidRepository.HasAcceptedBidAsync(
                listing.Id, 0);

        if (hasAcceptedBid)
            throw new InvalidOperationException(
                "This listing already has an accepted bid.");

        if (request.RequestedQuantity <= 0 ||
            request.RequestedQuantity > listing.Quantity)
            throw new ArgumentException(
                "Requested quantity must be greater than zero and cannot exceed the listing quantity.");

        if (request.OfferedPrice <= 0)
            throw new ArgumentException(
                "Offered price must be greater than zero.");

        var bid = new Bid
        {
            ListingId = request.ListingId,
            BuyerId = buyerId,
            OfferedPrice = request.OfferedPrice,
            RequestedQuantity = request.RequestedQuantity,
            Message = request.Message?.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _bidRepository.AddAsync(bid);

        return new CreatedBidResponseDto
        {
            Id = bid.Id,
            ListingId = bid.ListingId,
            BuyerId = bid.BuyerId,
            OfferedPrice = bid.OfferedPrice,
            RequestedQuantity = bid.RequestedQuantity,
            Message = bid.Message ?? string.Empty,
            Status = bid.Status,
            CreatedAt = bid.CreatedAt
        };
    }

    // Accept or reject bid
    public async Task<object> DecideAsync(
        long id,
        long farmerId,
        string decision)
    {
        if (string.IsNullOrWhiteSpace(decision))
            throw new ArgumentException(
                "Decision must be Accept or Reject.");

        var normalizedDecision = decision.Trim();

        if (!normalizedDecision.Equals(
                "Accept", StringComparison.OrdinalIgnoreCase) &&
            !normalizedDecision.Equals(
                "Reject", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException(
                "Decision must be Accept or Reject.");

        var bid = await _bidRepository.GetByIdForDecisionAsync(id);

        if (bid == null)
            throw new KeyNotFoundException("Bid not found.");

        if (bid.Listing == null ||
            bid.Listing.FarmerId != farmerId)
            throw new UnauthorizedAccessException(
                "You are not allowed to process this bid.");

        if (bid.Status != "Pending")
            throw new InvalidOperationException(
                "This bid has already been processed.");

        if (normalizedDecision.Equals(
            "Accept", StringComparison.OrdinalIgnoreCase))
        {
            if (bid.Listing.Status != "Active")
                throw new InvalidOperationException(
                    "This listing is no longer available.");

            if (bid.Listing.BidDeadline <= DateTime.UtcNow)
                throw new InvalidOperationException(
                    "The bidding deadline for this listing has passed.");

            var hasAcceptedBid =
                await _bidRepository.HasAcceptedBidAsync(
                    bid.ListingId, bid.Id);

            if (hasAcceptedBid)
                throw new InvalidOperationException(
                    "Another bid has already been accepted for this listing.");

            bid.Status = "Accepted";

            await _bidRepository.RejectOtherPendingBidsAsync(
                bid.ListingId, bid.Id);
        }
        else
        {
            bid.Status = "Rejected";
        }

        bid.UpdatedAt = DateTime.UtcNow;

        await _bidRepository.SaveChangesAsync();

        return new
        {
            message = $"Bid {bid.Status.ToLower()} successfully.",
            bid.Id,
            bid.Status
        };
    }

    // Buyers may withdraw only their own pending offers. Accepted offers are
    // part of a transaction and must remain immutable.
    public async Task<object> CancelAsync(long id, long buyerId)
    {
        var bid = await _bidRepository.GetByIdForDecisionAsync(id);

        if (bid == null)
            throw new KeyNotFoundException("Bid not found.");

        if (bid.BuyerId != buyerId)
            throw new UnauthorizedAccessException(
                "You are not allowed to cancel this bid.");

        if (bid.Status != "Pending")
            throw new InvalidOperationException(
                "Only pending bids can be cancelled.");

        bid.Status = "Cancelled";
        bid.UpdatedAt = DateTime.UtcNow;

        await _bidRepository.SaveChangesAsync();

        return new
        {
            message = "Bid cancelled successfully.",
            bid.Id,
            bid.Status,
            bid.UpdatedAt
        };
    }

    // Map bid to safe response
    private static object MapBid(Bid bid)
    {
        return new
        {
            bid.Id,
            bid.ListingId,
            ListingTitle = bid.Listing?.Crop?.CropName ?? "Unknown Crop",
            CropName = bid.Listing?.Crop?.CropName,
            bid.BuyerId,
            BuyerName = bid.Buyer?.FullName,
            bid.OfferedPrice,
            bid.RequestedQuantity,
            bid.Message,
            bid.Status,
            bid.CreatedAt,
            bid.UpdatedAt
        };
    }
}
