using CasualBookingSystem.Application.Common;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.Services;

public class CasualService(
    IUserAccountService users,
    ICasualRepository casuals,
    IBookingRepository bookings,
    INotificationRepository notifications,
    ISkillRepository skills) : ICasualService
{
    private async Task<CasualProfile> Profile(Guid userId)
    {
        var account = await users.GetByIdAsync(userId) ?? throw new BusinessRuleException("User not found.");
        if (account.Role != UserRole.Casual) throw new BusinessRuleException("Casual access required.");
        if (!account.IsActive || account.ApprovalStatus != RegistrationStatus.Approved)
            throw new BusinessRuleException("Casual account is not active and approved.");

        var profile = await casuals.GetByUserIdAsync(userId) ?? throw new BusinessRuleException("Casual profile not found.");
        if (!profile.IsActive || profile.RegistrationStatus != RegistrationStatus.Approved)
            throw new BusinessRuleException("Casual profile is not active and approved.");
        if (!profile.CurrentZoneId.HasValue)
            throw new BusinessRuleException("Casual is not assigned to a zone.");

        return profile;
    }

    public async Task<CasualDashboardDto> GetDashboardAsync(Guid userId)
    {
        var casual = await Profile(userId);
        await bookings.ExpirePendingAsync(DateTime.UtcNow);

        var list = await bookings.GetForCasualAsync(casual.Id);
        var now = DateTime.Now;
        var week = ServiceHelpers.GetWeek(now);

        return new CasualDashboardDto(
            list.Count(x => x.Status == BookingStatus.Pending),
            list.Count(x => x.Status == BookingStatus.Accepted && x.StartDateTime >= now),
            list.Count(x => x.Status is BookingStatus.Completed or BookingStatus.Cancelled or BookingStatus.Declined or BookingStatus.Expired),
            await bookings.GetAcceptedHoursAsync(casual.Id, week.Start, week.End),
            BusinessRules.MaximumWeeklyPaidHours,
            casual.RatingAverage,
            await notifications.CountUnreadAsync(userId),
            casual.CurrentZoneId!.Value,
            casual.CurrentZone?.Name ?? "Assigned Zone");
    }

    public async Task<CasualProfileDto> GetProfileAsync(Guid userId) => ToDto(await Profile(userId));

    public async Task<CasualProfileDto> UpdateProfileAsync(Guid userId, UpdateCasualProfileRequest request)
    {
        var casual = await Profile(userId);
        casual.FirstName = request.FirstName.Trim();
        casual.LastName = request.LastName.Trim();
        casual.Phone = request.Phone.Trim();
        casual.City = request.City.Trim();
        casual.PhotoUrl = request.PhotoUrl?.Trim();

        await casuals.SaveChangesAsync();
        return ToDto(casual);
    }

    public async Task<IReadOnlyList<SkillDto>> GetSkillsAsync(Guid userId)
    {
        await Profile(userId);
        return (await skills.GetAllAsync()).Select(x => new SkillDto(x.Id, x.Name)).ToList();
    }

    public async Task SetSkillsAsync(Guid userId, SetCasualSkillsRequest request)
    {
        var casual = await Profile(userId);
        await skills.SetCasualSkillsAsync(casual.Id, request.SkillIds);
    }

    public async Task<IReadOnlyList<AvailabilityDto>> GetAvailabilityAsync(Guid userId)
    {
        var casual = await Profile(userId);
        return (await casuals.GetAvailabilityAsync(casual.Id))
            .Select(x => new AvailabilityDto(x.Id, x.StartDateTime, x.EndDateTime))
            .ToList();
    }

    public async Task<AvailabilityDto> AddAvailabilityAsync(Guid userId, AddAvailabilityRequest request)
    {
        var casual = await Profile(userId);
        ServiceHelpers.Hours(request.StartDateTime, request.EndDateTime);

        if (request.EndDateTime <= DateTime.Now)
            throw new BusinessRuleException("Availability must be in the future.");

        var availability = new CasualAvailability
        {
            CasualProfileId = casual.Id,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime
        };

        await casuals.AddAvailabilityAsync(availability);
        await casuals.SaveChangesAsync();

        return new AvailabilityDto(availability.Id, availability.StartDateTime, availability.EndDateTime);
    }

    public async Task DeleteAvailabilityAsync(Guid userId, int availabilityId)
    {
        var casual = await Profile(userId);
        var availability = await casuals.GetAvailabilityByIdAsync(availabilityId)
            ?? throw new BusinessRuleException("Availability not found.");

        if (availability.CasualProfileId != casual.Id)
            throw new BusinessRuleException("Availability belongs to another casual.");

        casuals.RemoveAvailability(availability);
        await casuals.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<BookingDto>> GetBookingsAsync(Guid userId)
    {
        var casual = await Profile(userId);
        await bookings.ExpirePendingAsync(DateTime.UtcNow);
        return (await bookings.GetForCasualAsync(casual.Id)).Select(ServiceHelpers.ToDto).ToList();
    }

    public async Task AcceptBookingAsync(Guid userId, int bookingId)
    {
        var casual = await Profile(userId);
        var booking = await bookings.GetByIdAsync(bookingId) ?? throw new BusinessRuleException("Booking not found.");

        if (booking.CasualProfileId != casual.Id)
            throw new BusinessRuleException("Booking belongs to another casual.");
        if (booking.Status != BookingStatus.Pending)
            throw new BusinessRuleException("Only pending requests can be accepted.");

        if (booking.ExpiresAtUtc.HasValue && booking.ExpiresAtUtc <= DateTime.UtcNow)
        {
            booking.Status = BookingStatus.Expired;
            await bookings.SaveChangesAsync();
            throw new BusinessRuleException("Booking request has expired.");
        }

        if (ServiceHelpers.TouchesSunday(booking.StartDateTime, booking.EndDateTime))
            throw new BusinessRuleException("Sunday bookings are not allowed.");

        if (!await casuals.IsAvailableAsync(casual.Id, booking.StartDateTime, booking.EndDateTime))
            throw new BusinessRuleException("You are no longer available for the full booking period.");

        if (await bookings.HasAcceptedOverlapAsync(casual.Id, booking.StartDateTime, booking.EndDateTime, booking.Id))
            throw new BusinessRuleException("You already have an overlapping accepted booking.");

        if (booking.RequiredSkillId.HasValue &&
            !booking.OverrideApprovedByUserId.HasValue &&
            !casual.Skills.Any(x => x.SkillId == booking.RequiredSkillId.Value))
            throw new BusinessRuleException("You no longer have the skill required for this booking.");

        var hours = ServiceHelpers.Hours(booking.StartDateTime, booking.EndDateTime);
        var week = ServiceHelpers.GetWeek(booking.StartDateTime);
        var weeklyHours = await bookings.GetAcceptedHoursAsync(casual.Id, week.Start, week.End, booking.Id);

        if (weeklyHours + hours > BusinessRules.MaximumWeeklyPaidHours)
            throw new BusinessRuleException($"This booking would exceed {BusinessRules.MaximumWeeklyPaidHours} paid hours for the week.");

        var existing = (await bookings.GetForCasualAsync(casual.Id))
            .Where(x => x.Id != booking.Id)
            .Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed)
            .Where(x => x.StartDateTime >= booking.StartDateTime.Date.AddDays(-8) &&
                        x.StartDateTime < booking.StartDateTime.Date.AddDays(8))
            .Select(x => (x.StartDateTime, x.EndDateTime));

        ServiceHelpers.ValidateAdvancedPaidSchedule(
            booking.StartDateTime,
            booking.EndDateTime,
            existing,
            $"{casual.FirstName} {casual.LastName}");

        booking.Status = BookingStatus.Accepted;
        booking.AcceptedAtUtc = DateTime.UtcNow;
        await bookings.SaveChangesAsync();

        await notifications.AddAsync(new Notification
        {
            UserId = booking.RequestedByUserId,
            Type = NotificationType.BookingAccepted,
            Title = "Booking accepted",
            Message = $"{casual.FirstName} {casual.LastName} accepted the booking."
        });
        await notifications.SaveChangesAsync();
    }

    public async Task DeclineBookingAsync(Guid userId, int bookingId, DeclineBookingRequest request)
    {
        var casual = await Profile(userId);
        var booking = await bookings.GetByIdAsync(bookingId) ?? throw new BusinessRuleException("Booking not found.");

        if (booking.CasualProfileId != casual.Id || booking.Status != BookingStatus.Pending)
            throw new BusinessRuleException("Only your pending booking can be declined.");

        booking.Status = BookingStatus.Declined;
        booking.DeclineReason = request.Reason?.Trim();
        await bookings.SaveChangesAsync();

        await notifications.AddAsync(new Notification
        {
            UserId = booking.RequestedByUserId,
            Type = NotificationType.BookingDeclined,
            Title = "Booking declined",
            Message = request.Reason?.Trim() ?? "Casual declined the request."
        });
        await notifications.SaveChangesAsync();
    }

    public async Task CancelBookingAsync(Guid userId, int bookingId, CancelBookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("Cancellation reason is required.");

        var casual = await Profile(userId);
        var booking = await bookings.GetByIdAsync(bookingId) ?? throw new BusinessRuleException("Booking not found.");

        if (booking.CasualProfileId != casual.Id || booking.Status != BookingStatus.Accepted)
            throw new BusinessRuleException("Only your accepted booking can be cancelled.");

        if (booking.StartDateTime <= DateTime.Now)
            throw new BusinessRuleException("A booking that has already started cannot be cancelled by the Casual.");

        var notice = booking.StartDateTime - DateTime.Now;
        if (notice.TotalHours < BusinessRules.CasualCancellationNoticeHours)
            throw new BusinessRuleException(
                $"Casual cancellation requires at least {BusinessRules.CasualCancellationNoticeHours} hours notice. Contact the Store or Area Manager for an exception.");

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAtUtc = DateTime.UtcNow;
        booking.CancelledByUserId = userId;
        booking.CancellationReason = request.Reason.Trim();
        await bookings.SaveChangesAsync();

        await notifications.AddAsync(new Notification
        {
            UserId = booking.RequestedByUserId,
            Type = NotificationType.BookingCancelled,
            Title = "Booking cancelled by Casual",
            Message = request.Reason.Trim()
        });
        await notifications.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(Guid userId)
    {
        await Profile(userId);
        return (await notifications.GetForUserAsync(userId))
            .Select(x => new NotificationDto(x.Id, x.Type.ToString(), x.Title, x.Message, x.IsRead, x.CreatedAtUtc))
            .ToList();
    }

    public async Task MarkNotificationReadAsync(Guid userId, int notificationId)
    {
        await Profile(userId);
        var notification = await notifications.GetByIdAsync(notificationId)
            ?? throw new BusinessRuleException("Notification not found.");

        if (notification.UserId != userId)
            throw new BusinessRuleException("Notification belongs to another user.");

        notification.IsRead = true;
        await notifications.SaveChangesAsync();
    }

    public async Task<CasualReportDto> GetReportAsync(Guid userId, DateTime from, DateTime to)
    {
        var casual = await Profile(userId);
        if (to <= from) throw new BusinessRuleException("Report end must be after report start.");

        var list = (await bookings.GetForCasualAsync(casual.Id))
            .Where(x => x.StartDateTime < to && x.EndDateTime > from)
            .ToList();

        var acceptedHours = list
            .Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed)
            .Sum(x => ServiceHelpers.Hours(x.StartDateTime, x.EndDateTime));

        return new CasualReportDto(
            from,
            to,
            acceptedHours,
            list.Count(x => x.Status == BookingStatus.Accepted),
            list.Count(x => x.Status == BookingStatus.Completed),
            list.Count(x => x.Status == BookingStatus.Cancelled),
            list.Count(x => x.Status == BookingStatus.Declined),
            casual.RatingAverage,
            casual.RatingCount);
    }

    private static CasualProfileDto ToDto(CasualProfile casual) => new(
        casual.Id,
        casual.UserId,
        casual.FirstName,
        casual.LastName,
        casual.Phone,
        casual.City,
        casual.PhotoUrl,
        casual.CurrentZoneId ?? 0,
        casual.CurrentZone?.Name ?? "Unassigned",
        casual.RatingAverage,
        casual.Skills.Select(x => x.Skill?.Name ?? string.Empty).Where(x => x.Length > 0).ToList());
}
