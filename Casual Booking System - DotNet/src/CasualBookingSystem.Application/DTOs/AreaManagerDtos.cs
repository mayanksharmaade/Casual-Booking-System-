namespace CasualBookingSystem.Application.DTOs;

public record AreaManagerDashboardDto(
    int ZoneId,
    string ZoneName,
    string ZoneCity,
    DateOnly PeriodFrom,
    DateOnly PeriodTo,
    int Stores,
    int StaffingGaps,
    int PendingBookings,
    int AcceptedBookings,
    int AvailableCasuals,
    int OverBudgetStores,
    decimal TotalScheduledLabourCost);

public record AreaStoreSummaryDto(
    int StoreId,
    string StoreCode,
    string StoreName,
    string City,
    int ZoneId,
    string ZoneName,
    int StaffingGaps,
    int PendingBookings,
    int AcceptedBookings,
    decimal DailyBudget,
    decimal ScheduledLabourCost,
    decimal BudgetVariance,
    string BudgetStatus);

public record AreaCasualDto(
    int CasualProfileId,
    string? EmployeeId,
    string Name,
    string City,
    string Phone,
    int CurrentZoneId,
    string CurrentZoneName,
    decimal Rating,
    IReadOnlyList<string> Skills,
    bool IsAvailable,
    bool ActiveRequestExists,
    decimal? BaseHourlyRate,
    decimal? EffectiveHourlyRate,
    decimal PaidHours,
    decimal? EstimatedCost);

public record AreaStoreOptionDto(int StoreId, string StoreCode, string StoreName);
public record AreaCasualSearchFiltersDto(
    string City,
    int ManagedZoneId,
    string ManagedZoneName,
    IReadOnlyList<ZoneDto> Zones,
    IReadOnlyList<AreaStoreOptionDto> Stores,
    IReadOnlyList<SkillDto> Skills);

public record AreaTransferCandidateDto(
    int CasualProfileId,
    string? EmployeeId,
    string Name,
    string City,
    int CurrentZoneId,
    string CurrentZoneName,
    decimal Rating,
    IReadOnlyList<string> Skills);

public record AreaWorkforceAbsenceDto(
    int AbsenceId,
    int StoreId,
    string StoreCode,
    string StoreName,
    int EmployeeId,
    string EmployeeCode,
    string EmployeeName,
    string EmployeeType,
    string AbsenceType,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string? Reason);

public record TransferCasualRequest(int CasualProfileId, int ToZoneId, string Reason);
public record CasualTransferDto(int Id, int CasualProfileId, string CasualName, int? FromZoneId, string? FromZoneName, int ToZoneId, string ToZoneName, string Reason, DateTime TransferredAtUtc);

public record AreaOverrideBookingRequest(
    int StoreId,
    int CasualProfileId,
    DateTime StartDateTime,
    DateTime EndDateTime,
    int? RequiredSkillId,
    string OverrideReason);

public record AreaReportDto(
    DateTime From,
    DateTime To,
    int Stores,
    int StaffingGapEvents,
    int BookingRequests,
    int AcceptedBookings,
    int CompletedBookings,
    int CancelledBookings,
    int ManagerOverrides,
    decimal EstimatedLabourCost);
