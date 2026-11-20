
using FarmBid.Api.DTOs.AI;
using FarmBid.Api.Repositories.AI;

namespace FarmBid.Api.Services.AI;

public class MarketInsightsService
{
    private readonly StatisticsRepository _statisticsRepository;

    public MarketInsightsService(
        StatisticsRepository statisticsRepository)
    {
        _statisticsRepository = statisticsRepository;
    }

    public async Task<MarketOverviewDto> GetMarketOverviewAsync()
    {
        return await _statisticsRepository.GetMarketOverviewAsync();
    }

    public async Task<List<CropPerformanceDto>> GetCropPerformanceAsync()
    {
        return await _statisticsRepository.GetCropPerformanceAsync();
    }

    public async Task<List<PriceTrendDto>> GetPriceTrendsAsync()
    {
        return await _statisticsRepository.GetPriceTrendsAsync();
    }

    public async Task<List<FarmerPerformanceDto>> GetFarmerPerformanceAsync()
    {
        return await _statisticsRepository.GetFarmerPerformanceAsync();
    }

}
