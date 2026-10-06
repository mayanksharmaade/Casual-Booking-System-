using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Enums;
namespace CasualBookingSystem.Domain.Entities;
public class PayRate : BaseEntity
{
    public EmployeeType EmployeeType { get; set; }
    public decimal HourlyRate { get; set; }
    public DateTime EffectiveFromUtc { get; set; }
    public DateTime? EffectiveToUtc { get; set; }
}
