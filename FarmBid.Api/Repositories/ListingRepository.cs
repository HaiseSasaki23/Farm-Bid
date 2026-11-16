using FarmBid.Api.Data;
using FarmBid.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmBid.Api.Repositories;

public class ListingRepository
{
    private readonly FarmBidDbContext _context;

    public ListingRepository(FarmBidDbContext context)
    {
        _context = context;
    }

    // Get all listings with Farmer and Crop details
    public async Task<List<HarvestingListing>> GetAllAsync()
    {
        return await _context.HarvestingListings
            .AsNoTracking()
            .Include(l => l.Crop)
            .Include(l => l.Farmer)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }

    // Get listing by ID with Farmer and Crop details
    public async Task<HarvestingListing?> GetByIdAsync(long id)
    {
        return await _context.HarvestingListings
            .AsNoTracking()
            .Include(l => l.Crop)
            .Include(l => l.Farmer)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    // Get tracked listing for updating or deleting
    public async Task<HarvestingListing?> GetByIdForUpdateAsync(long id)
    {
        return await _context.HarvestingListings
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    // Check if crop exists
    public async Task<bool> CropExistsAsync(long cropId)
    {
        return await _context.Crops
            .AnyAsync(c => c.Id == cropId);
    }

    // Check if listing has existing bids or transactions
    public async Task<bool> HasRelatedRecordsAsync(long listingId)
    {
        var hasBids = await _context.Bids
            .AnyAsync(b => b.ListingId == listingId);

        var hasTransactions = await _context.Transactions
            .AnyAsync(t => t.Bid != null &&
                           t.Bid.ListingId == listingId);

        return hasBids || hasTransactions;
    }

    // Add new listing
    public async Task AddAsync(HarvestingListing listing)
    {
        await _context.HarvestingListings.AddAsync(listing);
        await _context.SaveChangesAsync();
    }

    // Delete listing
    public async Task DeleteAsync(HarvestingListing listing)
    {
        _context.HarvestingListings.Remove(listing);
        await _context.SaveChangesAsync();
    }

    // Save changes
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
