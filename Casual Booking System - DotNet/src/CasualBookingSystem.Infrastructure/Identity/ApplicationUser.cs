using CasualBookingSystem.Domain.Enums;
using Microsoft.AspNetCore.Identity;
namespace CasualBookingSystem.Infrastructure.Identity;
public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole PrimaryRole { get; set; }
    public RegistrationStatus ApprovalStatus { get; set; } = RegistrationStatus.Pending;
    public bool IsActive { get; set; } = true;
    public int? StoreId { get; set; }
}
