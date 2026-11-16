
using FarmBid.Api.Data;
using FarmBid.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmBid.Api.Repositories;

public class UserRepository
{
    private readonly FarmBidDbContext _context;

    public UserRepository(FarmBidDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByIdAsync(long id)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(User user)
    {
        await _context.SaveChangesAsync();
    }
}
