
namespace FarmBid.Api.Models;

public class AiMarketReport
{
    public long ReportId { get; set; }

    public long GeneratedBy { get; set; }

    public string ReportType { get; set; } = string.Empty;

    public DateTime PeriodStart { get; set; }

    public DateTime PeriodEnd { get; set; }

    public string ReportContent { get; set; } = string.Empty;

    public string? ModelName { get; set; }

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public User? GeneratedByUser { get; set; }
}
