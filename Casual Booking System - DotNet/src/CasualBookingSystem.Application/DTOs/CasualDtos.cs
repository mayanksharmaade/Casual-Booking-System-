namespace CasualBookingSystem.Application.DTOs;

public record CasualDashboardDto(
    int PendingRequests,
    int UpcomingShifts,
    int PreviousShifts,
    decimal WeeklyHours,
    decimal WeeklyLimit,
    decimal Rating,
    int UnreadNotifications,
    int CurrentZoneId,
    string CurrentZoneName);

public record CasualProfileDto(
    int Id,
    Guid UserId,
    string FirstName,
    string LastName,
    string Phone,
    string City,
    string? PhotoUrl,
    int CurrentZoneId,
    string CurrentZoneName,
    decimal Rating,
    IReadOnlyList<string> Skills);

public record UpdateCasualProfileRequest(string FirstName, string LastName, string Phone, string City, string? PhotoUrl);
public record AvailabilityDto(int Id, DateTime StartDateTime, DateTime EndDateTime);
public record AddAvailabilityRequest(DateTime StartDateTime, DateTime EndDateTime);
public record DeclineBookingRequest(string? Reason);
public record CancelBookingRequest(string Reason);
public record NotificationDto(int Id, string Type, string Title, string Message, bool IsRead, DateTime CreatedAtUtc);

public record SkillDto(int Id, string Name);
public record SetCasualSkillsRequest(IReadOnlyList<int> SkillIds);

public record CasualReportDto(
    DateTime From,
    DateTime To,
    decimal AcceptedHours,
    int AcceptedBookings,
    int CompletedBookings,
    int CancelledBookings,
    int DeclinedBookings,
    decimal Rating,
    int RatingCount);
