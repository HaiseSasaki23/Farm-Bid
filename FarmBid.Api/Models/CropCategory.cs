
namespace FarmBid.Api.Models;

public class CropCategory
{
    public long Id { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public ICollection<Crop> Crops { get; set; } = new List<Crop>();
}
