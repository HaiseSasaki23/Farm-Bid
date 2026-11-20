using FarmBid.Api.Data;
using FarmBid.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CropController : ControllerBase
{
    private readonly FarmBidDbContext _context;

    public CropController(FarmBidDbContext context)
    {
        _context = context;
    }

    // GET: api/Crop
    [HttpGet]
    public async Task<IActionResult> GetAllCrops()
    {
        var crops = await _context.Crops
            .AsNoTracking()
            .OrderBy(c => c.CropName)
            .ToListAsync();

        return Ok(crops);
    }

    // GET: api/Crop/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetCropById(int id)
    {
        var crop = await _context.Crops.FindAsync(id);

        if (crop == null)
        {
            return NotFound(new
            {
                message = "Crop not found."
            });
        }

        return Ok(crop);
    }

    // POST: api/Crop
    [HttpPost]
    public async Task<IActionResult> CreateCrop(
        [FromBody] Crop request)
    {
        var cropName = request.CropName.Trim();

        if (string.IsNullOrWhiteSpace(cropName))
        {
            return BadRequest(new
            {
                message = "Crop name is required."
            });
        }

        var exists = await _context.Crops
            .AnyAsync(c => c.CropName.ToLower() == cropName.ToLower());

        if (exists)
        {
            return Conflict(new
            {
                message = "Crop already exists."
            });
        }

        var crop = new Crop
        {
            CropName = cropName,
            Description = request.Description?.Trim() ?? string.Empty
        };

        _context.Crops.Add(crop);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCropById),
            new { id = crop.Id },
            crop
        );
    }

    // PUT: api/Crop/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCrop(
        int id,
        [FromBody] Crop request)
    {
        var crop = await _context.Crops.FindAsync(id);

        if (crop == null)
        {
            return NotFound(new
            {
                message = "Crop not found."
            });
        }

        var cropName = request.CropName.Trim();

        if (string.IsNullOrWhiteSpace(cropName))
        {
            return BadRequest(new
            {
                message = "Crop name is required."
            });
        }

        var exists = await _context.Crops.AnyAsync(c =>
            c.Id != id &&
            c.CropName.ToLower() == cropName.ToLower());

        if (exists)
        {
            return Conflict(new
            {
                message = "Another crop already uses that name."
            });
        }

        crop.CropName = cropName;
        crop.Description = request.Description?.Trim() ?? string.Empty;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Crop updated successfully.",
            crop
        });
    }

    // DELETE: api/Crop/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCrop(int id)
    {
        var crop = await _context.Crops.FindAsync(id);

        if (crop == null)
        {
            return NotFound(new
            {
                message = "Crop not found."
            });
        }

        _context.Crops.Remove(crop);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "Cannot delete this crop because it is being used by a harvest listing."
            });
        }

        return Ok(new
        {
            message = "Crop deleted successfully."
        });
    }
}