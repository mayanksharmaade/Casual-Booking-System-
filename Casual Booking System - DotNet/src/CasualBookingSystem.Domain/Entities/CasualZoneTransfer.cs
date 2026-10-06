using CasualBookingSystem.Domain.Common;

namespace CasualBookingSystem.Domain.Entities;

public class CasualZoneTransfer : BaseEntity
{
    public int CasualProfileId { get; set; }
    public CasualProfile? CasualProfile { get; set; }
    public int? FromZoneId { get; set; }
    public Zone? FromZone { get; set; }
    public int ToZoneId { get; set; }
    public Zone? ToZone { get; set; }
    public Guid TransferredByUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime TransferredAtUtc { get; set; } = DateTime.UtcNow;
}
