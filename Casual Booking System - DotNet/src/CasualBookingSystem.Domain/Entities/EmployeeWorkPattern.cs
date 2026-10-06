using CasualBookingSystem.Domain.Common;

namespace CasualBookingSystem.Domain.Entities;

public class EmployeeWorkPattern : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    // System.DayOfWeek values: Sunday=0 ... Saturday=6.
    // Sunday is rejected by the application because this project does not roster Sundays.
    public int DayOfWeek { get; set; }

    public TimeOnly StartTime { get; set; }

    // Scheduled hours, before the unpaid meal-break deduction.
    public decimal ScheduledHours { get; set; }

    public bool IsActive { get; set; } = true;
}
