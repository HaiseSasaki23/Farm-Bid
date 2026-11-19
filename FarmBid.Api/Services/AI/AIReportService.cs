
using System.Text.Json;
using FarmBid.Api.Data;
using FarmBid.Api.DTOs.AI;
using FarmBid.Api.Models;
using FarmBid.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FarmBid.Api.Services.AI;

public class AIReportService
{
    private readonly MarketInsightsService _marketInsightsService;
    private readonly GeminiService _geminiService;
    private readonly FarmBidDbContext _context;
    private readonly IConfiguration _configuration;

    public AIReportService(
        MarketInsightsService marketInsightsService,
        GeminiService geminiService,
        FarmBidDbContext context,
        IConfiguration configuration)
    {
        _marketInsightsService = marketInsightsService;
        _geminiService = geminiService;
        _context = context;
        _configuration = configuration;
    }

    public async Task<MarketReportDto> GenerateOverallReportAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        // 1. Retrieve the four existing statistics datasets.
        var overview = await _marketInsightsService
            .GetMarketOverviewAsync();

        var cropPerformance = await _marketInsightsService
            .GetCropPerformanceAsync();

        var priceTrends = await _marketInsightsService
            .GetPriceTrendsAsync();

        var farmerPerformance = await _marketInsightsService
            .GetFarmerPerformanceAsync();

        // 2. Anonymize farmer names before sending data to Gemini.
        var anonymizedFarmerPerformance = farmerPerformance
            .Select((farmer, index) => new
            {
                Farmer = $"Farmer {index + 1}",
                farmer.TotalListings,
                farmer.ActiveListings,
                farmer.TotalQuantityListedKg,
                farmer.TotalBidsReceived,
                farmer.CompletedTransactions,
                farmer.TotalSalesValue
            })
            .ToList();

        // 3. Organize the statistics into structured JSON.
        var statisticsData = new
        {
            MarketOverview = overview,
            CropPerformance = cropPerformance,
            PriceTrends = priceTrends,
            FarmerPerformance = anonymizedFarmerPerformance
        };

        var jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true
        };

        string statisticsJson = JsonSerializer.Serialize(
            statisticsData,
            jsonOptions);

        // 4. Prepare the Gemini prompt.
        string prompt = $"""
        You are FarmBid's agricultural marketplace market analyst.

        Analyze the following actual marketplace statistics and generate
        a comprehensive Overall Market Report.

        MARKETPLACE DATA:
        {statisticsJson}

        REPORT REQUIREMENTS:

        1. Executive Summary
        - Summarize the current marketplace condition.
        - Highlight the most important figures.

        2. Market Overview
        - Analyze active listings, listed quantity, total bids,
          completed transactions, and sales value.

        3. Crop Performance
        - Identify crops with strong and weak marketplace activity.
        - Compare their listing activity, bids, and completed sales.

        4. Price Trends
        - Explain the observed changes in crop starting prices.
        - Identify notable increases, decreases, or stable prices.
        - Remember these are starting prices, not final selling prices.

        5. Farmer Performance
        - Compare anonymized farmer performance.
        - Discuss listing activity, bids received, and completed sales.
        - Never attempt to identify individual farmers.

        6. Recommendations
        - Provide practical recommendations for farmers and buyers.
        - Base every recommendation on the supplied data.

        IMPORTANT RULES:
        - Use only the supplied statistics.
        - Never invent figures, trends, or marketplace events.
        - Do not assume that an ongoing transaction is a completed sale.
        - Only completed transactions count toward total sales value.
        - If there is insufficient data, clearly mention the limitation.
        - Do not claim that a crop or farmer is performing poorly
          solely because its data is limited.
        - Use Philippine pesos (₱) for monetary values.
        - Use kilograms (kg) for quantities.
        - Write in clear, professional, easy-to-understand language.
        - Format the report using Markdown headings and bullet points.
        """;

        // 5. Generate the report using the existing GeminiService.
        string reportContent = await _geminiService
            .GenerateResponseAsync(prompt, cancellationToken);

        // 6. Determine the reporting period.
        DateTime periodStart = priceTrends.Any()
            ? new DateTime(
                priceTrends.Min(t => new DateTime(t.Year, t.Month, 1)).Year,
                priceTrends.Min(t => new DateTime(t.Year, t.Month, 1)).Month,
                1)
            : DateTime.UtcNow.Date;

        DateTime periodEnd = DateTime.UtcNow.Date;

        // 7. Get the configured Gemini model name.
        string modelName =
            _configuration["Gemini:Model"] ?? "Unknown";

        // 8. Save the generated report.
        var report = new AiMarketReport
        {
            GeneratedBy = userId,
            ReportType = "Overall Market Report",
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            ReportContent = reportContent,
            ModelName = modelName,
            GeneratedAt = DateTime.UtcNow
        };

        _context.AiMarketReports.Add(report);

        await _context.SaveChangesAsync(cancellationToken);

        // 9. Return the report DTO.
        return new MarketReportDto
        {
            ReportId = report.ReportId,
            ReportType = report.ReportType,
            ReportContent = report.ReportContent,
            ModelName = report.ModelName,
            GeneratedAt = report.GeneratedAt
        };
    }
}
