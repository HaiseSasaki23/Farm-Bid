using FarmBid.Api.DTOs;
using FarmBid.Api.Models;
using FarmBid.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FarmBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BidController : ControllerBase
{
    private readonly BidService _bidService;

    public BidController(BidService bidService)
    {
        _bidService = bidService;
    }

    // GET: api/Bid
    // Farmers see bids on their listings.
    // Buyers see their own bids.
    [HttpGet]
    public async Task<IActionResult> GetBids()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var role = User.FindFirstValue(ClaimTypes.Role);

        try
        {
            var bids = await _bidService.GetAllAsync(userId, role);

            return Ok(bids);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // GET: api/Bid/1
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetBidById(long id)
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var role = User.FindFirstValue(ClaimTypes.Role);

        try
        {
            var bid = await _bidService.GetByIdAsync(
                id,
                userId,
                role
            );

            if (bid == null)
            {
                return NotFound(new
                {
                    message = "Bid not found."
                });
            }

            return Ok(bid);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // POST: api/Bid
    // Buyers can submit bids.
    [HttpPost]
    [Authorize(Roles = "Buyer")]
    public async Task<IActionResult> CreateBid(
        [FromBody] CreateBidRequest request)
    {
        var buyerIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(buyerIdValue, out var buyerId))
        {
            return Unauthorized();
        }

        try
        {
            var bid = await _bidService.CreateAsync(
                request,
                buyerId
            );

            return CreatedAtAction(
                nameof(GetBidById),
                new { id = bid.Id },
                bid
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // PUT: api/Bid/1/decision
    // Only the listing's farmer can accept or reject.
    [HttpPut("{id:long}/decision")]
    [Authorize(Roles = "Farmer")]
    public async Task<IActionResult> DecideBid(
        long id,
        [FromBody] BidDecisionRequest request)
    {
        var farmerIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(farmerIdValue, out var farmerId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _bidService.DecideAsync(
                id,
                farmerId,
                request.Decision
            );

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

    // PUT: api/Bid/1/cancel
    // Buyers can cancel only their own pending bids.
    [HttpPut("{id:long}/cancel")]
    [Authorize(Roles = "Buyer")]
    public async Task<IActionResult> CancelBid(long id)
    {
        var buyerIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!long.TryParse(buyerIdValue, out var buyerId))
            return Unauthorized();

        try
        {
            return Ok(await _bidService.CancelAsync(id, buyerId));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
