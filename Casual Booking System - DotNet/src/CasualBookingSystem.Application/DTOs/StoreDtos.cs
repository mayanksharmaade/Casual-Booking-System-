using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.DTOs;

public record StoreDashboardDto(
    // Total people actually working today:
    // Manager + Assistant Manager + FT + PT + Volunteer + accepted Casuals
    int TodayRostered,

    // Today's staffing breakdown
    int StoreManagersToday,
    int AssistantManagersToday,
    int FullTimeToday,
    int PartTimeToday,
    int VolunteersToday,
    int CasualsToday,

    int PendingBookings,
    int AcceptedUpcoming,

    // Today's actual coverage gaps
    int StaffingGaps,

    decimal DailyBudget,
    decimal ScheduledLabourCost,
    decimal BudgetVariance,
    string BudgetStatus,

    bool IsPublicHoliday,
    string? PublicHolidayName,

    int CancellationsLast30Days,

    IReadOnlyList<DailyLabourItemDto> LabourItems,

    // Dashboard absence window
    // We will use today -> next 14 days
    DateOnly AbsenceRangeFrom,
    DateOnly AbsenceRangeTo,

    IReadOnlyList<DashboardAbsenceDto> Absences
);

public record DashboardAbsenceDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    EmployeeType EmployeeType,
    AbsenceType AbsenceType,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string? Reason
);

public record DailyLabourItemDto(
    string WorkerName,
    string WorkerType,
    decimal ScheduledHours,
    decimal UnpaidBreakHours,
    decimal PaidHours,
    decimal BaseHourlyRate,
    decimal CasualLoadingPercent,
    decimal SaturdayLoadingPercent,
    decimal EffectiveHourlyRate,
    decimal Cost
);

public record EmployeeDto(
    int Id,
    string FirstName,
    string LastName,
    EmployeeType EmployeeType,
    string? Phone,
    string? SkillSummary,
    decimal? BaseHourlyRate,
    bool IsActive
);

public record CreateEmployeeRequest(
    string FirstName,
    string LastName,
    EmployeeType EmployeeType,
    string? Phone,
    string? SkillSummary
);

public record RosterEntryDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    EmployeeType EmployeeType,
    DateTime StartDateTime,
    DateTime EndDateTime,
    decimal EstimatedCost,
    bool IsCancelled,
    bool IsGeneratedFromPattern
);

public record CreateRosterEntryRequest(
    int EmployeeId,
    DateTime StartDateTime,
    DateTime EndDateTime
);

public record CreateRosterRangeRequest(
    int EmployeeId,
    DateOnly FromDate,
    DateOnly ToDate,
    string StartTime,
    string EndTime
);

public record UpdateRosterEntryRequest(
    DateTime StartDateTime,
    DateTime EndDateTime
);

public record EmployeeWorkPatternDto(
    int Id,
    int EmployeeId,
    int DayOfWeek,
    string DayName,
    string StartTime,
    string EndTime,
    decimal ScheduledHours,
    decimal PaidHours
);

public record WorkPatternDayRequest(
    int DayOfWeek,
    string StartTime,
    string EndTime
);

public record SetEmployeeWorkPatternRequest(
    IReadOnlyList<WorkPatternDayRequest> Days
);

public record AbsenceDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    AbsenceType AbsenceType,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string? Reason
);

public record CreateAbsenceRequest(
    int EmployeeId,
    AbsenceType AbsenceType,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string? Reason
);

public record StaffingGapDto(
    int RosterEntryId,
    int EmployeeId,
    string EmployeeName,
    EmployeeType EmployeeType,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string Reason
);

public record CasualSearchDto(
    int CasualProfileId,
    string Name,
    string City,
    string Phone,
    int? ZoneId,
    string? ZoneName,
    decimal Rating,
    IReadOnlyList<string> Skills,
    bool IsAvailable,
    bool IsInStoreZone,
    decimal? BaseHourlyRate,
    decimal? EffectiveHourlyRate,
    decimal PaidHours,
    decimal? EstimatedCost
);

public record CasualSearchFiltersDto(
    IReadOnlyList<string> Cities,
    IReadOnlyList<ZoneDto> Zones,
    IReadOnlyList<SkillDto> Skills
);

public record CreateBookingRequestDto(
    int CasualProfileId,
    DateTime StartDateTime,
    DateTime EndDateTime,
    int? RequiredSkillId = null,
    bool IsEmergency = false
);

public record StoreBudgetDto(
    DateOnly Date,
    decimal Amount
);

public record SetStoreBudgetRequest(
    DateOnly Date,
    decimal Amount
);

public record BookingDto(
    int Id,
    int StoreId,
    string StoreName,
    int CasualProfileId,
    string CasualName,
    DateTime StartDateTime,
    DateTime EndDateTime,
    BookingStatus Status,
    DateTime? ExpiresAtUtc,
    decimal EstimatedCost,
    string? CancellationReason,
    string? DeclineReason,
    int? RequiredSkillId,
    string? RequiredSkillName,
    bool IsEmergency,
    bool HasManagerOverride,
    string? OverrideReason
);

public record RateCasualRequest(
    int Score,
    string? Comment
);

public record CreateAssistantManagerRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName
);

public record StoreReportDto(
    DateTime From,
    DateTime To,
    int RosteredEntries,
    int StaffingGaps,
    int BookingRequests,
    int AcceptedBookings,
    int CompletedBookings,
    int CancelledBookings,
    decimal RosterLabourCost,
    decimal CasualLabourCost,
    decimal TotalLabourCost,
    decimal BudgetAllocated,
    decimal BudgetVariance
);