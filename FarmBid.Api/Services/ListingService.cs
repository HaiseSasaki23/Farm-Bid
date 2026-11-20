
using FarmBid.Api.DTOs;
using FarmBid.Api.Models;
using FarmBid.Api.Repositories;

namespace FarmBid.Api.Services;

public class ListingService
{
    private readonly ListingRepository _listingRepository;

    public ListingService(ListingRepository listingRepository)
    {
        _listingRepository = listingRepository;
    }

    // Convert database model into a response DTO
    private static ListingResponseDto MapListing(HarvestingListing listing)
    {
        return new ListingResponseDto
        {
            Id = listing.Id,
            FarmerId = listing.FarmerId,
            CropId = listing.CropId,
            Title = listing.Crop?.CropName ?? "Unknown Crop",
            Description = listing.Description ?? string.Empty,
            Quantity = listing.Quantity,
            Unit = listing.Unit,
            StartingPrice = listing.StartingPrice,
            Quality = listing.QualityGrade ?? string.Empty,
            Location = listing.Location,
            HarvestDate = listing.HarvestDate,
            CreatedAt = listing.CreatedAt,
            Status = listing.Status,

            Farmer = listing.Farmer == null ? null : new FarmerSummaryDto
            {
                Id = listing.Farmer.Id,
                FullName = listing.Farmer.FullName
            },

            Crop = listing.Crop == null ? null : new CropSummaryDto
            {
                Id = listing.Crop.Id,
                CropName = listing.Crop.CropName,
                Description = listing.Crop.Description ?? string.Empty
            }
        };
    }

    // Get all listings
    public async Task<List<ListingResponseDto>> GetAllAsync()
    {
        var listings = await _listingRepository.GetAllAsync();
        return listings.Select(MapListing).ToList();
    }

    // Get listing by ID
    public async Task<ListingResponseDto?> GetByIdAsync(long id)
    {
        var listing = await _listingRepository.GetByIdAsync(id);
        return listing == null ? null : MapListing(listing);
    }

    // Create listing
    public async Task<ListingResponseDto> CreateAsync(
        CreateListingRequest request,
        long farmerId)
    {
        var cropExists = await _listingRepository.CropExistsAsync(request.CropId);

        if (!cropExists)
            throw new ArgumentException("Selected crop does not exist.");

        if (request.HarvestDate.Date < DateTime.UtcNow.Date)
            throw new ArgumentException("Harvest date cannot be in the past.");

        if (request.BidDeadline <= DateTime.UtcNow)
            throw new ArgumentException("Bid deadline must be in the future.");

        var listing = new HarvestingListing
        {
            FarmerId = farmerId,
            CropId = request.CropId,
            Description = request.Description?.Trim(),
            Quantity = request.Quantity,
            Unit = request.Unit.Trim(),
            StartingPrice = request.StartingPrice,
            QualityGrade = request.Quality?.Trim(),
            Location = request.Location.Trim(),
            HarvestDate = request.HarvestDate,
            BidDeadline = request.BidDeadline,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        await _listingRepository.AddAsync(listing);

        var savedListing = await _listingRepository.GetByIdAsync(listing.Id);

        if (savedListing == null)
            throw new InvalidOperationException(
                "Unable to retrieve the created listing.");

        return MapListing(savedListing);
    }

    // Update listing
    public async Task<ListingResponseDto> UpdateAsync(
        long id,
        long farmerId,
        CreateListingRequest request)
    {
        var listing = await _listingRepository.GetByIdForUpdateAsync(id);

        if (listing == null)
            throw new KeyNotFoundException("Harvest listing not found.");

        if (listing.FarmerId != farmerId)
            throw new UnauthorizedAccessException(
                "You are not allowed to update this listing.");

        if (listing.Status != "Active")
            throw new InvalidOperationException(
                "Only active listings can be updated.");

        var hasRelatedRecords =
            await _listingRepository.HasRelatedRecordsAsync(id);

        if (hasRelatedRecords)
            throw new InvalidOperationException(
                "This listing cannot be edited because it already has bids or related records.");

        var cropExists = await _listingRepository.CropExistsAsync(request.CropId);

        if (!cropExists)
            throw new ArgumentException("Selected crop does not exist.");

        if (request.HarvestDate.Date < DateTime.UtcNow.Date)
            throw new ArgumentException("Harvest date cannot be in the past.");

        if (request.BidDeadline <= DateTime.UtcNow)
            throw new ArgumentException("Bid deadline must be in the future.");

        listing.CropId = request.CropId;
        listing.Description = request.Description?.Trim();
        listing.Quantity = request.Quantity;
        listing.Unit = request.Unit.Trim();
        listing.StartingPrice = request.StartingPrice;
        listing.QualityGrade = request.Quality?.Trim();
        listing.Location = request.Location.Trim();
        listing.HarvestDate = request.HarvestDate;
        listing.BidDeadline = request.BidDeadline;

        await _listingRepository.SaveChangesAsync();

        var updatedListing = await _listingRepository.GetByIdAsync(id);

        if (updatedListing == null)
            throw new InvalidOperationException(
                "Unable to retrieve the updated listing.");

        return MapListing(updatedListing);
    }

    // Delete listing
    public async Task DeleteAsync(long id, long farmerId)
    {
        var listing = await _listingRepository.GetByIdForUpdateAsync(id);

        if (listing == null)
            throw new KeyNotFoundException("Harvest listing not found.");

        if (listing.FarmerId != farmerId)
            throw new UnauthorizedAccessException(
                "You are not allowed to delete this listing.");

        if (listing.Status != "Active")
            throw new InvalidOperationException(
                "Only active listings can be deleted.");

        var hasRelatedRecords =
            await _listingRepository.HasRelatedRecordsAsync(id);

        if (hasRelatedRecords)
            throw new InvalidOperationException(
                "This listing cannot be deleted because it has existing bids or related records.");

        await _listingRepository.DeleteAsync(listing);
    }
}
