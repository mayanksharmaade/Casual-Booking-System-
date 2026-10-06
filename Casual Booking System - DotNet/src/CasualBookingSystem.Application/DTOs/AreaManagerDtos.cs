namespace CasualBookingSystem.Application.DTOs;

public record AreaManagerDashboardDto(
    int AssignedZones,
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
    string Name,
    string City,
    int CurrentZoneId,
    string CurrentZoneName,
    decimal Rating,
    IReadOnlyList<string> Skills,
    bool IsAvailable);

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
