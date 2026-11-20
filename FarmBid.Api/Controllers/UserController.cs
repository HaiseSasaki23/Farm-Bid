using FarmBid.Api.Data;
using FarmBid.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FarmBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly FarmBidDbContext _context;

    public UserController(FarmBidDbContext context)
    {
        _context = context;
    }

    // GET: api/User/me
    // The client must get its identity from the validated JWT, never from a
    // browser-stored user object.
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserResponseDto>> Me()
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(idValue, out var id))
            return Unauthorized();

        var user = await _context.Users
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new CurrentUserResponseDto
            {
                Id = x.Id,
                FullName = x.FullName,
                Email = x.Email,
                Role = x.Role.ToString(),
                AccountStatus = x.AccountStatus.ToString(),
                CreatedAt = x.CreatedAt
            })
            .SingleOrDefaultAsync();

        return user is null ? Unauthorized() : Ok(user);
    }
}
