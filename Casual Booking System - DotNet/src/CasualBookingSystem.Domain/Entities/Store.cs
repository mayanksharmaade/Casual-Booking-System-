using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Enums;
namespace CasualBookingSystem.Domain.Entities;
public class Store : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int ZoneId { get; set; }
    public Zone? Zone { get; set; }
    public RegistrationStatus RegistrationStatus { get; set; } = RegistrationStatus.Pending;
    public bool IsActive { get; set; } = true;
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<StoreBudget> Budgets { get; set; } = new List<StoreBudget>();
    public ICollection<BookingRequest> Bookings { get; set; } = new List<BookingRequest>();
}
