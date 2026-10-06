using CasualBookingSystem.Domain.Common;
namespace CasualBookingSystem.Domain.Entities;
public class Zone : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<Store> Stores { get; set; } = new List<Store>();
}
