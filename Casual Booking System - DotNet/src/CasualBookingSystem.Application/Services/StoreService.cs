using CasualBookingSystem.Application.Common;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.Services;

public class StoreService(
    IUserAccountService users,
    IStoreRepository stores,
    IEmployeeRepository employees,
    ICasualRepository casuals,
    IBookingRepository bookings,
    IStoreBudgetRepository budgets,
    INotificationRepository notifications,
    IRatingRepository ratings,
    ISkillRepository skills,
    IZoneRepository zones,
    IPublicHolidayRepository publicHolidays) : IStoreService
{
    private async Task<(UserAccountDto User, Store Store)> StoreContext(Guid userId)
    {
        var user = await users.GetByIdAsync(userId) ?? throw new BusinessRuleException("User not found.");
        if (!user.IsActive || user.ApprovalStatus != RegistrationStatus.Approved)
            throw new BusinessRuleException("Account is not active and approved.");
        if (user.Role is not (UserRole.StoreManager or UserRole.AssistantManager))
            throw new BusinessRuleException("Store access required.");
        if (!user.StoreId.HasValue)
            throw new BusinessRuleException("User is not assigned to a store.");

        var store = await stores.GetByIdAsync(user.StoreId.Value) ?? throw new BusinessRuleException("Store not found.");
        if (!store.IsActive || store.RegistrationStatus != RegistrationStatus.Approved)
            throw new BusinessRuleException("Store is not active and approved.");

        return (user, store);
    }

    private async Task EnsureManagerEmployeesAsync(Store store)
    {
        var accounts = (await users.GetAllAsync())
            .Where(x => x.StoreId == store.Id && x.Role is UserRole.StoreManager or UserRole.AssistantManager)
            .ToList();

        var changed = false;
        foreach (var account in accounts)
        {
            var existing = await employees.GetByUserIdAsync(account.UserId);
            if (existing is not null) continue;

            await employees.AddAsync(new Employee
            {
                StoreId = store.Id,
                UserId = account.UserId,
                EmployeeType = account.Role == UserRole.StoreManager ? EmployeeType.StoreManager : EmployeeType.AssistantManager,
                FirstName = account.FirstName,
                LastName = account.LastName,
                IsActive = account.IsActive
            });
            changed = true;
        }

        if (changed) await employees.SaveChangesAsync();
    }

    private static DailyLabourItemDto LabourItem(string name, EmployeeType type, DateTime start, DateTime end, decimal baseRate)
    {
        var scheduled = ServiceHelpers.Hours(start, end);
        var paid = ServiceHelpers.PaidHours(start, end);
        var effective = ServiceHelpers.EffectiveHourlyRate(baseRate, type, start);
        var casualLoading = type == EmployeeType.Casual ? BusinessRules.CasualLoadingPercent : 0m;
        var saturdayLoading = start.DayOfWeek == DayOfWeek.Saturday ? BusinessRules.SaturdayLoadingPercent : 0m;
        return new DailyLabourItemDto(
            name, type.ToString(), scheduled, scheduled - paid, paid, baseRate, casualLoading, saturdayLoading, effective,
            decimal.Round(effective * paid, 2, MidpointRounding.AwayFromZero));
    }

    private static EmployeeWorkPatternDto ToPatternDto(Employee employee, EmployeeWorkPattern pattern)
    {
        var end = pattern.StartTime.Add(TimeSpan.FromHours((double)pattern.ScheduledHours));
        var paidHours = employee.EmployeeType == EmployeeType.Volunteer
            ? 0m
            : pattern.ScheduledHours > BusinessRules.MealBreakThresholdHours
                ? pattern.ScheduledHours - BusinessRules.UnpaidMealBreakHours
                : pattern.ScheduledHours;

        return new EmployeeWorkPatternDto(
            pattern.Id,
            employee.Id,
            pattern.DayOfWeek,
            ((DayOfWeek)pattern.DayOfWeek).ToString(),
            pattern.StartTime.ToString("HH:mm"),
            end.ToString("HH:mm"),
            pattern.ScheduledHours,
            paidHours);
    }

    private async Task EnsurePatternRosterAsync(Store store, DateTime from, DateTime to)
    {
        if (to <= from) return;

        await EnsureManagerEmployeesAsync(store);

        // Only volunteers use recurring weekly patterns.
        // Paid staff remain manually rostered (single entry or selected date range).
        var volunteers = (await employees.GetByStoreAsync(store.Id))
            .Where(x => x.IsActive && x.EmployeeType == EmployeeType.Volunteer)
            .ToList();

        var firstDate = from.Date;
        var lastDate = to.AddTicks(-1).Date;

        foreach (var volunteer in volunteers)
        {
            var patterns = await employees.GetWorkPatternsAsync(volunteer.Id);
            if (patterns.Count == 0) continue;

            for (var date = firstDate; date <= lastDate; date = date.AddDays(1))
            {
                if (date.DayOfWeek == DayOfWeek.Sunday) continue;

                var pattern = patterns.FirstOrDefault(x =>
                    x.DayOfWeek == (int)date.DayOfWeek && x.IsActive);

                if (pattern is null) continue;

                var start = date.Add(pattern.StartTime.ToTimeSpan());
                var end = start.AddHours((double)pattern.ScheduledHours);

                if (end <= from || start >= to) continue;
                if (await employees.HasRosterOverlapAsync(volunteer.Id, start, end)) continue;

                var absences = await employees.GetAbsencesAsync(store.Id, start, end);
                var unavailable = absences.Any(x =>
                    x.EmployeeId == volunteer.Id &&
                    x.StartDateTime < end &&
                    x.EndDateTime > start);

                if (unavailable) continue;

                await employees.AddRosterAsync(new EmployeeRosterEntry
                {
                    StoreId = store.Id,
                    EmployeeId = volunteer.Id,
                    StartDateTime = start,
                    EndDateTime = end,
                    HourlyRateSnapshot = 0m,
                    EstimatedCost = 0m,
                    IsGeneratedFromPattern = true
                });

                // Save generated volunteer rows so subsequent range loads see them.
                await employees.SaveChangesAsync();
            }
        }
    }

    public async Task<StoreDashboardDto> GetDashboardAsync(Guid storeUserId, DateOnly date)
    {
        var (_, store) = await StoreContext(storeUserId);
        await EnsureManagerEmployeesAsync(store);
        await bookings.ExpirePendingAsync(DateTime.UtcNow);

        var dayStart = date.ToDateTime(TimeOnly.MinValue);
        var dayEnd = dayStart.AddDays(1);

        // Generate today's recurring volunteer roster rows, if applicable.
        await EnsurePatternRosterAsync(store, dayStart, dayEnd);

        // Today's employee roster.
        var roster = await employees.GetRosterAsync(store.Id, dayStart, dayEnd);
        var todayAbsences = await employees.GetAbsencesAsync(store.Id, dayStart, dayEnd);

        // Remove cancelled rows and employees who are absent during their shift.
        var effectiveRoster = roster
            .Where(x => !x.IsCancelled)
            .Where(x => !todayAbsences.Any(a =>
                a.EmployeeId == x.EmployeeId &&
                a.StartDateTime < x.EndDateTime &&
                a.EndDateTime > x.StartDateTime))
            .ToList();

        // Store bookings and today's accepted/completed Casual shifts.
        var storeBookings = await bookings.GetForStoreAsync(store.Id);

        var todayCasualBookings = storeBookings
            .Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed)
            .Where(x => x.StartDateTime < dayEnd && x.EndDateTime > dayStart)
            .Where(x => x.CasualProfile is not null)
            .ToList();

        int CountEmployeeType(EmployeeType type) =>
            effectiveRoster
                .Where(x => x.Employee is not null && x.Employee.EmployeeType == type)
                .Select(x => x.EmployeeId)
                .Distinct()
                .Count();

        var storeManagersToday = CountEmployeeType(EmployeeType.StoreManager);
        var assistantManagersToday = CountEmployeeType(EmployeeType.AssistantManager);
        var fullTimeToday = CountEmployeeType(EmployeeType.FullTime);
        var partTimeToday = CountEmployeeType(EmployeeType.PartTime);
        var volunteersToday = CountEmployeeType(EmployeeType.Volunteer);

        var casualsToday = todayCasualBookings
            .Select(x => x.CasualProfileId)
            .Distinct()
            .Count();

        var regularStaffToday = effectiveRoster
            .Select(x => x.EmployeeId)
            .Distinct()
            .Count();

        var todayRostered = regularStaffToday + casualsToday;

        // Today's staffing gaps.
        var gaps = await GetStaffingGapsInternal(store.Id, dayStart, dayEnd);

        // Next 14 calendar days of recorded absences, regardless of whether a
        // matching roster row exists.
        var absenceEndExclusive = dayStart.AddDays(14);

        var fortnightAbsences = await employees.GetAbsencesAsync(
            store.Id,
            dayStart,
            absenceEndExclusive);

        var storeEmployees = await employees.GetByStoreAsync(store.Id);
        var employeeMap = storeEmployees.ToDictionary(x => x.Id);

        var dashboardAbsences = fortnightAbsences
            .Where(x => employeeMap.ContainsKey(x.EmployeeId))
            .Select(x =>
            {
                var employee = employeeMap[x.EmployeeId];

                return new DashboardAbsenceDto(
                    x.Id,
                    x.EmployeeId,
                    $"{employee.FirstName} {employee.LastName}",
                    employee.EmployeeType,
                    x.AbsenceType,
                    x.StartDateTime,
                    x.EndDateTime,
                    x.Reason);
            })
            .OrderBy(x => x.StartDateTime)
            .ToList();

        var budget = await budgets.GetAsync(store.Id, date);
        var holiday = await publicHolidays.GetByDateAsync(date);

        var labourItems = new List<DailyLabourItemDto>();

        foreach (var r in effectiveRoster.Where(x => x.Employee is not null))
        {
            if (r.Employee!.EmployeeType == EmployeeType.Volunteer)
            {
                labourItems.Add(new DailyLabourItemDto(
                    $"{r.Employee.FirstName} {r.Employee.LastName}",
                    r.Employee.EmployeeType.ToString(),
                    ServiceHelpers.Hours(r.StartDateTime, r.EndDateTime),
                    0m,
                    0m,
                    0m,
                    0m,
                    0m,
                    0m,
                    0m));

                continue;
            }

            var baseRate = r.Employee.BaseHourlyRate ?? r.HourlyRateSnapshot;

            labourItems.Add(LabourItem(
                $"{r.Employee.FirstName} {r.Employee.LastName}",
                r.Employee.EmployeeType,
                r.StartDateTime,
                r.EndDateTime,
                baseRate));
        }

        foreach (var b in todayCasualBookings)
        {
            var baseRate = b.CasualProfile!.BaseHourlyRate;

            if (!baseRate.HasValue && b.HourlyRateSnapshot > 0)
                baseRate = b.HourlyRateSnapshot;

            labourItems.Add(LabourItem(
                $"{b.CasualProfile.FirstName} {b.CasualProfile.LastName}",
                EmployeeType.Casual,
                b.StartDateTime,
                b.EndDateTime,
                baseRate ?? 0m));
        }

        var cost = labourItems.Sum(x => x.Cost);
        var amount = budget?.Amount ?? 0m;
        var variance = amount - cost;

        var status = amount == 0m
            ? "Not Set"
            : variance > 0m
                ? "Under Budget"
                : variance < 0m
                    ? "Over Budget"
                    : "Exact Budget";

        return new StoreDashboardDto(
            TodayRostered: todayRostered,
            StoreManagersToday: storeManagersToday,
            AssistantManagersToday: assistantManagersToday,
            FullTimeToday: fullTimeToday,
            PartTimeToday: partTimeToday,
            VolunteersToday: volunteersToday,
            CasualsToday: casualsToday,
            PendingBookings: storeBookings.Count(x => x.Status == BookingStatus.Pending),
            AcceptedUpcoming: storeBookings.Count(x =>
                x.Status == BookingStatus.Accepted &&
                x.StartDateTime >= DateTime.Now),
            StaffingGaps: gaps.Count,
            DailyBudget: amount,
            ScheduledLabourCost: cost,
            BudgetVariance: variance,
            BudgetStatus: status,
            IsPublicHoliday: holiday is not null,
            PublicHolidayName: holiday?.Name,
            CancellationsLast30Days: storeBookings.Count(x =>
                x.Status == BookingStatus.Cancelled &&
                x.CancelledAtUtc >= DateTime.UtcNow.AddDays(-30)),
            LabourItems: labourItems.OrderBy(x => x.WorkerName).ToList(),
            AbsenceRangeFrom: date,
            AbsenceRangeTo: date.AddDays(13),
            Absences: dashboardAbsences);
    }

    public async Task<IReadOnlyList<EmployeeDto>> GetEmployeesAsync(Guid storeUserId)
    {
        var (_, store) = await StoreContext(storeUserId);
        await EnsureManagerEmployeesAsync(store);
        return (await employees.GetByStoreAsync(store.Id))
            .Select(x => new EmployeeDto(x.Id, x.FirstName, x.LastName, x.EmployeeType, x.Phone, x.SkillSummary, x.BaseHourlyRate, x.IsActive))
            .ToList();
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(Guid storeUserId, CreateEmployeeRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);

        if (request.EmployeeType is EmployeeType.Casual or EmployeeType.StoreManager or EmployeeType.AssistantManager)
            throw new BusinessRuleException("Only Part-Time, Full-Time and Volunteer staff can be created here.");
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw new BusinessRuleException("Employee first and last name are required.");

        var employee = new Employee
        {
            StoreId = store.Id,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            EmployeeType = request.EmployeeType,
            Phone = request.Phone?.Trim(),
            SkillSummary = request.SkillSummary?.Trim()
        };

        await employees.AddAsync(employee);
        await employees.SaveChangesAsync();

        return new EmployeeDto(employee.Id, employee.FirstName, employee.LastName, employee.EmployeeType, employee.Phone, employee.SkillSummary, employee.BaseHourlyRate, employee.IsActive);
    }

    public async Task CreateAssistantManagerAsync(Guid storeUserId, CreateAssistantManagerRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);
        var userId = await users.CreateUserAsync(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            UserRole.AssistantManager,
            RegistrationStatus.Approved,
            store.Id);

        await employees.AddAsync(new Employee
        {
            StoreId = store.Id,
            UserId = userId,
            EmployeeType = EmployeeType.AssistantManager,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            IsActive = true
        });
        await employees.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<RosterEntryDto>> GetRosterAsync(Guid storeUserId, DateTime from, DateTime to)
    {
        var (_, store) = await StoreContext(storeUserId);
        await EnsurePatternRosterAsync(store, from, to);

        return (await employees.GetRosterAsync(store.Id, from, to))
            .Select(x => new RosterEntryDto(
                x.Id,
                x.EmployeeId,
                $"{x.Employee?.FirstName} {x.Employee?.LastName}",
                x.Employee!.EmployeeType,
                x.StartDateTime,
                x.EndDateTime,
                x.EstimatedCost,
                x.IsCancelled,
                x.IsGeneratedFromPattern))
            .ToList();
    }

    public async Task<RosterEntryDto> CreateRosterAsync(Guid storeUserId, CreateRosterEntryRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);
        var employee = await employees.GetByIdAsync(request.EmployeeId) ?? throw new BusinessRuleException("Employee not found.");

        if (employee.StoreId != store.Id)
            throw new BusinessRuleException("Employee belongs to another store.");
        if (!employee.IsActive)
            throw new BusinessRuleException("Employee is inactive.");
        if (ServiceHelpers.TouchesSunday(request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Sunday bookings/rosters are not allowed.");
        if (request.StartDateTime <= DateTime.Now)
            throw new BusinessRuleException("Roster entry must start in the future.");

        var scheduledHours = ServiceHelpers.Hours(request.StartDateTime, request.EndDateTime);
        if (scheduledHours > BusinessRules.MaximumScheduledShiftHours)
            throw new BusinessRuleException($"A shift cannot exceed {BusinessRules.MaximumScheduledShiftHours} scheduled hours.");
        var paidHours = employee.EmployeeType == EmployeeType.Volunteer
            ? scheduledHours
            : ServiceHelpers.PaidHours(request.StartDateTime, request.EndDateTime);

        if (await employees.HasRosterOverlapAsync(employee.Id, request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Employee already has an overlapping roster entry.");

        var absences = await employees.GetAbsencesAsync(store.Id, request.StartDateTime, request.EndDateTime);
        if (absences.Any(x =>
            x.EmployeeId == employee.Id &&
            x.StartDateTime < request.EndDateTime &&
            x.EndDateTime > request.StartDateTime))
            throw new BusinessRuleException("Employee has leave, absence, weekly-off or unavailability during this roster window.");

        decimal rate = 0m;

        if (employee.EmployeeType != EmployeeType.Volunteer)
        {
            var week = ServiceHelpers.GetWeek(request.StartDateTime);
            var existingWeeklyHours = await employees.GetWeeklyRosterHoursAsync(employee.Id, week.Start, week.End);
            if (existingWeeklyHours + paidHours > BusinessRules.MaximumWeeklyPaidHours)
                throw new BusinessRuleException($"Weekly paid hours cannot exceed {BusinessRules.MaximumWeeklyPaidHours}.");

            var nearbyRoster = (await employees.GetRosterAsync(
                    store.Id,
                    request.StartDateTime.Date.AddDays(-BusinessRules.MaximumConsecutivePaidDays - 1),
                    request.EndDateTime.Date.AddDays(BusinessRules.MaximumConsecutivePaidDays + 2)))
                .Where(x => x.EmployeeId == employee.Id && !x.IsCancelled)
                .Select(x => (x.StartDateTime, x.EndDateTime));

            ServiceHelpers.ValidateAdvancedPaidSchedule(
                request.StartDateTime,
                request.EndDateTime,
                nearbyRoster,
                $"{employee.FirstName} {employee.LastName}");

            var baseRate = employee.BaseHourlyRate
                ?? throw new BusinessRuleException($"No individual pay rate is configured for {employee.FirstName} {employee.LastName}. Ask Super Admin to set it.");
            rate = ServiceHelpers.EffectiveHourlyRate(baseRate, employee.EmployeeType, request.StartDateTime);
        }

        var entry = new EmployeeRosterEntry
        {
            StoreId = store.Id,
            EmployeeId = employee.Id,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            HourlyRateSnapshot = rate,
            EstimatedCost = decimal.Round(rate * paidHours, 2, MidpointRounding.AwayFromZero)
        };

        await employees.AddRosterAsync(entry);
        await employees.SaveChangesAsync();

        entry.Employee = employee;

        return new RosterEntryDto(
            entry.Id,
            employee.Id,
            $"{employee.FirstName} {employee.LastName}",
            employee.EmployeeType,
            entry.StartDateTime,
            entry.EndDateTime,
            entry.EstimatedCost,
            false,
            false);
    }

    public async Task<IReadOnlyList<RosterEntryDto>> CreateRosterRangeAsync(
        Guid storeUserId,
        CreateRosterRangeRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);
        var employee = await employees.GetByIdAsync(request.EmployeeId)
            ?? throw new BusinessRuleException("Employee not found.");

        if (employee.StoreId != store.Id)
            throw new BusinessRuleException("Employee belongs to another store.");
        if (!employee.IsActive)
            throw new BusinessRuleException("Employee is inactive.");
        if (employee.EmployeeType == EmployeeType.Volunteer)
            throw new BusinessRuleException("Use the volunteer weekly schedule or a one-off roster entry for volunteers.");
        if (request.ToDate < request.FromDate)
            throw new BusinessRuleException("To date cannot be before From date.");
        if (!TimeOnly.TryParse(request.StartTime, out var startTime) ||
            !TimeOnly.TryParse(request.EndTime, out var endTime))
            throw new BusinessRuleException("Start time or end time is invalid.");
        if (endTime <= startTime)
            throw new BusinessRuleException("End time must be after start time.");

        var days = new List<(DateTime Start, DateTime End)>();
        for (var date = request.FromDate; date <= request.ToDate; date = date.AddDays(1))
        {
            var start = date.ToDateTime(startTime);
            if (start.DayOfWeek == DayOfWeek.Sunday)
                continue; // Project rule: no Sunday rosters.

            var end = date.ToDateTime(endTime);
            var scheduledHours = ServiceHelpers.Hours(start, end);
            if (scheduledHours > BusinessRules.MaximumScheduledShiftHours)
                throw new BusinessRuleException(
                    $"A shift cannot exceed {BusinessRules.MaximumScheduledShiftHours} scheduled hours.");

            days.Add((start, end));
        }

        if (days.Count == 0)
            throw new BusinessRuleException("The selected date range contains no rosterable days.");

        var baseRate = employee.BaseHourlyRate
            ?? throw new BusinessRuleException(
                $"No individual pay rate is configured for {employee.FirstName} {employee.LastName}. Ask Super Admin to set it.");

        // Validate the whole range before inserting anything.
        var planned = new List<(DateTime Start, DateTime End)>();
        var weeklyAdds = new Dictionary<DateTime, decimal>();

        foreach (var day in days)
        {
            if (day.Start <= DateTime.Now)
                throw new BusinessRuleException("Roster entries must start in the future.");

            if (await employees.HasRosterOverlapAsync(employee.Id, day.Start, day.End))
                throw new BusinessRuleException(
                    $"{employee.FirstName} {employee.LastName} already has an overlapping roster entry on {day.Start:dd MMM yyyy}.");

            var absences = await employees.GetAbsencesAsync(store.Id, day.Start, day.End);
            if (absences.Any(x =>
                x.EmployeeId == employee.Id &&
                x.StartDateTime < day.End &&
                x.EndDateTime > day.Start))
                throw new BusinessRuleException(
                    $"{employee.FirstName} {employee.LastName} has leave, absence, weekly-off or unavailability on {day.Start:dd MMM yyyy}.");

            var paidHours = ServiceHelpers.PaidHours(day.Start, day.End);
            var week = ServiceHelpers.GetWeek(day.Start);
            var weekKey = week.Start.Date;

            if (!weeklyAdds.ContainsKey(weekKey))
            {
                weeklyAdds[weekKey] = await employees.GetWeeklyRosterHoursAsync(
                    employee.Id, week.Start, week.End);
            }

            if (weeklyAdds[weekKey] + paidHours > BusinessRules.MaximumWeeklyPaidHours)
                throw new BusinessRuleException(
                    $"Weekly paid hours would exceed {BusinessRules.MaximumWeeklyPaidHours} hours in the week starting {week.Start:dd MMM yyyy}.");

            var nearbyExisting = (await employees.GetRosterAsync(
                    store.Id,
                    day.Start.Date.AddDays(-BusinessRules.MaximumConsecutivePaidDays - 1),
                    day.End.Date.AddDays(BusinessRules.MaximumConsecutivePaidDays + 2)))
                .Where(x => x.EmployeeId == employee.Id && !x.IsCancelled)
                .Select(x => (x.StartDateTime, x.EndDateTime));

            ServiceHelpers.ValidateAdvancedPaidSchedule(
                day.Start,
                day.End,
                nearbyExisting.Concat(planned),
                $"{employee.FirstName} {employee.LastName}");

            weeklyAdds[weekKey] += paidHours;
            planned.Add(day);
        }

        var created = new List<EmployeeRosterEntry>();

        foreach (var day in days)
        {
            var paidHours = ServiceHelpers.PaidHours(day.Start, day.End);
            var rate = ServiceHelpers.EffectiveHourlyRate(
                baseRate, employee.EmployeeType, day.Start);

            var entry = new EmployeeRosterEntry
            {
                StoreId = store.Id,
                EmployeeId = employee.Id,
                StartDateTime = day.Start,
                EndDateTime = day.End,
                HourlyRateSnapshot = rate,
                EstimatedCost = decimal.Round(
                    rate * paidHours, 2, MidpointRounding.AwayFromZero),
                IsGeneratedFromPattern = false
            };

            await employees.AddRosterAsync(entry);
            created.Add(entry);
        }

        await employees.SaveChangesAsync();

        return created.Select(entry => new RosterEntryDto(
            entry.Id,
            employee.Id,
            $"{employee.FirstName} {employee.LastName}",
            employee.EmployeeType,
            entry.StartDateTime,
            entry.EndDateTime,
            entry.EstimatedCost,
            entry.IsCancelled,
            false)).ToList();
    }

    public async Task<RosterEntryDto> UpdateRosterAsync(Guid storeUserId, int rosterEntryId, UpdateRosterEntryRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);
        var entry = await employees.GetRosterByIdAsync(rosterEntryId)
            ?? throw new BusinessRuleException("Roster entry not found.");

        if (entry.StoreId != store.Id)
            throw new BusinessRuleException("Roster entry belongs to another store.");

        var employee = entry.Employee ?? await employees.GetByIdAsync(entry.EmployeeId)
            ?? throw new BusinessRuleException("Employee not found.");

        if (ServiceHelpers.TouchesSunday(request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Sunday rosters are not allowed.");

        var scheduledHours = ServiceHelpers.Hours(request.StartDateTime, request.EndDateTime);
        if (scheduledHours > BusinessRules.MaximumScheduledShiftHours)
            throw new BusinessRuleException($"A shift cannot exceed {BusinessRules.MaximumScheduledShiftHours} scheduled hours.");

        if (await employees.HasRosterOverlapAsync(employee.Id, request.StartDateTime, request.EndDateTime, entry.Id))
            throw new BusinessRuleException("Employee already has an overlapping roster entry.");

        var absences = await employees.GetAbsencesAsync(store.Id, request.StartDateTime, request.EndDateTime);
        if (absences.Any(x =>
            x.EmployeeId == employee.Id &&
            x.StartDateTime < request.EndDateTime &&
            x.EndDateTime > request.StartDateTime))
            throw new BusinessRuleException("Employee has leave, absence, weekly-off or unavailability during this roster window.");

        var paidHours = employee.EmployeeType == EmployeeType.Volunteer
            ? scheduledHours
            : ServiceHelpers.PaidHours(request.StartDateTime, request.EndDateTime);

        decimal rate = 0m;
        if (employee.EmployeeType != EmployeeType.Volunteer)
        {
            var week = ServiceHelpers.GetWeek(request.StartDateTime);
            var existingWeeklyHours = await employees.GetWeeklyRosterHoursAsync(employee.Id, week.Start, week.End, entry.Id);
            if (existingWeeklyHours + paidHours > BusinessRules.MaximumWeeklyPaidHours)
                throw new BusinessRuleException($"Weekly paid hours cannot exceed {BusinessRules.MaximumWeeklyPaidHours}.");

            var nearby = (await employees.GetRosterAsync(
                    store.Id,
                    request.StartDateTime.Date.AddDays(-BusinessRules.MaximumConsecutivePaidDays - 1),
                    request.EndDateTime.Date.AddDays(BusinessRules.MaximumConsecutivePaidDays + 2)))
                .Where(x => x.EmployeeId == employee.Id && !x.IsCancelled && x.Id != entry.Id)
                .Select(x => (x.StartDateTime, x.EndDateTime));

            ServiceHelpers.ValidateAdvancedPaidSchedule(
                request.StartDateTime,
                request.EndDateTime,
                nearby,
                $"{employee.FirstName} {employee.LastName}");

            var baseRate = employee.BaseHourlyRate
                ?? throw new BusinessRuleException($"No individual pay rate is configured for {employee.FirstName} {employee.LastName}. Ask Super Admin to set it.");
            rate = ServiceHelpers.EffectiveHourlyRate(baseRate, employee.EmployeeType, request.StartDateTime);
        }

        entry.StartDateTime = request.StartDateTime;
        entry.EndDateTime = request.EndDateTime;
        entry.HourlyRateSnapshot = rate;
        entry.EstimatedCost = employee.EmployeeType == EmployeeType.Volunteer
            ? 0m
            : decimal.Round(rate * paidHours, 2, MidpointRounding.AwayFromZero);
        entry.IsGeneratedFromPattern = false;

        await employees.SaveChangesAsync();

        return new RosterEntryDto(
            entry.Id,
            employee.Id,
            $"{employee.FirstName} {employee.LastName}",
            employee.EmployeeType,
            entry.StartDateTime,
            entry.EndDateTime,
            entry.EstimatedCost,
            entry.IsCancelled,
            entry.IsGeneratedFromPattern);
    }

    public async Task<IReadOnlyList<EmployeeWorkPatternDto>> GetWorkPatternAsync(Guid storeUserId, int employeeId)
    {
        var (_, store) = await StoreContext(storeUserId);
        var employee = await employees.GetByIdAsync(employeeId)
            ?? throw new BusinessRuleException("Employee not found.");

        if (employee.StoreId != store.Id)
            throw new BusinessRuleException("Employee belongs to another store.");
        if (employee.EmployeeType != EmployeeType.Volunteer)
            throw new BusinessRuleException("Recurring weekly schedules are only used for volunteers.");

        return (await employees.GetWorkPatternsAsync(employee.Id))
            .Select(x => ToPatternDto(employee, x))
            .ToList();
    }

    public async Task<IReadOnlyList<EmployeeWorkPatternDto>> SetWorkPatternAsync(
        Guid storeUserId,
        int employeeId,
        SetEmployeeWorkPatternRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);
        var employee = await employees.GetByIdAsync(employeeId)
            ?? throw new BusinessRuleException("Employee not found.");

        if (employee.StoreId != store.Id)
            throw new BusinessRuleException("Employee belongs to another store.");
        if (!employee.IsActive)
            throw new BusinessRuleException("Employee is inactive.");
        if (employee.EmployeeType != EmployeeType.Volunteer)
            throw new BusinessRuleException("Recurring weekly schedules are only used for volunteers.");

        var items = request.Days
            .GroupBy(x => x.DayOfWeek)
            .Select(x => x.Last())
            .OrderBy(x => x.DayOfWeek)
            .ToList();

        if (items.Any(x => x.DayOfWeek < 1 || x.DayOfWeek > 6))
            throw new BusinessRuleException("Volunteer schedule can use Monday to Saturday only.");

        var patterns = new List<EmployeeWorkPattern>();

        foreach (var item in items)
        {
            if (!TimeOnly.TryParse(item.StartTime, out var startTime) ||
                !TimeOnly.TryParse(item.EndTime, out var endTime))
                throw new BusinessRuleException(
                    $"Invalid volunteer time for {(DayOfWeek)item.DayOfWeek}.");

            if (endTime <= startTime)
                throw new BusinessRuleException(
                    $"End time must be after start time for {(DayOfWeek)item.DayOfWeek}.");

            var scheduledHours = (decimal)(endTime.ToTimeSpan() - startTime.ToTimeSpan()).TotalHours;
            if (scheduledHours <= 0 || scheduledHours > BusinessRules.MaximumScheduledShiftHours)
                throw new BusinessRuleException(
                    $"Volunteer shift on {(DayOfWeek)item.DayOfWeek} must be no more than {BusinessRules.MaximumScheduledShiftHours} hours.");

            patterns.Add(new EmployeeWorkPattern
            {
                EmployeeId = employee.Id,
                DayOfWeek = item.DayOfWeek,
                StartTime = startTime,
                ScheduledHours = scheduledHours,
                IsActive = true
            });
        }

        await employees.ReplaceWorkPatternsAsync(employee.Id, patterns);

        // Rebuild only future rows that were generated from the volunteer's old weekly schedule.
        // Manual one-off volunteer entries are preserved.
        await employees.RemoveFutureGeneratedRosterAsync(employee.Id, DateTime.Today);
        await employees.SaveChangesAsync();

        return (await employees.GetWorkPatternsAsync(employee.Id))
            .Select(x => ToPatternDto(employee, x))
            .ToList();
    }

    public async Task<AbsenceDto> RecordAbsenceAsync(Guid storeUserId, CreateAbsenceRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);
        var employee = await employees.GetByIdAsync(request.EmployeeId) ?? throw new BusinessRuleException("Employee not found.");

        if (employee.StoreId != store.Id)
            throw new BusinessRuleException("Employee belongs to another store.");

        ServiceHelpers.Hours(request.StartDateTime, request.EndDateTime);

        var absence = new EmployeeAbsence
        {
            StoreId = store.Id,
            EmployeeId = employee.Id,
            AbsenceType = request.AbsenceType,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            Reason = request.Reason?.Trim()
        };

        await employees.AddAbsenceAsync(absence);
        await employees.SaveChangesAsync();

        return new AbsenceDto(
            absence.Id,
            employee.Id,
            $"{employee.FirstName} {employee.LastName}",
            absence.AbsenceType,
            absence.StartDateTime,
            absence.EndDateTime,
            absence.Reason);
    }

    public async Task<IReadOnlyList<StaffingGapDto>> GetStaffingGapsAsync(Guid storeUserId, DateTime from, DateTime to)
    {
        var (_, store) = await StoreContext(storeUserId);
        return await GetStaffingGapsInternal(store.Id, from, to);
    }

    private async Task<IReadOnlyList<StaffingGapDto>> GetStaffingGapsInternal(int storeId, DateTime from, DateTime to)
    {
        var roster = await employees.GetRosterAsync(storeId, from, to);
        var absences = await employees.GetAbsencesAsync(storeId, from, to);
        var result = new List<StaffingGapDto>();

        foreach (var rosterEntry in roster.Where(x => !x.IsCancelled))
        {
            var absence = absences.FirstOrDefault(a =>
                a.EmployeeId == rosterEntry.EmployeeId &&
                a.StartDateTime < rosterEntry.EndDateTime &&
                a.EndDateTime > rosterEntry.StartDateTime);

            if (absence is not null)
            {
                result.Add(new StaffingGapDto(
                    rosterEntry.Id,
                    rosterEntry.EmployeeId,
                    $"{rosterEntry.Employee?.FirstName} {rosterEntry.Employee?.LastName}",
                    rosterEntry.Employee!.EmployeeType,
                    rosterEntry.StartDateTime,
                    rosterEntry.EndDateTime,
                    $"{absence.AbsenceType}: {absence.Reason ?? "No reason provided"}"));
            }
        }

        return result;
    }

    public async Task<CasualSearchFiltersDto> GetCasualSearchFiltersAsync(Guid storeUserId)
    {
        await StoreContext(storeUserId);

        var allCasuals = await casuals.SearchAsync(null, null);
        var cities = allCasuals
            .Where(x => x.IsActive && x.RegistrationStatus == RegistrationStatus.Approved)
            .Select(x => x.City.Trim())
            .Where(x => x.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToList();

        var zoneDtos = (await zones.GetAllAsync())
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new ZoneDto(x.Id, x.Name, x.IsActive))
            .ToList();

        var skillDtos = (await skills.GetAllAsync())
            .Select(x => new SkillDto(x.Id, x.Name))
            .ToList();

        return new CasualSearchFiltersDto(cities, zoneDtos, skillDtos);
    }

    public async Task<IReadOnlyList<CasualSearchDto>> SearchCasualsAsync(
        Guid storeUserId,
        string? city,
        string? search,
        DateTime start,
        DateTime end,
        int? zoneId = null,
        IReadOnlyList<int>? skillIds = null)
    {
        var (_, store) = await StoreContext(storeUserId);
        var paidHours = ServiceHelpers.PaidHours(start, end);

        var list = await casuals.SearchAsync(city, search);
        var selectedSkillIds = (skillIds ?? Array.Empty<int>()).Distinct().ToHashSet();

        var candidates = list
            .Where(x => x.IsActive && x.RegistrationStatus == RegistrationStatus.Approved)
            .Where(x => !zoneId.HasValue || x.CurrentZoneId == zoneId.Value)
            .Where(x => selectedSkillIds.Count == 0 || selectedSkillIds.All(id => x.Skills.Any(s => s.SkillId == id)))
            .ToList();

        var result = new List<CasualSearchDto>();

        foreach (var casual in candidates)
        {
            var inZone = casual.CurrentZoneId == store.ZoneId;
            var available = inZone &&
                            await casuals.IsAvailableAsync(casual.Id, start, end) &&
                            !await bookings.HasAcceptedOverlapAsync(casual.Id, start, end);

            result.Add(new CasualSearchDto(
                casual.Id,
                $"{casual.FirstName} {casual.LastName}",
                casual.City,
                casual.Phone,
                casual.CurrentZoneId,
                casual.CurrentZone?.Name,
                casual.RatingAverage,
                casual.Skills.Select(s => s.Skill?.Name ?? string.Empty).Where(x => x.Length > 0).OrderBy(x => x).ToList(),
                available,
                inZone,
                casual.BaseHourlyRate,
                casual.BaseHourlyRate.HasValue ? ServiceHelpers.EffectiveHourlyRate(casual.BaseHourlyRate.Value, EmployeeType.Casual, start) : null,
                paidHours,
                casual.BaseHourlyRate.HasValue ? decimal.Round(ServiceHelpers.EffectiveHourlyRate(casual.BaseHourlyRate.Value, EmployeeType.Casual, start) * paidHours, 2, MidpointRounding.AwayFromZero) : null));
        }

        return result
            .OrderByDescending(x => x.IsAvailable)
            .ThenByDescending(x => x.Rating)
            .ThenBy(x => x.Name)
            .ToList();
    }

    public async Task<BookingDto> CreateBookingRequestAsync(Guid storeUserId, CreateBookingRequestDto request)
    {
        var (user, store) = await StoreContext(storeUserId);
        var paidHours = ServiceHelpers.PaidHours(request.StartDateTime, request.EndDateTime);

        if (ServiceHelpers.TouchesSunday(request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Sunday bookings are not allowed.");
        if (request.StartDateTime <= DateTime.Now)
            throw new BusinessRuleException("Booking must be in the future.");

        var casual = await casuals.GetByIdAsync(request.CasualProfileId) ?? throw new BusinessRuleException("Casual not found.");

        if (!casual.IsActive ||
            casual.RegistrationStatus != RegistrationStatus.Approved ||
            !await users.IsApprovedAndActiveAsync(casual.UserId))
            throw new BusinessRuleException("Casual is not active and approved.");

        if (casual.CurrentZoneId != store.ZoneId)
            throw new BusinessRuleException("Store can normally book only Casuals assigned to the same zone. Area Manager override is required for cross-zone booking.");

        if (request.RequiredSkillId.HasValue)
        {
            var requiredSkill = await skills.GetByIdAsync(request.RequiredSkillId.Value) ?? throw new BusinessRuleException("Required skill does not exist.");
            if (!casual.Skills.Any(x => x.SkillId == requiredSkill.Id))
                throw new BusinessRuleException($"Casual does not have the required skill: {requiredSkill.Name}.");
        }

        if (!await casuals.IsAvailableAsync(casual.Id, request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Casual is not available for the full requested time.");

        if (await bookings.HasAcceptedOverlapAsync(casual.Id, request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Casual already has an overlapping accepted booking.");

        if (await bookings.HasDuplicateActiveRequestAsync(store.Id, casual.Id, request.StartDateTime, request.EndDateTime))
            throw new BusinessRuleException("Duplicate active booking request exists.");

        var week = ServiceHelpers.GetWeek(request.StartDateTime);
        var weekly = await bookings.GetAcceptedHoursAsync(casual.Id, week.Start, week.End);
        if (weekly + paidHours > BusinessRules.MaximumWeeklyPaidHours)
            throw new BusinessRuleException($"Casual would exceed {BusinessRules.MaximumWeeklyPaidHours} paid hours this week.");

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

        var baseRate = casual.BaseHourlyRate
            ?? throw new BusinessRuleException("No individual pay rate is configured for this Casual. Ask Super Admin to set it.");
        var rate = ServiceHelpers.EffectiveHourlyRate(baseRate, EmployeeType.Casual, request.StartDateTime);

        var isEmergency = request.IsEmergency ||
                          (request.StartDateTime - DateTime.Now).TotalHours <= BusinessRules.EmergencyBookingWindowHours;

        DateTime? expiry = null;
        if ((request.StartDateTime.Date - DateTime.Now.Date).TotalDays >= BusinessRules.AdvanceBookingThresholdDays)
            expiry = DateTime.UtcNow.AddHours(BusinessRules.AdvanceBookingResponseHours);

        var booking = new BookingRequest
        {
            StoreId = store.Id,
            CasualProfileId = casual.Id,
            RequestedByUserId = user.UserId,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            ExpiresAtUtc = expiry,
            HourlyRateSnapshot = rate,
            EstimatedCost = decimal.Round(rate * paidHours, 2, MidpointRounding.AwayFromZero),
            RequiredSkillId = request.RequiredSkillId,
            IsEmergency = isEmergency
        };

        await bookings.AddAsync(booking);
        await bookings.SaveChangesAsync();

        booking.Store = store;
        booking.CasualProfile = casual;
        if (request.RequiredSkillId.HasValue)
            booking.RequiredSkill = await skills.GetByIdAsync(request.RequiredSkillId.Value);

        await notifications.AddAsync(new Notification
        {
            UserId = casual.UserId,
            Type = NotificationType.BookingRequest,
            Title = isEmergency ? "Emergency booking request" : "New booking request",
            Message = $"{store.Name}: {request.StartDateTime:g} - {request.EndDateTime:g}"
        });
        await notifications.SaveChangesAsync();

        return ServiceHelpers.ToDto(booking);
    }

    public async Task<IReadOnlyList<BookingDto>> GetBookingsAsync(Guid storeUserId)
    {
        var (_, store) = await StoreContext(storeUserId);
        await bookings.ExpirePendingAsync(DateTime.UtcNow);
        return (await bookings.GetForStoreAsync(store.Id)).Select(ServiceHelpers.ToDto).ToList();
    }

    public async Task CancelBookingAsync(Guid storeUserId, int bookingId, string reason)
    {
        var (user, store) = await StoreContext(storeUserId);

        if (string.IsNullOrWhiteSpace(reason))
            throw new BusinessRuleException("Cancellation reason is required.");

        var booking = await bookings.GetByIdAsync(bookingId) ?? throw new BusinessRuleException("Booking not found.");
        if (booking.StoreId != store.Id)
            throw new BusinessRuleException("Booking belongs to another store.");
        if (booking.Status is BookingStatus.Cancelled or BookingStatus.Completed or BookingStatus.Expired)
            throw new BusinessRuleException("Booking cannot be cancelled in its current status.");

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAtUtc = DateTime.UtcNow;
        booking.CancelledByUserId = user.UserId;
        booking.CancellationReason = reason.Trim();
        await bookings.SaveChangesAsync();

        await notifications.AddAsync(new Notification
        {
            UserId = booking.CasualProfile!.UserId,
            Type = NotificationType.BookingCancelled,
            Title = "Booking cancelled",
            Message = reason.Trim()
        });
        await notifications.SaveChangesAsync();
    }

    public async Task CompleteBookingAsync(Guid storeUserId, int bookingId)
    {
        var (_, store) = await StoreContext(storeUserId);
        var booking = await bookings.GetByIdAsync(bookingId) ?? throw new BusinessRuleException("Booking not found.");

        if (booking.StoreId != store.Id)
            throw new BusinessRuleException("Booking belongs to another store.");
        if (booking.Status != BookingStatus.Accepted)
            throw new BusinessRuleException("Only accepted bookings can be completed.");
        if (booking.EndDateTime > DateTime.Now)
            throw new BusinessRuleException("A booking cannot be completed before its end time.");

        booking.Status = BookingStatus.Completed;
        booking.CompletedAtUtc = DateTime.UtcNow;
        await bookings.SaveChangesAsync();

        await notifications.AddAsync(new Notification
        {
            UserId = booking.CasualProfile!.UserId,
            Type = NotificationType.General,
            Title = "Booking completed",
            Message = $"{store.Name} marked your booking as completed."
        });
        await notifications.SaveChangesAsync();
    }

    public async Task SetBudgetAsync(Guid storeUserId, SetStoreBudgetRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);
        if (request.Amount < 0) throw new BusinessRuleException("Budget cannot be negative.");
        await budgets.SetAsync(store.Id, request.Date, request.Amount);
    }

    public async Task RateCasualAsync(Guid storeUserId, int bookingId, RateCasualRequest request)
    {
        var (_, store) = await StoreContext(storeUserId);

        if (request.Score < 1 || request.Score > 5)
            throw new BusinessRuleException("Rating must be between 1 and 5.");

        var booking = await bookings.GetByIdAsync(bookingId) ?? throw new BusinessRuleException("Booking not found.");
        if (booking.StoreId != store.Id)
            throw new BusinessRuleException("Booking belongs to another store.");
        if (booking.Status != BookingStatus.Completed)
            throw new BusinessRuleException("Only completed bookings can be rated.");
        if (await ratings.ExistsForBookingAsync(booking.Id))
            throw new BusinessRuleException("Booking has already been rated.");

        await ratings.AddAsync(new Rating
        {
            BookingRequestId = booking.Id,
            StoreId = store.Id,
            CasualProfileId = booking.CasualProfileId,
            Score = request.Score,
            Comment = request.Comment?.Trim()
        });
        await ratings.SaveChangesAsync();

        var casual = await casuals.GetByIdAsync(booking.CasualProfileId) ?? throw new BusinessRuleException("Casual not found.");
        casual.RatingAverage = ((casual.RatingAverage * casual.RatingCount) + request.Score) / (casual.RatingCount + 1);
        casual.RatingCount++;
        await casuals.SaveChangesAsync();
    }

    public async Task<StoreReportDto> GetReportAsync(Guid storeUserId, DateTime from, DateTime to)
    {
        var (_, store) = await StoreContext(storeUserId);
        if (to <= from) throw new BusinessRuleException("Report end must be after report start.");

        var roster = await employees.GetRosterAsync(store.Id, from, to);
        var gaps = await GetStaffingGapsInternal(store.Id, from, to);
        var bookingList = (await bookings.GetForStoreAsync(store.Id))
            .Where(x => x.StartDateTime < to && x.EndDateTime > from)
            .ToList();

        var budgetList = await budgets.GetRangeAsync(
            new[] { store.Id },
            DateOnly.FromDateTime(from),
            DateOnly.FromDateTime(to.AddTicks(-1)));

        var rosterCost = roster.Where(x => !x.IsCancelled).Sum(x => x.EstimatedCost);
        var casualCost = bookingList
            .Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed)
            .Sum(x => x.EstimatedCost);

        var allocated = budgetList.Sum(x => x.Amount);
        var total = rosterCost + casualCost;

        return new StoreReportDto(
            from,
            to,
            roster.Count,
            gaps.Count,
            bookingList.Count,
            bookingList.Count(x => x.Status == BookingStatus.Accepted),
            bookingList.Count(x => x.Status == BookingStatus.Completed),
            bookingList.Count(x => x.Status == BookingStatus.Cancelled),
            rosterCost,
            casualCost,
            total,
            allocated,
            allocated - total);
    }
}
