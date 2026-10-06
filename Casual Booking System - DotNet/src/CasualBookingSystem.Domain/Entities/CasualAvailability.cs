using CasualBookingSystem.Domain.Common;
namespace CasualBookingSystem.Domain.Entities;
public class CasualAvailability : BaseEntity
{
    public int CasualProfileId { get; set; }
    public CasualProfile? CasualProfile { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
}
