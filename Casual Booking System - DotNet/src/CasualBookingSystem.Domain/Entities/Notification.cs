using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Enums;
namespace CasualBookingSystem.Domain.Entities;
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
}
