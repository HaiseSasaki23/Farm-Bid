using FarmBid.Api.Data;
using FarmBid.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmBid.Api.Repositories;

public class BidRepository
{
    private readonly FarmBidDbContext _context;

    public BidRepository(FarmBidDbContext context)
    {
        _context = context;
    }

    // Get all bids with related details
    public async Task<List<Bid>> GetAllAsync()
    {
        return await _context.Bids
            .AsNoTracking()
            .Include(b => b.Listing)
                .ThenInclude(l => l!.Crop)
            .Include(b => b.Buyer)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    // Get bid by ID
    public async Task<Bid?> GetByIdAsync(long id)
    {
        return await _context.Bids
            .AsNoTracking()
            .Include(b => b.Listing)
                .ThenInclude(l => l!.Crop)
            .Include(b => b.Buyer)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    // Get tracked bid for decision processing
    public async Task<Bid?> GetByIdForDecisionAsync(long id)
    {
        return await _context.Bids
            .Include(b => b.Listing)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    // Get listing by ID
    public async Task<HarvestingListing?> GetListingByIdAsync(
        long listingId)
    {
        return await _context.HarvestingListings
            .FirstOrDefaultAsync(l => l.Id == listingId);
    }

    // Check if another bid has already been accepted
    public async Task<bool> HasAcceptedBidAsync(
        long listingId,
        long excludedBidId)
    {
        return await _context.Bids
            .AnyAsync(b =>
                b.ListingId == listingId &&
                b.Id != excludedBidId &&
                b.Status == "Accepted");
    }

    // Reject other pending bids
    public async Task RejectOtherPendingBidsAsync(
        long listingId,
        long acceptedBidId)
    {
        var pendingBids = await _context.Bids
            .Where(b =>
                b.ListingId == listingId &&
                b.Id != acceptedBidId &&
                b.Status == "Pending")
            .ToListAsync();

        foreach (var bid in pendingBids)
        {
            bid.Status = "Rejected";
            bid.UpdatedAt = DateTime.UtcNow;
        }
    }

    // Add new bid
    public async Task AddAsync(Bid bid)
    {
        await _context.Bids.AddAsync(bid);
        await _context.SaveChangesAsync();
    }

    // Save changes
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
