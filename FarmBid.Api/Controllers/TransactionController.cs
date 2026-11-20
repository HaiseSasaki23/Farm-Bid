using FarmBid.Api.Data;
using FarmBid.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FarmBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionController : ControllerBase
{
    private readonly FarmBidDbContext _context;

    public TransactionController(FarmBidDbContext context)
    {
        _context = context;
    }

    // GET: api/Transaction
    // Farmers see transactions from their listings.
    // Buyers see their own transactions.
    [HttpGet]
    public async Task<IActionResult> GetTransactions()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var role = User.FindFirstValue(ClaimTypes.Role);

        var query = _context.Transactions
            .AsNoTracking()
            .Include(t => t.Bid)
                .ThenInclude(b => b!.Listing)
                    .ThenInclude(l => l!.Crop)
            .Include(t => t.Bid)
                .ThenInclude(b => b!.Listing)
                    .ThenInclude(l => l!.Farmer)
            .Include(t => t.Bid)
                .ThenInclude(b => b!.Buyer)
            .AsQueryable();

        if (role == "Farmer")
        {
            query = query.Where(t =>
                t.Bid!.Listing!.FarmerId == userId);
        }
        else if (role == "Buyer")
        {
            query = query.Where(t =>
                t.Bid!.BuyerId == userId);
        }
        else
        {
            return Forbid();
        }

        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                Id = t.Id,
                BidId = t.BidId,
                ListingId = t.Bid!.ListingId,
                ListingTitle = t.Bid.Listing!.Crop!.CropName,
                CropName = t.Bid.Listing.Crop!.CropName,
                BuyerId = t.Bid.BuyerId,
                BuyerName = t.Bid.Buyer!.FullName,
                FarmerId = t.Bid.Listing.FarmerId,
                FarmerName = t.Bid.Listing.Farmer!.FullName,
                t.AgreedPrice,
                t.AgreedQuantity,
                t.TotalAmount,
                t.TransactionStatus,
                t.CreatedAt,
                t.CompletedAt
            })
            .ToListAsync();

        return Ok(transactions);
    }

    // GET: api/Transaction/1
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetTransactionById(long id)
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var role = User.FindFirstValue(ClaimTypes.Role);

        var transaction = await _context.Transactions
            .AsNoTracking()
            .Include(t => t.Bid)
                .ThenInclude(b => b!.Listing)
                    .ThenInclude(l => l!.Crop)
            .Include(t => t.Bid)
                .ThenInclude(b => b!.Listing)
                    .ThenInclude(l => l!.Farmer)
            .Include(t => t.Bid)
                .ThenInclude(b => b!.Buyer)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
        {
            return NotFound(new
            {
                message = "Transaction not found."
            });
        }

        if (transaction.Bid == null ||
            transaction.Bid.Listing == null)
        {
            return NotFound(new
            {
                message = "Transaction details not found."
            });
        }

        if (role == "Buyer" &&
            transaction.Bid.BuyerId != userId)
            return Forbid();

        if (role == "Farmer" &&
            transaction.Bid.Listing.FarmerId != userId)
            return Forbid();

        if (role != "Buyer" && role != "Farmer")
            return Forbid();

        return Ok(new
        {
            transaction.Id,
            transaction.BidId,
            ListingId = transaction.Bid.ListingId,
            ListingTitle = transaction.Bid.Listing.Crop?.CropName,
            CropName = transaction.Bid.Listing.Crop?.CropName,
            BuyerId = transaction.Bid.BuyerId,
            BuyerName = transaction.Bid.Buyer?.FullName,
            FarmerId = transaction.Bid.Listing.FarmerId,
            FarmerName = transaction.Bid.Listing.Farmer?.FullName,
            transaction.AgreedPrice,
            transaction.AgreedQuantity,
            transaction.TotalAmount,
            transaction.TransactionStatus,
            transaction.CreatedAt,
            transaction.CompletedAt
        });
    }

    // POST: api/Transaction/from-accepted-bid/1
    // Only the listing's farmer can create a transaction.
    [HttpPost("from-accepted-bid/{bidId:long}")]
    [Authorize(Roles = "Farmer")]
    public async Task<IActionResult> CreateFromAcceptedBid(long bidId)
    {
        var farmerIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(farmerIdValue, out var farmerId))
            return Unauthorized();

        var bid = await _context.Bids
            .Include(b => b.Listing)
            .FirstOrDefaultAsync(b => b.Id == bidId);

        if (bid == null)
        {
            return NotFound(new
            {
                message = "Bid not found."
            });
        }

        if (bid.Listing == null ||
            bid.Listing.FarmerId != farmerId)
            return Forbid();

        if (bid.Status != "Accepted")
        {
            return BadRequest(new
            {
                message = "Only accepted bids can create transactions."
            });
        }

        var existingTransaction = await _context.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.BidId == bidId);

        if (existingTransaction != null)
        {
            return Conflict(new
            {
                message = "A transaction already exists for this bid.",
                transactionId = existingTransaction.Id,
                existingTransaction.BidId,
                existingTransaction.TransactionStatus
            });
        }

        var listing = bid.Listing;

        if (listing.Status != "Active")
        {
            return BadRequest(new
            {
                message = "This listing is no longer available."
            });
        }

        var otherAcceptedBidExists = await _context.Bids
            .AnyAsync(b =>
                b.ListingId == listing.Id &&
                b.Id != bidId &&
                b.Status == "Accepted");

        if (otherAcceptedBidExists)
        {
            return Conflict(new
            {
                message = "Another bid has already been accepted for this listing."
            });
        }

        await using var dbTransaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var transaction = new FarmBid.Api.Models.Transaction
            {
                BidId = bid.Id,
                AgreedPrice = bid.OfferedPrice,
                AgreedQuantity = bid.RequestedQuantity,
                TotalAmount = bid.OfferedPrice * bid.RequestedQuantity,
                TransactionStatus = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);

            // Close listing so no more bids can be submitted.
            listing.Status = "Closed";

            var otherPendingBids = await _context.Bids
                .Where(b =>
                    b.ListingId == listing.Id &&
                    b.Id != bidId &&
                    b.Status == "Pending")
                .ToListAsync();

            foreach (var otherBid in otherPendingBids)
            {
                otherBid.Status = "Rejected";
                otherBid.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return CreatedAtAction(
                nameof(GetTransactionById),
                new { id = transaction.Id },
                new
                {
                    message = "Transaction created successfully. Waiting for farmer delivery confirmation.",
                    transactionId = transaction.Id,
                    transaction.BidId,
                    transaction.AgreedPrice,
                    transaction.AgreedQuantity,
                    transaction.TotalAmount,
                    transaction.TransactionStatus,
                    transaction.CreatedAt,
                    listingStatus = listing.Status
                });
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    // PUT: api/Transaction/1/confirm-completion
    // Only the farmer can confirm delivery and complete the transaction.
    [HttpPut("{id:long}/confirm-completion")]
    [Authorize(Roles = "Farmer")]
    public async Task<IActionResult> ConfirmCompletion(long id)
    {
        var farmerIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(farmerIdValue, out var farmerId))
            return Unauthorized();

        var transaction = await _context.Transactions
            .Include(t => t.Bid)
                .ThenInclude(b => b!.Listing)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
        {
            return NotFound(new
            {
                message = "Transaction not found."
            });
        }

        if (transaction.Bid?.Listing == null ||
            transaction.Bid.Listing.FarmerId != farmerId)
            return Forbid();

        if (transaction.TransactionStatus == "Completed")
        {
            return BadRequest(new
            {
                message = "This transaction is already completed."
            });
        }

        if (transaction.TransactionStatus != "Pending" &&
            transaction.TransactionStatus != "Ongoing")
        {
            return BadRequest(new
            {
                message = "Only pending or ongoing transactions can be completed."
            });
        }

        transaction.TransactionStatus = "Completed";
        transaction.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Delivery confirmed. Transaction completed successfully.",
            transaction.Id,
            transaction.TransactionStatus,
            transaction.CompletedAt
        });
    }
}
