using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Enums;
namespace CasualBookingSystem.Domain.Entities;
public class Employee : BaseEntity
{
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public Guid? UserId { get; set; }
    public EmployeeType EmployeeType { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? SkillSummary { get; set; }
    public decimal? BaseHourlyRate { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<EmployeeRosterEntry> RosterEntries { get; set; } = new List<EmployeeRosterEntry>();
    public ICollection<EmployeeAbsence> Absences { get; set; } = new List<EmployeeAbsence>();
    public ICollection<EmployeeWorkPattern> WorkPatterns { get; set; } = new List<EmployeeWorkPattern>();
}
