using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Domain.Entities;

public class CasualProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int? CurrentZoneId { get; set; }
    public Zone? CurrentZone { get; set; }
    public RegistrationStatus RegistrationStatus { get; set; } = RegistrationStatus.Pending;
    public bool IsActive { get; set; } = true;
    public decimal RatingAverage { get; set; }
    public decimal? BaseHourlyRate { get; set; }
    public int RatingCount { get; set; }
    public ICollection<CasualSkill> Skills { get; set; } = new List<CasualSkill>();
    public ICollection<CasualAvailability> Availability { get; set; } = new List<CasualAvailability>();
    public ICollection<BookingRequest> Bookings { get; set; } = new List<BookingRequest>();
    public ICollection<CasualZoneTransfer> ZoneTransfers { get; set; } = new List<CasualZoneTransfer>();
}
