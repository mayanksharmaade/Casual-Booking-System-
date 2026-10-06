using CasualBookingSystem.Domain.Common;
namespace CasualBookingSystem.Domain.Entities;
public class EmployeeRosterEntry : BaseEntity
{
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public decimal HourlyRateSnapshot { get; set; }
    public decimal EstimatedCost { get; set; }
    public bool IsCancelled { get; set; }
    public bool IsGeneratedFromPattern { get; set; }
}
