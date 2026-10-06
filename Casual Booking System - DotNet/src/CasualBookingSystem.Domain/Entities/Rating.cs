using CasualBookingSystem.Domain.Common;
namespace CasualBookingSystem.Domain.Entities;
public class Rating : BaseEntity
{
    public int BookingRequestId { get; set; }
    public BookingRequest? BookingRequest { get; set; }
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public int CasualProfileId { get; set; }
    public CasualProfile? CasualProfile { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }
}
