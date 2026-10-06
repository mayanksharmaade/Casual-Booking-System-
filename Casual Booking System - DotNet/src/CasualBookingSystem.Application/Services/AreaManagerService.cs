using CasualBookingSystem.Application.Common;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.Services;

public class AreaManagerService(
    IUserAccountService users,
    IAreaManagerRepository areaManagers,
    IZoneRepository zones,
    IStoreRepository stores,
    IEmployeeRepository employees,
    ICasualRepository casuals,
    IBookingRepository bookings,
    IStoreBudgetRepository budgets,
    ISkillRepository skills,
    INotificationRepository notifications,
    IAuditRepository audit) : IAreaManagerService
{
    private async Task<(UserAccountDto User, IReadOnlyList<int> ZoneIds)> Context(Guid userId)
    {
        var user = await users.GetByIdAsync(userId) ?? throw new BusinessRuleException("User not found.");
        if (user.Role != UserRole.AreaManager) throw new BusinessRuleException("Area Manager access required.");
        if (!user.IsActive || user.ApprovalStatus != RegistrationStatus.Approved)
            throw new BusinessRuleException("Area Manager account is not active and approved.");

        var assignments = await areaManagers.GetAssignmentsAsync(userId);
        var zoneIds = assignments.Where(x => x.IsActive).Select(x => x.ZoneId).Distinct().ToArray();

        if (zoneIds.Length == 0)
            throw new BusinessRuleException("Area Manager has no assigned zones.");

        return (user, zoneIds);
    }

    public async Task<AreaManagerDashboardDto> GetDashboardAsync(Guid userId, DateOnly date)
    {
        var (_, zoneIds) = await Context(userId);
        var assignedStores = await stores.GetByZoneIdsAsync(zoneIds);
        var storeIds = assignedStores.Select(x => x.Id).ToArray();

        var dayStart = date.ToDateTime(TimeOnly.MinValue);
        var dayEnd = dayStart.AddDays(1);
        var allBookings = await bookings.GetForStoresAsync(storeIds);
        var budgetList = await budgets.GetRangeAsync(storeIds, date, date);

        var staffingGaps = 0;
        decimal rosterCost = 0m;

        foreach (var store in assignedStores)
        {
            var roster = await employees.GetRosterAsync(store.Id, dayStart, dayEnd);
            var absences = await employees.GetAbsencesAsync(store.Id, dayStart, dayEnd);

            rosterCost += roster.Where(x => !x.IsCancelled).Sum(x => x.EstimatedCost);

            staffingGaps += roster.Count(r =>
                !r.IsCancelled &&
                absences.Any(a => a.EmployeeId == r.EmployeeId && a.StartDateTime < r.EndDateTime && a.EndDateTime > r.StartDateTime));
        }

        var casualCost = allBookings
            .Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed)
            .Where(x => x.StartDateTime < dayEnd && x.EndDateTime > dayStart)
            .Sum(x => x.EstimatedCost);

        var overBudgetStores = 0;
        foreach (var store in assignedStores)
        {
            var budget = budgetList.FirstOrDefault(x => x.StoreId == store.Id)?.Amount ?? 0m;
            if (budget <= 0) continue;

            var storeRosterCost = (await employees.GetRosterAsync(store.Id, dayStart, dayEnd))
                .Where(x => !x.IsCancelled)
                .Sum(x => x.EstimatedCost);

            var storeCasualCost = allBookings
                .Where(x => x.StoreId == store.Id)
                .Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed)
                .Where(x => x.StartDateTime < dayEnd && x.EndDateTime > dayStart)
                .Sum(x => x.EstimatedCost);

            if (storeRosterCost + storeCasualCost > budget) overBudgetStores++;
        }

        var availableCasuals = 0;
        foreach (var casual in (await casuals.SearchAsync(null, null))
                     .Where(x => x.IsActive && x.RegistrationStatus == RegistrationStatus.Approved && x.CurrentZoneId.HasValue && zoneIds.Contains(x.CurrentZoneId.Value)))
        {
            var availability = await casuals.GetAvailabilityAsync(casual.Id, dayStart, dayEnd);
            if (availability.Any(x => x.StartDateTime < dayEnd && x.EndDateTime > dayStart))
                availableCasuals++;
        }

        return new AreaManagerDashboardDto(
            zoneIds.Count,
            assignedStores.Count,
            staffingGaps,
            allBookings.Count(x => x.Status == BookingStatus.Pending),
            allBookings.Count(x => x.Status == BookingStatus.Accepted),
            availableCasuals,
            overBudgetStores,
            rosterCost + casualCost);
    }

    public async Task<IReadOnlyList<AreaStoreSummaryDto>> GetStoresAsync(Guid userId, DateOnly date)
    {
        var (_, zoneIds) = await Context(userId);
        var assignedStores = await stores.GetByZoneIdsAsync(zoneIds);
        var dayStart = date.ToDateTime(TimeOnly.MinValue);
        var dayEnd = dayStart.AddDays(1);
        var result = new List<AreaStoreSummaryDto>();

        foreach (var store in assignedStores)
        {
            var roster = await employees.GetRosterAsync(store.Id, dayStart, dayEnd);
            var absences = await employees.GetAbsencesAsync(store.Id, dayStart, dayEnd);
            var storeBookings = await bookings.GetForStoreAsync(store.Id);
            var budget = await budgets.GetAsync(store.Id, date);

            var gaps = roster.Count(r =>
                !r.IsCancelled &&
                absences.Any(a => a.EmployeeId == r.EmployeeId && a.StartDateTime < r.EndDateTime && a.EndDateTime > r.StartDateTime));

            var cost = roster.Where(x => !x.IsCancelled).Sum(x => x.EstimatedCost) +
                       storeBookings
                           .Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed)
                           .Where(x => x.StartDateTime < dayEnd && x.EndDateTime > dayStart)
                           .Sum(x => x.EstimatedCost);

            var budgetAmount = budget?.Amount ?? 0m;
            var variance = budgetAmount - cost;
            var status = budgetAmount == 0 ? "Not Set" : variance > 0 ? "Under Budget" : variance < 0 ? "Over Budget" : "Exact Budget";

            result.Add(new AreaStoreSummaryDto(
                store.Id,
                store.Code,
                store.Name,
                store.City,
                store.ZoneId,
                store.Zone?.Name ?? string.Empty,
                gaps,
                storeBookings.Count(x => x.Status == BookingStatus.Pending),
                storeBookings.Count(x => x.Status == BookingStatus.Accepted),
                budgetAmount,
                cost,
                variance,
                status));
        }

        return result.OrderByDescending(x => x.StaffingGaps).ThenBy(x => x.StoreName).ToList();
    }

    public async Task<IReadOnlyList<StaffingGapDto>> GetStaffingGapsAsync(Guid userId, DateTime from, DateTime to)
    {
        var (_, zoneIds) = await Context(userId);
        if (to <= from) throw new BusinessRuleException("End must be after start.");

        var assignedStores = await stores.GetByZoneIdsAsync(zoneIds);
        var result = new List<StaffingGapDto>();

        foreach (var store in assignedStores)
        {
            var roster = await employees.GetRosterAsync(store.Id, from, to);
            var absences = await employees.GetAbsencesAsync(store.Id, from, to);

            foreach (var entry in roster.Where(x => !x.IsCancelled))
            {
                var absence = absences.FirstOrDefault(a =>
                    a.EmployeeId == entry.EmployeeId &&
                    a.StartDateTime < entry.EndDateTime &&
                    a.EndDateTime > entry.StartDateTime);

                if (absence is not null)
                {
                    result.Add(new StaffingGapDto(
                        entry.Id,
                        entry.EmployeeId,
                        $"{store.Name} — {entry.Employee?.FirstName} {entry.Employee?.LastName}",
                        entry.Employee!.EmployeeType,
                        entry.StartDateTime,
                        entry.EndDateTime,
                        $"{absence.AbsenceType}: {absence.Reason ?? "No reason provided"}"));
                }
            }
        }

        return result.OrderBy(x => x.StartDateTime).ToList();
    }

    public async Task<IReadOnlyList<AreaCasualDto>> SearchCasualsAsync(
        Guid userId,
        string? city,
        string? search,
        DateTime start,
        DateTime end)
    {
        var (_, zoneIds) = await Context(userId);
        ServiceHelpers.Hours(start, end);

        var allZones = (await zones.GetAllAsync()).ToDictionary(x => x.Id, x => x.Name);
        var result = new List<AreaCasualDto>();

        foreach (var casual in (await casuals.SearchAsync(city, search))
                     .Where(x => x.IsActive &&
                                 x.RegistrationStatus == RegistrationStatus.Approved &&
                                 x.CurrentZoneId.HasValue &&
                                 zoneIds.Contains(x.CurrentZoneId.Value)))
        {
            var available = await casuals.IsAvailableAsync(casual.Id, start, end) &&
                            !await bookings.HasAcceptedOverlapAsync(casual.Id, start, end);

            result.Add(new AreaCasualDto(
                casual.Id,
                $"{casual.FirstName} {casual.LastName}",
                casual.City,
                casual.CurrentZoneId!.Value,
                allZones.GetValueOrDefault(casual.CurrentZoneId.Value, string.Empty),
                casual.RatingAverage,
                casual.Skills.Select(x => x.Skill?.Name ?? string.Empty).Where(x => x.Length > 0).ToList(),
                available));
        }

        return result.OrderByDescending(x => x.IsAvailable).ThenByDescending(x => x.Rating).ToList();
    }

    public async Task<IReadOnlyList<BookingDto>> GetBookingsAsync(Guid userId)
    {
        var (_, zoneIds) = await Context(userId);
        var assignedStores = await stores.GetByZoneIdsAsync(zoneIds);
        await bookings.ExpirePendingAsync(DateTime.UtcNow);

        return (await bookings.GetForStoresAsync(assignedStores.Select(x => x.Id).ToArray()))
            .Select(ServiceHelpers.ToDto)
            .ToList();
    }

    public async Task<CasualTransferDto> TransferCasualAsync(Guid userId, TransferCasualRequest request)
    {
        var (_, zoneIds) = await Context(userId);

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("Transfer reason is required.");
        if (!zoneIds.Contains(request.ToZoneId))
            throw new BusinessRuleException("Destination zone is outside the Area Manager's assigned scope.");

        var destination = await zones.GetByIdAsync(request.ToZoneId) ?? throw new BusinessRuleException("Destination zone not found.");
        if (!destination.IsActive) throw new BusinessRuleException("Destination zone is inactive.");

        var casual = await casuals.GetByIdAsync(request.CasualProfileId) ?? throw new BusinessRuleException("Casual not found.");
        if (casual.CurrentZoneId.HasValue && !zoneIds.Contains(casual.CurrentZoneId.Value))
            throw new BusinessRuleException("Casual's current zone is outside the Area Manager's assigned scope.");
        if (casual.CurrentZoneId == request.ToZoneId)
            throw new BusinessRuleException("Casual is already assigned to the destination zone.");

        var fromZoneId = casual.CurrentZoneId;
        var fromZoneName = fromZoneId.HasValue ? (await zones.GetByIdAsync(fromZoneId.Value))?.Name : null;

        casual.CurrentZoneId = request.ToZoneId;
        await casuals.SaveChangesAsync();

        var transfer = new CasualZoneTransfer
        {
            CasualProfileId = casual.Id,
            FromZoneId = fromZoneId,
            ToZoneId = request.ToZoneId,
            TransferredByUserId = userId,
            Reason = request.Reason.Trim()
        };

        await areaManagers.AddTransferAsync(transfer);
        await areaManagers.SaveChangesAsync();

        await notifications.AddAsync(new Notification
        {
            UserId = casual.UserId,
            Type = NotificationType.General,
            Title = "Zone assignment changed",
            Message = $"You have been transferred to {destination.Name}. Reason: {request.Reason.Trim()}"
        });
        await notifications.SaveChangesAsync();

        await audit.AddAsync(new AuditLog
        {
            UserId = userId,
            Action = "TransferCasualZone",
            EntityName = "CasualProfile",
            EntityId = casual.Id.ToString(),
            Details = $"{fromZoneName ?? "Unassigned"} -> {destination.Name}: {request.Reason.Trim()}"
        });
        await audit.SaveChangesAsync();

        return new CasualTransferDto(
            transfer.Id,
            casual.Id,
            $"{casual.FirstName} {casual.LastName}",
            fromZoneId,
            fromZoneName,
            destination.Id,
            destination.Name,
            transfer.Reason,
            transfer.TransferredAtUtc);
    }

    public async Task<IReadOnlyList<CasualTransferDto>> GetTransfersAsync(Guid userId)
    {
        var (_, zoneIds) = await Context(userId);
        return (await areaManagers.GetTransfersAsync(zoneIds))
            .Select(x => new CasualTransferDto(
                x.Id,
                x.CasualProfileId,
                x.CasualProfile is null ? string.Empty : $"{x.CasualProfile.FirstName} {x.CasualProfile.LastName}",
                x.FromZoneId,
                x.FromZone?.Name,
                x.ToZoneId,
                x.ToZone?.Name ?? string.Empty,
                x.Reason,
                x.TransferredAtUtc))
            .ToList();
    }

    public async Task CancelBookingAsync(Guid userId, int bookingId, string reason)
    {
        var (_, zoneIds) = await Context(userId);
        if (string.IsNullOrWhiteSpace(reason)) throw new BusinessRuleException("Cancellation reason is required.");

        var booking = await bookings.GetByIdAsync(bookingId) ?? throw new BusinessRuleException("Booking not found.");
        var store = await stores.GetByIdAsync(booking.StoreId) ?? throw new BusinessRuleException("Store not found.");

        if (!zoneIds.Contains(store.ZoneId))
            throw new BusinessRuleException("Booking is outside the Area Manager's assigned scope.");
        if (booking.Status is BookingStatus.Cancelled or BookingStatus.Completed or BookingStatus.Expired)
            throw new BusinessRuleException("Booking cannot be cancelled in its current status.");

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAtUtc = DateTime.UtcNow;
        booking.CancelledByUserId = userId;
        booking.CancellationReason = reason.Trim();
        await bookings.SaveChangesAsync();

        await notifications.AddAsync(new Notification
        {
            UserId = booking.CasualProfile!.UserId,
            Type = NotificationType.BookingCancelled,
            Title = "Booking cancelled by Area Manager",
            Message = reason.Trim()
        });
        await notifications.SaveChangesAsync();

        await audit.AddAsync(new AuditLog
        {
            UserId = userId,
            Action = "AreaManagerCancelBooking",
            EntityName = "BookingRequest",
            EntityId = booking.Id.ToString(),
            Details = reason.Trim()
        });
        await audit.SaveChangesAsync();
    }

    public async Task<BookingDto> CreateOverrideBookingAsync(Guid userId, AreaOverrideBookingRequest request)
    {
        var (_, zoneIds) = await Context(userId);

        if (string.IsNullOrWhiteSpace(request.OverrideReason))
            throw new BusinessRuleException("Override reason is required.");

        var store = await stores.GetByIdAsync(request.StoreId) ?? throw new BusinessRuleException("Store not found.");
        if (!zoneIds.Contains(store.ZoneId))
            throw new BusinessRuleException("Store is outside the Area Manager's assigned scope.");

        var casual = await casuals.GetByIdAsync(request.CasualProfileId) ?? throw new BusinessRuleException("Casual not found.");
        if (!casual.IsActive || casual.RegistrationStatus != RegistrationStatus.Approved || !await users.IsApprovedAndActiveAsync(casual.UserId))
            throw new BusinessRuleException("Casual is not active and approved.");

        var paidHours = ServiceHelpers.PaidHours(request.StartDateTime, request.EndDateTime);

        // Hard rules remain non-overridable.
        if (ServiceHelpers.TouchesSunday(request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Sunday bookings are not allowed, including manager overrides.");
        if (request.StartDateTime <= DateTime.Now)
            throw new BusinessRuleException("Booking must be in the future.");
        if (!await casuals.IsAvailableAsync(casual.Id, request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Casual must still be available for the full booking period.");
        if (await bookings.HasAcceptedOverlapAsync(casual.Id, request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Manager override cannot create overlapping bookings.");
        if (await bookings.HasDuplicateActiveRequestAsync(store.Id, casual.Id, request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Duplicate active booking request exists.");

        var week = ServiceHelpers.GetWeek(request.StartDateTime);
        var weekly = await bookings.GetAcceptedHoursAsync(casual.Id, week.Start, week.End);
        if (weekly + paidHours > BusinessRules.MaximumWeeklyPaidHours)
            throw new BusinessRuleException("Manager override cannot exceed the 37.5-hour weekly paid-work cap.");

        var existing = (await bookings.GetForCasualAsync(casual.Id))
            .Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed)
            .Where(x => x.StartDateTime >= request.StartDateTime.Date.AddDays(-8) &&
                        x.StartDateTime < request.StartDateTime.Date.AddDays(8))
            .Select(x => (x.StartDateTime, x.EndDateTime));

        ServiceHelpers.ValidateAdvancedPaidSchedule(
            request.StartDateTime,
            request.EndDateTime,
            existing,
            $"{casual.FirstName} {casual.LastName}");

        Skill? requiredSkill = null;
        if (request.RequiredSkillId.HasValue)
            requiredSkill = await skills.GetByIdAsync(request.RequiredSkillId.Value)
                ?? throw new BusinessRuleException("Required skill does not exist.");

        string ruleCode;
        if (casual.CurrentZoneId != store.ZoneId)
        {
            ruleCode = BusinessRules.RuleZone;
        }
        else if (requiredSkill is not null && !casual.Skills.Any(x => x.SkillId == requiredSkill.Id))
        {
            ruleCode = BusinessRules.RuleSkill;
        }
        else
        {
            throw new BusinessRuleException("No zone or skill exception exists to override. Use the standard Store booking flow.");
        }

        var baseRate = casual.BaseHourlyRate
            ?? throw new BusinessRuleException("No individual pay rate is configured for this Casual. Ask Super Admin to set it.");
        var rate = ServiceHelpers.EffectiveHourlyRate(baseRate, EmployeeType.Casual, request.StartDateTime);

        var booking = new BookingRequest
        {
            StoreId = store.Id,
            CasualProfileId = casual.Id,
            RequestedByUserId = userId,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            HourlyRateSnapshot = rate,
            EstimatedCost = decimal.Round(rate * paidHours, 2, MidpointRounding.AwayFromZero),
            RequiredSkillId = request.RequiredSkillId,
            IsEmergency = (request.StartDateTime - DateTime.Now).TotalHours <= BusinessRules.EmergencyBookingWindowHours,
            OverrideApprovedByUserId = userId,
            OverrideReason = request.OverrideReason.Trim(),
            OverrideRuleCode = ruleCode,
            ExpiresAtUtc = (request.StartDateTime.Date - DateTime.Now.Date).TotalDays >= BusinessRules.AdvanceBookingThresholdDays
                ? DateTime.UtcNow.AddHours(BusinessRules.AdvanceBookingResponseHours)
                : null
        };

        await bookings.AddAsync(booking);
        await bookings.SaveChangesAsync();

        booking.Store = store;
        booking.CasualProfile = casual;
        if (requiredSkill is not null)
            booking.RequiredSkill = requiredSkill;

        await notifications.AddAsync(new Notification
        {
            UserId = casual.UserId,
            Type = NotificationType.BookingRequest,
            Title = "Area Manager booking request",
            Message = $"{store.Name}: {request.StartDateTime:g} - {request.EndDateTime:g}. Override: {request.OverrideReason.Trim()}"
        });
        await notifications.SaveChangesAsync();

        await audit.AddAsync(new AuditLog
        {
            UserId = userId,
            Action = "CreateBookingOverride",
            EntityName = "BookingRequest",
            EntityId = booking.Id.ToString(),
            Details = $"{ruleCode}: {request.OverrideReason.Trim()}"
        });
        await audit.SaveChangesAsync();

        return ServiceHelpers.ToDto(booking);
    }

    public async Task<AreaReportDto> GetReportAsync(Guid userId, DateTime from, DateTime to)
    {
        var (_, zoneIds) = await Context(userId);
        if (to <= from) throw new BusinessRuleException("Report end must be after report start.");

        var assignedStores = await stores.GetByZoneIdsAsync(zoneIds);
        var storeIds = assignedStores.Select(x => x.Id).ToArray();
        var areaBookings = (await bookings.GetForStoresAsync(storeIds))
            .Where(x => x.StartDateTime < to && x.EndDateTime > from)
            .ToList();

        var gapEvents = 0;
        foreach (var store in assignedStores)
        {
            var roster = await employees.GetRosterAsync(store.Id, from, to);
            var absences = await employees.GetAbsencesAsync(store.Id, from, to);
            gapEvents += roster.Count(r =>
                !r.IsCancelled &&
                absences.Any(a => a.EmployeeId == r.EmployeeId && a.StartDateTime < r.EndDateTime && a.EndDateTime > r.StartDateTime));
        }

        return new AreaReportDto(
            from,
            to,
            assignedStores.Count,
            gapEvents,
            areaBookings.Count,
            areaBookings.Count(x => x.Status == BookingStatus.Accepted),
            areaBookings.Count(x => x.Status == BookingStatus.Completed),
            areaBookings.Count(x => x.Status == BookingStatus.Cancelled),
            areaBookings.Count(x => x.OverrideApprovedByUserId.HasValue),
            areaBookings.Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed).Sum(x => x.EstimatedCost));
    }
}
