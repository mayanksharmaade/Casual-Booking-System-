using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Enums;
namespace CasualBookingSystem.Domain.Entities;
public class EmployeeAbsence : BaseEntity
{
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public AbsenceType AbsenceType { get; set; }
    public string? Reason { get; set; }
}
