
namespace FarmBid.Api.DTOs.AI;

public class MarketReportDto
{
    public long ReportId { get; set; }

    public string ReportType { get; set; } = string.Empty;

    public string ReportContent { get; set; } = string.Empty;

    public string? ModelName { get; set; }

    public DateTime GeneratedAt { get; set; }
}
