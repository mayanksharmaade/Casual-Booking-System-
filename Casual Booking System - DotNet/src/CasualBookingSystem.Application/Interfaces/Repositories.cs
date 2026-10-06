using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.Interfaces;

public interface IZoneRepository
{
    Task<IReadOnlyList<Zone>> GetAllAsync();
    Task<Zone?> GetByIdAsync(int id);
    Task<bool> NameExistsAsync(string name);
    Task AddAsync(Zone zone);
    Task SaveChangesAsync();
}

public interface IStoreRepository
{
    Task<IReadOnlyList<Store>> GetAllAsync();
    Task<IReadOnlyList<Store>> GetByZoneIdsAsync(IReadOnlyCollection<int> zoneIds);
    Task<Store?> GetByIdAsync(int id);
    Task<bool> CodeExistsAsync(string code);
    Task AddAsync(Store store);
    Task SaveChangesAsync();
}

public interface IPayRateRepository
{
    Task<IReadOnlyList<PayRate>> GetAllAsync();
    Task<PayRate?> GetCurrentAsync(EmployeeType employeeType, DateTime atUtc);
    Task AddAsync(PayRate rate);
    Task SaveChangesAsync();
}

public interface ICasualRepository
{
    Task<CasualProfile?> GetByIdAsync(int id);
    Task<CasualProfile?> GetByUserIdAsync(Guid userId);
    Task<IReadOnlyList<CasualProfile>> SearchAsync(string? city, string? search);
    Task AddAsync(CasualProfile profile);

    Task AddAvailabilityAsync(CasualAvailability availability);
    Task<CasualAvailability?> GetAvailabilityByIdAsync(int id);
    Task<IReadOnlyList<CasualAvailability>> GetAvailabilityAsync(int casualProfileId, DateTime? from = null, DateTime? to = null);
    Task<bool> IsAvailableAsync(int casualProfileId, DateTime start, DateTime end);
    void RemoveAvailability(CasualAvailability availability);

    Task SaveChangesAsync();
}

public interface IEmployeeRepository
{
    Task<Employee?> GetByIdAsync(int id);
    Task<Employee?> GetByUserIdAsync(Guid userId);
    Task<IReadOnlyList<Employee>> GetByStoreAsync(int storeId);
    Task AddAsync(Employee employee);

    Task AddRosterAsync(EmployeeRosterEntry roster);
    Task<EmployeeRosterEntry?> GetRosterByIdAsync(int id);
    Task AddAbsenceAsync(EmployeeAbsence absence);
    Task<IReadOnlyList<EmployeeRosterEntry>> GetRosterAsync(int storeId, DateTime from, DateTime to);
    Task<IReadOnlyList<EmployeeAbsence>> GetAbsencesAsync(int storeId, DateTime from, DateTime to);
    Task<bool> HasRosterOverlapAsync(int employeeId, DateTime start, DateTime end, int? excludeRosterEntryId = null);
    Task<decimal> GetWeeklyRosterHoursAsync(int employeeId, DateTime weekStart, DateTime weekEnd, int? excludeRosterEntryId = null);

    Task<IReadOnlyList<EmployeeWorkPattern>> GetWorkPatternsAsync(int employeeId);
    Task ReplaceWorkPatternsAsync(int employeeId, IReadOnlyCollection<EmployeeWorkPattern> patterns);
    Task RemoveFutureGeneratedRosterAsync(int employeeId, DateTime from);

    Task SaveChangesAsync();
}

public interface IBookingRepository
{
    Task<BookingRequest?> GetByIdAsync(int id);
    Task<IReadOnlyList<BookingRequest>> GetAllAsync(DateTime? from = null, DateTime? to = null);
    Task<IReadOnlyList<BookingRequest>> GetForStoreAsync(int storeId);
    Task<IReadOnlyList<BookingRequest>> GetForStoresAsync(IReadOnlyCollection<int> storeIds);
    Task<IReadOnlyList<BookingRequest>> GetForCasualAsync(int casualProfileId);

    Task AddAsync(BookingRequest booking);
    Task<bool> HasAcceptedOverlapAsync(int casualProfileId, DateTime start, DateTime end, int? excludeBookingId = null);
    Task<bool> HasDuplicateActiveRequestAsync(int storeId, int casualProfileId, DateTime start, DateTime end);
    Task<decimal> GetAcceptedHoursAsync(int casualProfileId, DateTime weekStart, DateTime weekEnd, int? excludeBookingId = null);
    Task<int> ExpirePendingAsync(DateTime utcNow);

    Task SaveChangesAsync();
}

public interface IStoreBudgetRepository
{
    Task<StoreBudget?> GetAsync(int storeId, DateOnly date);
    Task<IReadOnlyList<StoreBudget>> GetRangeAsync(IReadOnlyCollection<int> storeIds, DateOnly from, DateOnly to);
    Task SetAsync(int storeId, DateOnly date, decimal amount);
}

public interface INotificationRepository
{
    Task AddAsync(Notification notification);
    Task<IReadOnlyList<Notification>> GetForUserAsync(Guid userId);
    Task<int> CountUnreadAsync(Guid userId);
    Task<Notification?> GetByIdAsync(int id);
    Task SaveChangesAsync();
}

public interface IAuditRepository
{
    Task AddAsync(AuditLog log);
    Task<IReadOnlyList<AuditLog>> GetRecentAsync(int take);
    Task SaveChangesAsync();
}

public interface IRatingRepository
{
    Task AddAsync(Rating rating);
    Task<bool> ExistsForBookingAsync(int bookingId);
    Task SaveChangesAsync();
}

public interface ISkillRepository
{
    Task<IReadOnlyList<Skill>> GetAllAsync();
    Task<Skill?> GetByIdAsync(int id);
    Task SetCasualSkillsAsync(int casualProfileId, IReadOnlyList<int> skillIds);
}

public interface IAreaManagerRepository
{
    Task<IReadOnlyList<AreaManagerZoneAssignment>> GetAssignmentsAsync(Guid areaManagerUserId);
    Task SetAssignmentsAsync(Guid areaManagerUserId, IReadOnlyCollection<int> zoneIds);

    Task AddTransferAsync(CasualZoneTransfer transfer);
    Task<IReadOnlyList<CasualZoneTransfer>> GetTransfersAsync(IReadOnlyCollection<int> zoneIds, int take = 100);

    Task SaveChangesAsync();
}

public interface IPublicHolidayRepository
{
    Task<IReadOnlyList<PublicHoliday>> GetAllAsync();
    Task<PublicHoliday?> GetByDateAsync(DateOnly date);
    Task<bool> ExistsAsync(DateOnly date);
    Task AddAsync(PublicHoliday holiday);
    Task SaveChangesAsync();
}
