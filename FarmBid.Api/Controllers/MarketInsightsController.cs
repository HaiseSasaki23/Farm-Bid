
using FarmBid.Api.Services.AI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FarmBid.Api.Controllers;

[ApiController]
[Route("api/market-insights")]
[Authorize(Roles = "Farmer,Buyer")]
public class MarketInsightsController : ControllerBase
{
    private readonly MarketInsightsService _marketInsightsService;

    public MarketInsightsController(
        MarketInsightsService marketInsightsService)
    {
        _marketInsightsService = marketInsightsService;
    }

    // GET: api/market-insights/overview
    [HttpGet("overview")]
    public async Task<IActionResult> GetMarketOverview()
    {
        var overview =
            await _marketInsightsService.GetMarketOverviewAsync();

        return Ok(overview);
    }

    // GET: api/market-insights/crop-performance
    [HttpGet("crop-performance")]
    public async Task<IActionResult> GetCropPerformance()
    {
        var cropPerformance =
            await _marketInsightsService.GetCropPerformanceAsync();

        return Ok(cropPerformance);
    }

    // GET: api/market-insights/price-trends
    [HttpGet("price-trends")]
    public async Task<IActionResult> GetPriceTrends()
    {
        var priceTrends =
            await _marketInsightsService.GetPriceTrendsAsync();

        return Ok(priceTrends);
    }

    // GET: api/market-insights/farmer-performance
    [HttpGet("farmer-performance")]
    public async Task<IActionResult> GetFarmerPerformance()
    {
        var farmerPerformance =
            await _marketInsightsService.GetFarmerPerformanceAsync();

        return Ok(farmerPerformance);
    }

}
