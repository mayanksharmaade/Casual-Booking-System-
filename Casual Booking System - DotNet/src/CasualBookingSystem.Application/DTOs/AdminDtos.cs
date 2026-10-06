using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.DTOs;

public record AdminDashboardDto(
    int Stores,
    int PendingStores,
    int Casuals,
    int PendingCasuals,
    int AreaManagers,
    int Zones,
    int ActiveUsers,
    int PendingRegistrations,
    int ActiveBookings,
    int StaffingAlerts);

public record ZoneDto(int Id, string Name, bool IsActive);
public record CreateZoneRequest(string Name);

public record PayRateDto(
    string WorkerKind,
    int WorkerId,
    string WorkerName,
    string WorkerType,
    string? StoreName,
    decimal? BaseHourlyRate,
    decimal CasualLoadingPercent,
    decimal SaturdayLoadingPercent);

public record SetPayRateRequest(string WorkerKind, int WorkerId, decimal BaseHourlyRate);

public record RegistrationDto(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    RegistrationStatus Status,
    int? StoreId,
    string? StoreName,
    string? Phone,
    string? City,
    int? ZoneId,
    string? ZoneName,
    IReadOnlyList<string> Skills,
    string? StoreCode,
    string? StoreAddress);
public record StoreAdminDto(int Id, string Code, string Name, string City, string ZoneName, RegistrationStatus RegistrationStatus, bool IsActive);

public record AreaManagerAdminDto(Guid UserId, string Email, string Name, RegistrationStatus ApprovalStatus, bool IsActive, IReadOnlyList<ZoneDto> Zones);
public record AssignAreaManagerZonesRequest(IReadOnlyList<int> ZoneIds);

public record PublicHolidayDto(int Id, DateOnly HolidayDate, string Name, bool IsActive);
public record CreatePublicHolidayRequest(DateOnly HolidayDate, string Name);

public record AuditLogDto(int Id, Guid? UserId, string Action, string EntityName, string? EntityId, string? Details, DateTime CreatedAtUtc);

public record SystemReportDto(
    DateTime From,
    DateTime To,
    int TotalBookings,
    int AcceptedBookings,
    int CompletedBookings,
    int CancelledBookings,
    int ExpiredBookings,
    decimal EstimatedCasualLabourCost,
    int ActiveStores,
    int ActiveCasuals,
    int StaffingGapEvents,
    int ManagerOverrides);
