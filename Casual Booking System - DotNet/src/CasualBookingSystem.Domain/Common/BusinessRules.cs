namespace CasualBookingSystem.Domain.Common;

public static class BusinessRules
{
    public const decimal MaximumWeeklyPaidHours = 37.5m;
    public const decimal MaximumDailyPaidHours = 8m;
    public const decimal MaximumScheduledShiftHours = 8m;
    public const decimal MealBreakThresholdHours = 5m;
    public const decimal UnpaidMealBreakHours = 0.5m;
    public const decimal CasualLoadingPercent = 25m;
    public const decimal SaturdayLoadingPercent = 25m;
    public const int MinimumRestHoursBetweenPaidShifts = 8;
    public const int MaximumConsecutivePaidDays = 6;

    public const int AdvanceBookingThresholdDays = 14;
    public const int AdvanceBookingResponseHours = 24;
    public const int CasualCancellationNoticeHours = 4;
    public const int EmergencyBookingWindowHours = 24;

    public const string RuleWeeklyHours = "WEEKLY_HOURS";
    public const string RuleDailyHours = "DAILY_HOURS";
    public const string RuleRestPeriod = "REST_PERIOD";
    public const string RuleConsecutiveDays = "CONSECUTIVE_DAYS";
    public const string RuleSkill = "SKILL";
    public const string RuleZone = "ZONE";
}
