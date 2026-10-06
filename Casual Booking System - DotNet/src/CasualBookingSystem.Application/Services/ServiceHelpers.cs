using CasualBookingSystem.Application.Common;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Entities;

namespace CasualBookingSystem.Application.Services;

internal static class ServiceHelpers
{
    public static (DateTime Start, DateTime End) GetWeek(DateTime value)
    {
        var date = value.Date;
        var diff = ((int)date.DayOfWeek + 6) % 7;
        var start = date.AddDays(-diff);
        return (start, start.AddDays(7));
    }

    public static decimal Hours(DateTime start, DateTime end)
    {
        if (end <= start) throw new BusinessRuleException("End time must be after start time.");
        return (decimal)(end - start).TotalHours;
    }

    public static decimal PaidHours(DateTime start, DateTime end)
    {
        var scheduled = Hours(start, end);
        if (scheduled > BusinessRules.MaximumScheduledShiftHours)
            throw new BusinessRuleException($"A shift cannot exceed {BusinessRules.MaximumScheduledShiftHours} scheduled hours.");
        return scheduled > BusinessRules.MealBreakThresholdHours
            ? scheduled - BusinessRules.UnpaidMealBreakHours
            : scheduled;
    }

    public static decimal EffectiveHourlyRate(decimal baseRate, CasualBookingSystem.Domain.Enums.EmployeeType employeeType, DateTime shiftStart)
    {
        var rate = baseRate;
        if (employeeType == CasualBookingSystem.Domain.Enums.EmployeeType.Casual)
            rate *= 1m + (BusinessRules.CasualLoadingPercent / 100m);
        if (shiftStart.DayOfWeek == DayOfWeek.Saturday)
            rate *= 1m + (BusinessRules.SaturdayLoadingPercent / 100m);
        return decimal.Round(rate, 2, MidpointRounding.AwayFromZero);
    }

    public static bool TouchesSunday(DateTime start, DateTime end)
    {
        Hours(start, end);
        var date = start.Date;
        var lastDate = end.AddTicks(-1).Date;
        while (date <= lastDate)
        {
            if (date.DayOfWeek == DayOfWeek.Sunday) return true;
            date = date.AddDays(1);
        }
        return false;
    }

    public static void ValidateAdvancedPaidSchedule(
        DateTime start,
        DateTime end,
        IEnumerable<(DateTime Start, DateTime End)> existing,
        string workerLabel)
    {
        var scheduledHours = Hours(start, end);
        if (scheduledHours > BusinessRules.MaximumScheduledShiftHours)
            throw new BusinessRuleException($"{workerLabel} cannot be scheduled for more than {BusinessRules.MaximumScheduledShiftHours} hours in a single shift.");
        var hours = PaidHours(start, end);
        if (hours > BusinessRules.MaximumDailyPaidHours)
            throw new BusinessRuleException($"{workerLabel} cannot be scheduled for more than {BusinessRules.MaximumDailyPaidHours} paid hours in a single shift.");

        var existingList = existing.ToList();

        var sameDayHours = existingList
            .Where(x => x.Start.Date == start.Date)
            .Sum(x => PaidHours(x.Start, x.End));

        if (sameDayHours + hours > BusinessRules.MaximumDailyPaidHours)
            throw new BusinessRuleException($"{workerLabel} would exceed {BusinessRules.MaximumDailyPaidHours} paid hours on {start:dd MMM yyyy}.");

        foreach (var x in existingList)
        {
            if (x.End <= start)
            {
                var rest = start - x.End;
                if (rest.TotalHours < BusinessRules.MinimumRestHoursBetweenPaidShifts)
                    throw new BusinessRuleException($"{workerLabel} requires at least {BusinessRules.MinimumRestHoursBetweenPaidShifts} hours rest between paid shifts.");
            }
            else if (end <= x.Start)
            {
                var rest = x.Start - end;
                if (rest.TotalHours < BusinessRules.MinimumRestHoursBetweenPaidShifts)
                    throw new BusinessRuleException($"{workerLabel} requires at least {BusinessRules.MinimumRestHoursBetweenPaidShifts} hours rest between paid shifts.");
            }
        }

        var dates = existingList.Select(x => x.Start.Date).Append(start.Date).Distinct().OrderBy(x => x).ToList();
        var streak = 1;
        for (var i = 1; i < dates.Count; i++)
        {
            streak = dates[i] == dates[i - 1].AddDays(1) ? streak + 1 : 1;
            if (streak > BusinessRules.MaximumConsecutivePaidDays)
                throw new BusinessRuleException($"{workerLabel} cannot be scheduled for more than {BusinessRules.MaximumConsecutivePaidDays} consecutive paid days.");
        }
    }

    public static BookingDto ToDto(BookingRequest b) => new(
        b.Id,
        b.StoreId,
        b.Store?.Name ?? string.Empty,
        b.CasualProfileId,
        b.CasualProfile is null ? string.Empty : $"{b.CasualProfile.FirstName} {b.CasualProfile.LastName}",
        b.StartDateTime,
        b.EndDateTime,
        b.Status,
        b.ExpiresAtUtc,
        b.EstimatedCost,
        b.CancellationReason,
        b.DeclineReason,
        b.RequiredSkillId,
        b.RequiredSkill?.Name,
        b.IsEmergency,
        b.OverrideApprovedByUserId.HasValue,
        b.OverrideReason);
}
