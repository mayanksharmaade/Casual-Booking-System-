using CasualBookingSystem.Domain.Common;

namespace CasualBookingSystem.Domain.Entities;

public class PublicHoliday : BaseEntity
{
    public DateOnly HolidayDate { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
