using CasualBookingSystem.Application.DTOs;

namespace CasualBookingSystem.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task RegisterCasualAsync(RegisterCasualRequest request);
    Task RegisterAreaManagerAsync(RegisterAreaManagerRequest request);
    Task RegisterStoreAsync(RegisterStoreRequest request);
}

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync();
    Task<IReadOnlyList<RegistrationDto>> GetPendingRegistrationsAsync();
    Task<IReadOnlyList<UserAccountDto>> GetUsersAsync();
    Task<IReadOnlyList<StoreAdminDto>> GetStoresAsync();
    Task ApproveAsync(Guid adminUserId, Guid userId);
    Task RejectAsync(Guid adminUserId, Guid userId);
    Task SetActiveAsync(Guid adminUserId, Guid userId, bool isActive);
    Task SetStoreActiveAsync(Guid adminUserId, int storeId, bool isActive);

    Task<IReadOnlyList<ZoneDto>> GetZonesAsync();
    Task<ZoneDto> CreateZoneAsync(Guid adminUserId, CreateZoneRequest request);
    Task SetZoneActiveAsync(Guid adminUserId, int zoneId, bool isActive);

    Task<IReadOnlyList<PayRateDto>> GetPayRatesAsync();
    Task<PayRateDto> SetPayRateAsync(Guid adminUserId, SetPayRateRequest request);

    Task<IReadOnlyList<AreaManagerAdminDto>> GetAreaManagersAsync();
    Task AssignAreaManagerZonesAsync(Guid adminUserId, Guid areaManagerUserId, AssignAreaManagerZonesRequest request);

    Task<IReadOnlyList<PublicHolidayDto>> GetPublicHolidaysAsync();
    Task<PublicHolidayDto> CreatePublicHolidayAsync(Guid adminUserId, CreatePublicHolidayRequest request);

    Task<IReadOnlyList<AuditLogDto>> GetRecentAuditAsync(int take = 100);
    Task<SystemReportDto> GetSystemReportAsync(DateTime from, DateTime to);
}

public interface IStoreService
{
    Task<StoreDashboardDto> GetDashboardAsync(Guid storeUserId, DateOnly date);
    Task<IReadOnlyList<EmployeeDto>> GetEmployeesAsync(Guid storeUserId);
    Task<EmployeeDto> CreateEmployeeAsync(Guid storeUserId, CreateEmployeeRequest request);
    Task CreateAssistantManagerAsync(Guid storeUserId, CreateAssistantManagerRequest request);

    Task<IReadOnlyList<RosterEntryDto>> GetRosterAsync(Guid storeUserId, DateTime from, DateTime to);
    Task<RosterEntryDto> CreateRosterAsync(Guid storeUserId, CreateRosterEntryRequest request);
    Task<IReadOnlyList<RosterEntryDto>> CreateRosterRangeAsync(Guid storeUserId, CreateRosterRangeRequest request);
    Task<RosterEntryDto> UpdateRosterAsync(Guid storeUserId, int rosterEntryId, UpdateRosterEntryRequest request);

    Task<IReadOnlyList<EmployeeWorkPatternDto>> GetWorkPatternAsync(Guid storeUserId, int employeeId);
    Task<IReadOnlyList<EmployeeWorkPatternDto>> SetWorkPatternAsync(Guid storeUserId, int employeeId, SetEmployeeWorkPatternRequest request);

    Task<AbsenceDto> RecordAbsenceAsync(Guid storeUserId, CreateAbsenceRequest request);
    Task<IReadOnlyList<StaffingGapDto>> GetStaffingGapsAsync(Guid storeUserId, DateTime from, DateTime to);

    Task<CasualSearchFiltersDto> GetCasualSearchFiltersAsync(Guid storeUserId);
    Task<IReadOnlyList<CasualSearchDto>> SearchCasualsAsync(Guid storeUserId, string? city, string? search, DateTime start, DateTime end, int? zoneId = null, IReadOnlyList<int>? skillIds = null);
    Task<BookingDto> CreateBookingRequestAsync(Guid storeUserId, CreateBookingRequestDto request);
    Task<IReadOnlyList<BookingDto>> GetBookingsAsync(Guid storeUserId);
    Task CancelBookingAsync(Guid storeUserId, int bookingId, string reason);
    Task CompleteBookingAsync(Guid storeUserId, int bookingId);
    Task RateCasualAsync(Guid storeUserId, int bookingId, RateCasualRequest request);

    Task SetBudgetAsync(Guid storeUserId, SetStoreBudgetRequest request);
    Task<StoreReportDto> GetReportAsync(Guid storeUserId, DateTime from, DateTime to);
}

public interface ICasualService
{
    Task<CasualDashboardDto> GetDashboardAsync(Guid userId);
    Task<CasualProfileDto> GetProfileAsync(Guid userId);
    Task<CasualProfileDto> UpdateProfileAsync(Guid userId, UpdateCasualProfileRequest request);

    Task<IReadOnlyList<SkillDto>> GetSkillsAsync(Guid userId);
    Task SetSkillsAsync(Guid userId, SetCasualSkillsRequest request);

    Task<IReadOnlyList<AvailabilityDto>> GetAvailabilityAsync(Guid userId);
    Task<AvailabilityDto> AddAvailabilityAsync(Guid userId, AddAvailabilityRequest request);
    Task DeleteAvailabilityAsync(Guid userId, int availabilityId);

    Task<IReadOnlyList<BookingDto>> GetBookingsAsync(Guid userId);
    Task AcceptBookingAsync(Guid userId, int bookingId);
    Task DeclineBookingAsync(Guid userId, int bookingId, DeclineBookingRequest request);
    Task CancelBookingAsync(Guid userId, int bookingId, CancelBookingRequest request);

    Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(Guid userId);
    Task MarkNotificationReadAsync(Guid userId, int notificationId);

    Task<CasualReportDto> GetReportAsync(Guid userId, DateTime from, DateTime to);
}

public interface IAreaManagerService
{
    Task<AreaManagerDashboardDto> GetDashboardAsync(Guid userId, DateOnly date);
    Task<IReadOnlyList<AreaStoreSummaryDto>> GetStoresAsync(Guid userId, DateOnly date);
    Task<IReadOnlyList<StaffingGapDto>> GetStaffingGapsAsync(Guid userId, DateTime from, DateTime to);
    Task<IReadOnlyList<AreaCasualDto>> SearchCasualsAsync(Guid userId, string? city, string? search, DateTime start, DateTime end);
    Task<IReadOnlyList<BookingDto>> GetBookingsAsync(Guid userId);

    Task<CasualTransferDto> TransferCasualAsync(Guid userId, TransferCasualRequest request);
    Task<IReadOnlyList<CasualTransferDto>> GetTransfersAsync(Guid userId);

    Task CancelBookingAsync(Guid userId, int bookingId, string reason);
    Task<BookingDto> CreateOverrideBookingAsync(Guid userId, AreaOverrideBookingRequest request);

    Task<AreaReportDto> GetReportAsync(Guid userId, DateTime from, DateTime to);
}
