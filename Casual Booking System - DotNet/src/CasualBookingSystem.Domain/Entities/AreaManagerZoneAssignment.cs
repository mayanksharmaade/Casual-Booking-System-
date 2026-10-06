using CasualBookingSystem.Domain.Common;

namespace CasualBookingSystem.Domain.Entities;

public class AreaManagerZoneAssignment : BaseEntity
{
    public Guid AreaManagerUserId { get; set; }
    public int ZoneId { get; set; }
    public Zone? Zone { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;
}
