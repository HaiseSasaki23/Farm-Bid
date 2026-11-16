using FarmBid.Api.DTOs;
using FarmBid.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FarmBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingController : ControllerBase
{
    private readonly ListingService _listingService;

    public ListingController(ListingService listingService)
    {
        _listingService = listingService;
    }

    // GET: api/Listing
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllListings()
    {
        var listings = await _listingService.GetAllAsync();

        return Ok(listings);
    }

    // GET: api/Listing/1
    [HttpGet("{id:long}")]
    [Authorize]
    public async Task<IActionResult> GetListingById(long id)
    {
        var listing = await _listingService.GetByIdAsync(id);

        if (listing == null)
        {
            return NotFound(new
            {
                message = "Harvest listing not found."
            });
        }

        return Ok(listing);
    }

    // POST: api/Listing
    [HttpPost]
    [Authorize(Roles = "Farmer")]
    public async Task<IActionResult> CreateListing(
        [FromBody] CreateListingRequest request)
    {
        var farmerIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(farmerIdValue, out var farmerId))
        {
            return Unauthorized();
        }

        try
        {
            var listing = await _listingService.CreateAsync(
                request,
                farmerId
            );

            return CreatedAtAction(
                nameof(GetListingById),
                new { id = listing.Id },
                listing
            );
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

    // PUT: api/Listing/1
    [HttpPut("{id:long}")]
    [Authorize(Roles = "Farmer")]
    public async Task<IActionResult> UpdateListing(
        long id,
        [FromBody] CreateListingRequest request)
    {
        var farmerIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(farmerIdValue, out var farmerId))
        {
            return Unauthorized();
        }

        try
        {
            var listing = await _listingService.UpdateAsync(
                id,
                farmerId,
                request
            );

            return Ok(new
            {
                message = "Harvest listing updated successfully.",
                listing
            });
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

    // DELETE: api/Listing/1
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "Farmer")]
    public async Task<IActionResult> DeleteListing(long id)
    {
        var farmerIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!long.TryParse(farmerIdValue, out var farmerId))
        {
            return Unauthorized();
        }

        try
        {
            await _listingService.DeleteAsync(id, farmerId);

            return Ok(new
            {
                message = "Harvest listing deleted successfully."
            });
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
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }
}
