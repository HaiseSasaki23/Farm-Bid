
using FarmBid.Api.Data;
using FarmBid.Api.DTOs.AI;
using Microsoft.EntityFrameworkCore;

namespace FarmBid.Api.Repositories.AI;

public class StatisticsRepository
{
    private readonly FarmBidDbContext _context;

    public StatisticsRepository(FarmBidDbContext context)
    {
        _context = context;
    }

    public async Task<MarketOverviewDto> GetMarketOverviewAsync()
    {
        var activeListings = await _context.HarvestingListings
            .AsNoTracking()
            .Where(l => l.Status == "Active")
            .CountAsync();

        var totalListedQuantity = await _context.HarvestingListings
            .AsNoTracking()
            .Where(l => l.Status == "Active")
            .SumAsync(l => (decimal?)l.Quantity) ?? 0m;

        var totalBids = await _context.Bids
            .AsNoTracking()
            .CountAsync();

        var completedTransactionsQuery = _context.Transactions
            .AsNoTracking()
            .Where(t => t.TransactionStatus == "Completed");

        var completedTransactions = await completedTransactionsQuery
            .CountAsync();

        var totalSalesValue = await completedTransactionsQuery
            .SumAsync(t => (decimal?)t.TotalAmount) ?? 0m;

        return new MarketOverviewDto
        {
            ActiveListings = activeListings,
            TotalListedQuantityKg = totalListedQuantity,
            TotalBids = totalBids,
            CompletedTransactions = completedTransactions,
            TotalSalesValue = totalSalesValue
        };
    }
    public async Task<List<CropPerformanceDto>> GetCropPerformanceAsync()
    {
        var cropPerformance = await _context.Crops
            .AsNoTracking()
            .Select(c => new CropPerformanceDto
            {
                CropName = c.CropName,

                TotalListings = c.HarvestingListings.Count(),

                ActiveListings = c.HarvestingListings
                    .Count(l => l.Status == "Active"),

                TotalQuantityListedKg = c.HarvestingListings
                    .Sum(l => (decimal?)l.Quantity) ?? 0m,

                TotalBids = c.HarvestingListings
                    .SelectMany(l => l.Bids)
                    .Count(),

                CompletedTransactions = c.HarvestingListings
                    .SelectMany(l => l.Bids)
                    .Count(b =>
                        b.Transaction != null &&
                        b.Transaction.TransactionStatus == "Completed"),

                TotalSalesValue = c.HarvestingListings
                    .SelectMany(l => l.Bids)
                    .Where(b =>
                        b.Transaction != null &&
                        b.Transaction.TransactionStatus == "Completed")
                    .Sum(b => (decimal?)b.Transaction!.TotalAmount) ?? 0m
            })
            .ToListAsync();

        return cropPerformance
            .OrderByDescending(c => c.TotalSalesValue)
            .ToList();
    }

    public async Task<List<PriceTrendDto>> GetPriceTrendsAsync()
    {
        var priceTrends = await _context.HarvestingListings
            .AsNoTracking()
            .GroupBy(l => new
            {
                l.Crop!.CropName,
                l.CreatedAt.Year,
                l.CreatedAt.Month
            })
            .Select(g => new PriceTrendDto
            {
                CropName = g.Key.CropName,
                Year = g.Key.Year,
                Month = g.Key.Month,

                AverageStartingPrice = g.Average(l => l.StartingPrice),

                LowestStartingPrice = g.Min(l => l.StartingPrice),

                HighestStartingPrice = g.Max(l => l.StartingPrice),

                TotalListings = g.Count()
            })
            .OrderBy(t => t.Year)
            .ThenBy(t => t.Month)
            .ThenBy(t => t.CropName)
            .ToListAsync();

        return priceTrends;
    }

    public async Task<List<FarmerPerformanceDto>> GetFarmerPerformanceAsync()
    {
        var farmerPerformance = await _context.HarvestingListings
            .AsNoTracking()
            .GroupBy(l => new
            {
                l.FarmerId,
                FarmerName = l.Farmer!.FullName
            })
            .Select(g => new FarmerPerformanceDto
            {
                FarmerName = g.Key.FarmerName,

                TotalListings = g.Count(),

                ActiveListings = g.Count(l => l.Status == "Active"),

                TotalQuantityListedKg =
                    g.Sum(l => l.Quantity),

                TotalBidsReceived = g
                    .SelectMany(l => l.Bids)
                    .Count(),

                CompletedTransactions = g
                    .SelectMany(l => l.Bids)
                    .Count(b =>
                        b.Transaction != null &&
                        b.Transaction.TransactionStatus == "Completed"),

                TotalSalesValue = g
                    .SelectMany(l => l.Bids)
                    .Where(b =>
                        b.Transaction != null &&
                        b.Transaction.TransactionStatus == "Completed")
                    .Sum(b => (decimal?)b.Transaction!.TotalAmount) ?? 0m
            })
            .OrderByDescending(f => f.TotalSalesValue)
            .ToListAsync();

        return farmerPerformance;
    }
}
