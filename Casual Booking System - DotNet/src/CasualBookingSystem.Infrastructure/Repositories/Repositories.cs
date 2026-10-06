using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Domain.Enums;
using CasualBookingSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CasualBookingSystem.Infrastructure.Repositories;

public class ZoneRepository(ApplicationDbContext db) : IZoneRepository
{
    public async Task<IReadOnlyList<Zone>> GetAllAsync() =>
        await db.Zones.AsNoTracking().OrderBy(x => x.Name).ToListAsync();

    public Task<Zone?> GetByIdAsync(int id) =>
        db.Zones.FirstOrDefaultAsync(x => x.Id == id);

    public Task<bool> NameExistsAsync(string name) =>
        db.Zones.AnyAsync(x => x.Name == name);

    public Task AddAsync(Zone zone) =>
        db.Zones.AddAsync(zone).AsTask();

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class StoreRepository(ApplicationDbContext db) : IStoreRepository
{
    public async Task<IReadOnlyList<Store>> GetAllAsync() =>
        await db.Stores
            .Include(x => x.Zone)
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync();

    public async Task<IReadOnlyList<Store>> GetByZoneIdsAsync(IReadOnlyCollection<int> zoneIds) =>
        await db.Stores
            .Include(x => x.Zone)
            .AsNoTracking()
            .Where(x => zoneIds.Contains(x.ZoneId) &&
                        x.IsActive &&
                        x.RegistrationStatus == RegistrationStatus.Approved)
            .OrderBy(x => x.Name)
            .ToListAsync();

    public Task<Store?> GetByIdAsync(int id) =>
        db.Stores.Include(x => x.Zone).FirstOrDefaultAsync(x => x.Id == id);

    public Task<bool> CodeExistsAsync(string code) =>
        db.Stores.AnyAsync(x => x.Code == code);

    public Task AddAsync(Store store) =>
        db.Stores.AddAsync(store).AsTask();

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class PayRateRepository(ApplicationDbContext db) : IPayRateRepository
{
    public async Task<IReadOnlyList<PayRate>> GetAllAsync() =>
        await db.PayRates.AsNoTracking()
            .OrderBy(x => x.EmployeeType)
            .ThenByDescending(x => x.EffectiveFromUtc)
            .ToListAsync();

    public Task<PayRate?> GetCurrentAsync(EmployeeType type, DateTime atUtc) =>
        db.PayRates
            .Where(x => x.EmployeeType == type &&
                        x.EffectiveFromUtc <= atUtc &&
                        (!x.EffectiveToUtc.HasValue || x.EffectiveToUtc > atUtc))
            .OrderByDescending(x => x.EffectiveFromUtc)
            .FirstOrDefaultAsync();

    public Task AddAsync(PayRate rate) => db.PayRates.AddAsync(rate).AsTask();
    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class CasualRepository(ApplicationDbContext db) : ICasualRepository
{
    public Task<CasualProfile?> GetByIdAsync(int id) =>
        db.CasualProfiles
            .Include(x => x.CurrentZone)
            .Include(x => x.Skills).ThenInclude(x => x.Skill)
            .FirstOrDefaultAsync(x => x.Id == id);

    public Task<CasualProfile?> GetByUserIdAsync(Guid userId) =>
        db.CasualProfiles
            .Include(x => x.CurrentZone)
            .Include(x => x.Skills).ThenInclude(x => x.Skill)
            .FirstOrDefaultAsync(x => x.UserId == userId);

    public async Task<IReadOnlyList<CasualProfile>> SearchAsync(string? city, string? search)
    {
        var query = db.CasualProfiles
            .Include(x => x.CurrentZone)
            .Include(x => x.Skills).ThenInclude(x => x.Skill)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(x => x.City.Contains(city));

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(x =>
                (x.FirstName + " " + x.LastName).Contains(search) ||
                x.Phone.Contains(search));

        return await query.AsNoTracking()
            .OrderBy(x => x.FirstName)
            .Take(200)
            .ToListAsync();
    }

    public Task AddAsync(CasualProfile profile) =>
        db.CasualProfiles.AddAsync(profile).AsTask();

    public Task AddAvailabilityAsync(CasualAvailability availability) =>
        db.CasualAvailabilities.AddAsync(availability).AsTask();

    public Task<CasualAvailability?> GetAvailabilityByIdAsync(int id) =>
        db.CasualAvailabilities.FirstOrDefaultAsync(x => x.Id == id);

    public async Task<IReadOnlyList<CasualAvailability>> GetAvailabilityAsync(
        int id,
        DateTime? from = null,
        DateTime? to = null)
    {
        var query = db.CasualAvailabilities.Where(x => x.CasualProfileId == id);

        if (from.HasValue) query = query.Where(x => x.EndDateTime >= from.Value);
        if (to.HasValue) query = query.Where(x => x.StartDateTime <= to.Value);

        return await query.AsNoTracking()
            .OrderBy(x => x.StartDateTime)
            .ToListAsync();
    }

    public Task<bool> IsAvailableAsync(int id, DateTime start, DateTime end) =>
        db.CasualAvailabilities.AnyAsync(x =>
            x.CasualProfileId == id &&
            x.StartDateTime <= start &&
            x.EndDateTime >= end);

    public void RemoveAvailability(CasualAvailability availability) =>
        db.CasualAvailabilities.Remove(availability);

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class EmployeeRepository(ApplicationDbContext db) : IEmployeeRepository
{
    public Task<Employee?> GetByIdAsync(int id) =>
        db.Employees.FirstOrDefaultAsync(x => x.Id == id);

    public Task<Employee?> GetByUserIdAsync(Guid userId) =>
        db.Employees.FirstOrDefaultAsync(x => x.UserId == userId);

    public async Task<IReadOnlyList<Employee>> GetByStoreAsync(int storeId) =>
        await db.Employees.AsNoTracking()
            .Where(x => x.StoreId == storeId)
            .OrderBy(x => x.FirstName)
            .ToListAsync();

    public Task AddAsync(Employee employee) =>
        db.Employees.AddAsync(employee).AsTask();

    public Task AddRosterAsync(EmployeeRosterEntry roster) =>
        db.EmployeeRosterEntries.AddAsync(roster).AsTask();

    public Task<EmployeeRosterEntry?> GetRosterByIdAsync(int id) =>
        db.EmployeeRosterEntries
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id);

    public Task AddAbsenceAsync(EmployeeAbsence absence) =>
        db.EmployeeAbsences.AddAsync(absence).AsTask();

    public async Task<IReadOnlyList<EmployeeRosterEntry>> GetRosterAsync(int storeId, DateTime from, DateTime to) =>
        await db.EmployeeRosterEntries
            .Include(x => x.Employee)
            .Where(x => x.StoreId == storeId && x.StartDateTime < to && x.EndDateTime > from)
            .OrderBy(x => x.StartDateTime)
            .ToListAsync();

    public async Task<IReadOnlyList<EmployeeAbsence>> GetAbsencesAsync(int storeId, DateTime from, DateTime to) =>
        await db.EmployeeAbsences
            .Include(x => x.Employee)
            .Where(x => x.StoreId == storeId && x.StartDateTime < to && x.EndDateTime > from)
            .OrderBy(x => x.StartDateTime)
            .ToListAsync();

    public Task<bool> HasRosterOverlapAsync(int employeeId, DateTime start, DateTime end, int? excludeRosterEntryId = null) =>
        db.EmployeeRosterEntries.AnyAsync(x =>
            x.EmployeeId == employeeId &&
            !x.IsCancelled &&
            (!excludeRosterEntryId.HasValue || x.Id != excludeRosterEntryId.Value) &&
            x.StartDateTime < end &&
            x.EndDateTime > start);

    public async Task<decimal> GetWeeklyRosterHoursAsync(int employeeId, DateTime start, DateTime end, int? excludeRosterEntryId = null)
    {
        var minutes = await db.EmployeeRosterEntries
            .Where(x => x.EmployeeId == employeeId &&
                        !x.IsCancelled &&
                        (!excludeRosterEntryId.HasValue || x.Id != excludeRosterEntryId.Value) &&
                        x.StartDateTime >= start &&
                        x.StartDateTime < end)
            .Select(x => EF.Functions.DateDiffMinute(x.StartDateTime, x.EndDateTime))
            .ToListAsync();

        return minutes.Sum(m => m > 300 ? (m - 30) / 60m : m / 60m);
    }

    public async Task<IReadOnlyList<EmployeeWorkPattern>> GetWorkPatternsAsync(int employeeId) =>
        await db.EmployeeWorkPatterns
            .AsNoTracking()
            .Where(x => x.EmployeeId == employeeId && x.IsActive)
            .OrderBy(x => x.DayOfWeek)
            .ToListAsync();

    public async Task ReplaceWorkPatternsAsync(int employeeId, IReadOnlyCollection<EmployeeWorkPattern> patterns)
    {
        var existing = await db.EmployeeWorkPatterns
            .Where(x => x.EmployeeId == employeeId)
            .ToListAsync();

        db.EmployeeWorkPatterns.RemoveRange(existing);
        await db.EmployeeWorkPatterns.AddRangeAsync(patterns);
    }

    public async Task RemoveFutureGeneratedRosterAsync(int employeeId, DateTime from)
    {
        var rows = await db.EmployeeRosterEntries
            .Where(x => x.EmployeeId == employeeId &&
                        x.IsGeneratedFromPattern &&
                        x.StartDateTime >= from)
            .ToListAsync();

        db.EmployeeRosterEntries.RemoveRange(rows);
    }

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class BookingRepository(ApplicationDbContext db) : IBookingRepository
{
    private IQueryable<BookingRequest> Query() =>
        db.BookingRequests
            .Include(x => x.Store)
            .Include(x => x.CasualProfile)
            .Include(x => x.RequiredSkill);

    public Task<BookingRequest?> GetByIdAsync(int id) =>
        Query().FirstOrDefaultAsync(x => x.Id == id);

    public async Task<IReadOnlyList<BookingRequest>> GetAllAsync(DateTime? from = null, DateTime? to = null)
    {
        var query = Query().AsQueryable();
        if (from.HasValue) query = query.Where(x => x.EndDateTime > from.Value);
        if (to.HasValue) query = query.Where(x => x.StartDateTime < to.Value);

        return await query.AsNoTracking()
            .OrderByDescending(x => x.StartDateTime)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<BookingRequest>> GetForStoreAsync(int storeId) =>
        await Query()
            .Where(x => x.StoreId == storeId)
            .OrderByDescending(x => x.StartDateTime)
            .ToListAsync();

    public async Task<IReadOnlyList<BookingRequest>> GetForStoresAsync(IReadOnlyCollection<int> storeIds) =>
        await Query()
            .Where(x => storeIds.Contains(x.StoreId))
            .OrderByDescending(x => x.StartDateTime)
            .ToListAsync();

    public async Task<IReadOnlyList<BookingRequest>> GetForCasualAsync(int casualId) =>
        await Query()
            .Where(x => x.CasualProfileId == casualId)
            .OrderByDescending(x => x.StartDateTime)
            .ToListAsync();

    public Task AddAsync(BookingRequest booking) =>
        db.BookingRequests.AddAsync(booking).AsTask();

    public Task<bool> HasAcceptedOverlapAsync(int casualId, DateTime start, DateTime end, int? exclude = null) =>
        db.BookingRequests.AnyAsync(x =>
            x.CasualProfileId == casualId &&
            x.Status == BookingStatus.Accepted &&
            (!exclude.HasValue || x.Id != exclude.Value) &&
            x.StartDateTime < end &&
            x.EndDateTime > start);

    public Task<bool> HasDuplicateActiveRequestAsync(int storeId, int casualId, DateTime start, DateTime end) =>
        db.BookingRequests.AnyAsync(x =>
            x.StoreId == storeId &&
            x.CasualProfileId == casualId &&
            x.StartDateTime == start &&
            x.EndDateTime == end &&
            (x.Status == BookingStatus.Pending || x.Status == BookingStatus.Accepted));

    public async Task<decimal> GetAcceptedHoursAsync(int casualId, DateTime start, DateTime end, int? exclude = null)
    {
        var minutes = await db.BookingRequests
            .Where(x => x.CasualProfileId == casualId &&
                        x.Status == BookingStatus.Accepted &&
                        (!exclude.HasValue || x.Id != exclude.Value) &&
                        x.StartDateTime >= start &&
                        x.StartDateTime < end)
            .Select(x => EF.Functions.DateDiffMinute(x.StartDateTime, x.EndDateTime))
            .ToListAsync();

        return minutes.Sum(m => m > 300 ? (m - 30) / 60m : m / 60m);
    }

    public async Task<int> ExpirePendingAsync(DateTime utcNow)
    {
        var items = await db.BookingRequests
            .Where(x => x.Status == BookingStatus.Pending &&
                        x.ExpiresAtUtc.HasValue &&
                        x.ExpiresAtUtc <= utcNow)
            .ToListAsync();

        foreach (var item in items) item.Status = BookingStatus.Expired;
        if (items.Count > 0) await db.SaveChangesAsync();

        return items.Count;
    }

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class StoreBudgetRepository(ApplicationDbContext db) : IStoreBudgetRepository
{
    public Task<StoreBudget?> GetAsync(int storeId, DateOnly date) =>
        db.StoreBudgets.FirstOrDefaultAsync(x => x.StoreId == storeId && x.BudgetDate == date);

    public async Task<IReadOnlyList<StoreBudget>> GetRangeAsync(
        IReadOnlyCollection<int> storeIds,
        DateOnly from,
        DateOnly to) =>
        await db.StoreBudgets.AsNoTracking()
            .Where(x => storeIds.Contains(x.StoreId) &&
                        x.BudgetDate >= from &&
                        x.BudgetDate <= to)
            .OrderBy(x => x.BudgetDate)
            .ToListAsync();

    public async Task SetAsync(int storeId, DateOnly date, decimal amount)
    {
        var budget = await GetAsync(storeId, date);

        if (budget is null)
            await db.StoreBudgets.AddAsync(new StoreBudget
            {
                StoreId = storeId,
                BudgetDate = date,
                Amount = amount
            });
        else
            budget.Amount = amount;

        await db.SaveChangesAsync();
    }
}

public class NotificationRepository(ApplicationDbContext db) : INotificationRepository
{
    public Task AddAsync(Notification notification) =>
        db.Notifications.AddAsync(notification).AsTask();

    public async Task<IReadOnlyList<Notification>> GetForUserAsync(Guid userId) =>
        await db.Notifications.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(100)
            .ToListAsync();

    public Task<int> CountUnreadAsync(Guid userId) =>
        db.Notifications.CountAsync(x => x.UserId == userId && !x.IsRead);

    public Task<Notification?> GetByIdAsync(int id) =>
        db.Notifications.FirstOrDefaultAsync(x => x.Id == id);

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class AuditRepository(ApplicationDbContext db) : IAuditRepository
{
    public Task AddAsync(AuditLog log) => db.AuditLogs.AddAsync(log).AsTask();

    public async Task<IReadOnlyList<AuditLog>> GetRecentAsync(int take) =>
        await db.AuditLogs.AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(take)
            .ToListAsync();

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class RatingRepository(ApplicationDbContext db) : IRatingRepository
{
    public Task AddAsync(Rating rating) => db.Ratings.AddAsync(rating).AsTask();

    public Task<bool> ExistsForBookingAsync(int id) =>
        db.Ratings.AnyAsync(x => x.BookingRequestId == id);

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class SkillRepository(ApplicationDbContext db) : ISkillRepository
{
    public async Task<IReadOnlyList<Skill>> GetAllAsync() =>
        await db.Skills.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .ToListAsync();

    public Task<Skill?> GetByIdAsync(int id) =>
        db.Skills.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.IsActive);

    public async Task SetCasualSkillsAsync(int casualProfileId, IReadOnlyList<int> skillIds)
    {
        var existing = await db.CasualSkills
            .Where(x => x.CasualProfileId == casualProfileId)
            .ToListAsync();

        db.CasualSkills.RemoveRange(existing);

        var valid = await db.Skills
            .Where(x => skillIds.Contains(x.Id) && x.IsActive)
            .Select(x => x.Id)
            .ToListAsync();

        await db.CasualSkills.AddRangeAsync(
            valid.Distinct().Select(id => new CasualSkill
            {
                CasualProfileId = casualProfileId,
                SkillId = id
            }));

        await db.SaveChangesAsync();
    }
}

public class AreaManagerRepository(ApplicationDbContext db) : IAreaManagerRepository
{
    public async Task<IReadOnlyList<AreaManagerZoneAssignment>> GetAssignmentsAsync(Guid areaManagerUserId) =>
        await db.AreaManagerZoneAssignments
            .Include(x => x.Zone)
            .AsNoTracking()
            .Where(x => x.AreaManagerUserId == areaManagerUserId && x.IsActive)
            .OrderBy(x => x.Zone!.Name)
            .ToListAsync();

    public async Task SetAssignmentsAsync(Guid areaManagerUserId, IReadOnlyCollection<int> zoneIds)
    {
        var current = await db.AreaManagerZoneAssignments
            .Where(x => x.AreaManagerUserId == areaManagerUserId)
            .ToListAsync();

        db.AreaManagerZoneAssignments.RemoveRange(current);

        await db.AreaManagerZoneAssignments.AddRangeAsync(
            zoneIds.Distinct().Select(zoneId => new AreaManagerZoneAssignment
            {
                AreaManagerUserId = areaManagerUserId,
                ZoneId = zoneId,
                IsActive = true,
                AssignedAtUtc = DateTime.UtcNow
            }));

        await db.SaveChangesAsync();
    }

    public Task AddTransferAsync(CasualZoneTransfer transfer) =>
        db.CasualZoneTransfers.AddAsync(transfer).AsTask();

    public async Task<IReadOnlyList<CasualZoneTransfer>> GetTransfersAsync(
        IReadOnlyCollection<int> zoneIds,
        int take = 100) =>
        await db.CasualZoneTransfers
            .Include(x => x.CasualProfile)
            .Include(x => x.FromZone)
            .Include(x => x.ToZone)
            .AsNoTracking()
            .Where(x =>
                (x.FromZoneId.HasValue && zoneIds.Contains(x.FromZoneId.Value)) ||
                zoneIds.Contains(x.ToZoneId))
            .OrderByDescending(x => x.TransferredAtUtc)
            .Take(take)
            .ToListAsync();

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}

public class PublicHolidayRepository(ApplicationDbContext db) : IPublicHolidayRepository
{
    public async Task<IReadOnlyList<PublicHoliday>> GetAllAsync() =>
        await db.PublicHolidays.AsNoTracking()
            .OrderBy(x => x.HolidayDate)
            .ToListAsync();

    public Task<PublicHoliday?> GetByDateAsync(DateOnly date) =>
        db.PublicHolidays.AsNoTracking()
            .FirstOrDefaultAsync(x => x.HolidayDate == date && x.IsActive);

    public Task<bool> ExistsAsync(DateOnly date) =>
        db.PublicHolidays.AnyAsync(x => x.HolidayDate == date);

    public Task AddAsync(PublicHoliday holiday) =>
        db.PublicHolidays.AddAsync(holiday).AsTask();

    public async Task SaveChangesAsync() => await db.SaveChangesAsync();
}
