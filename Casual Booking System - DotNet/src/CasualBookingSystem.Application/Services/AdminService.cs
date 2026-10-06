using CasualBookingSystem.Application.Common;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.Services;

public class AdminService(
    IUserAccountService users,
    IZoneRepository zones,
    IStoreRepository stores,
    ICasualRepository casuals,
    IAuditRepository audit,
    IAreaManagerRepository areaManagers,
    IPublicHolidayRepository publicHolidays,
    IBookingRepository bookings,
    IEmployeeRepository employees) : IAdminService
{
    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var allStores = await stores.GetAllAsync();
        var allBookings = await bookings.GetAllAsync();
        var todayStart = DateTime.Today;
        var todayEnd = todayStart.AddDays(1);
        var staffingAlerts = 0;

        foreach (var store in allStores.Where(x => x.IsActive))
        {
            var roster = await employees.GetRosterAsync(store.Id, todayStart, todayEnd);
            var absences = await employees.GetAbsencesAsync(store.Id, todayStart, todayEnd);
            staffingAlerts += roster.Count(r =>
                !r.IsCancelled &&
                absences.Any(a => a.EmployeeId == r.EmployeeId && a.StartDateTime < r.EndDateTime && a.EndDateTime > r.StartDateTime));
        }

        return new AdminDashboardDto(
            allStores.Count,
            allStores.Count(x => x.RegistrationStatus == RegistrationStatus.Pending),
            await users.CountByRoleAsync(UserRole.Casual),
            await users.CountByRoleAsync(UserRole.Casual, RegistrationStatus.Pending),
            await users.CountByRoleAsync(UserRole.AreaManager),
            (await zones.GetAllAsync()).Count,
            await users.CountActiveAsync(),
            (await users.GetPendingAsync()).Count,
            allBookings.Count(x => x.Status is BookingStatus.Pending or BookingStatus.Accepted),
            staffingAlerts);
    }

    public async Task<IReadOnlyList<RegistrationDto>> GetPendingRegistrationsAsync()
    {
        var accounts = await users.GetPendingAsync();
        var allStores = await stores.GetAllAsync();
        var result = new List<RegistrationDto>();

        foreach (var account in accounts)
        {
            Store? store = null;
            CasualProfile? casual = null;

            if (account.StoreId.HasValue)
                store = allStores.FirstOrDefault(x => x.Id == account.StoreId.Value);

            if (account.Role == UserRole.Casual)
                casual = await casuals.GetByUserIdAsync(account.UserId);

            result.Add(new RegistrationDto(
                account.UserId,
                account.Email,
                account.FirstName,
                account.LastName,
                account.Role.ToString(),
                account.ApprovalStatus,
                account.StoreId,
                store?.Name,
                casual?.Phone,
                casual?.City ?? store?.City,
                casual?.CurrentZoneId ?? store?.ZoneId,
                casual?.CurrentZone?.Name ?? store?.Zone?.Name,
                casual?.Skills
                    .Select(x => x.Skill?.Name ?? string.Empty)
                    .Where(x => x.Length > 0)
                    .OrderBy(x => x)
                    .ToList() ?? new List<string>(),
                store?.Code,
                store?.Address));
        }

        return result;
    }

    public Task<IReadOnlyList<UserAccountDto>> GetUsersAsync() => users.GetAllAsync();

    public async Task<IReadOnlyList<StoreAdminDto>> GetStoresAsync() =>
        (await stores.GetAllAsync())
        .Select(x => new StoreAdminDto(
            x.Id,
            x.Code,
            x.Name,
            x.City,
            x.Zone?.Name ?? string.Empty,
            x.RegistrationStatus,
            x.IsActive))
        .ToList();

    public async Task ApproveAsync(Guid adminUserId, Guid userId)
    {
        var account = await users.GetByIdAsync(userId) ?? throw new BusinessRuleException("User not found.");

        await users.SetApprovalAsync(userId, RegistrationStatus.Approved);
        await users.SetActiveAsync(userId, true);

        if (account.Role == UserRole.Casual)
        {
            var profile = await casuals.GetByUserIdAsync(userId);
            if (profile is not null)
            {
                profile.RegistrationStatus = RegistrationStatus.Approved;
                profile.IsActive = true;
                await casuals.SaveChangesAsync();
            }
        }

        if (account.StoreId.HasValue)
        {
            var store = await stores.GetByIdAsync(account.StoreId.Value);
            if (store is not null)
            {
                store.RegistrationStatus = RegistrationStatus.Approved;
                store.IsActive = true;
                await stores.SaveChangesAsync();
            }
        }

        await Log(adminUserId, "ApproveRegistration", "User", userId.ToString(), account.Email);
    }

    public async Task RejectAsync(Guid adminUserId, Guid userId)
    {
        var account = await users.GetByIdAsync(userId) ?? throw new BusinessRuleException("User not found.");

        await users.SetApprovalAsync(userId, RegistrationStatus.Rejected);
        await users.SetActiveAsync(userId, false);

        if (account.Role == UserRole.Casual)
        {
            var profile = await casuals.GetByUserIdAsync(userId);
            if (profile is not null)
            {
                profile.RegistrationStatus = RegistrationStatus.Rejected;
                profile.IsActive = false;
                await casuals.SaveChangesAsync();
            }
        }

        if (account.StoreId.HasValue)
        {
            var store = await stores.GetByIdAsync(account.StoreId.Value);
            if (store is not null)
            {
                store.RegistrationStatus = RegistrationStatus.Rejected;
                store.IsActive = false;
                await stores.SaveChangesAsync();
            }
        }

        await Log(adminUserId, "RejectRegistration", "User", userId.ToString(), account.Email);
    }

    public async Task SetActiveAsync(Guid adminUserId, Guid userId, bool isActive)
    {
        await users.SetActiveAsync(userId, isActive);
        var account = await users.GetByIdAsync(userId);

        if (account?.Role == UserRole.Casual)
        {
            var profile = await casuals.GetByUserIdAsync(userId);
            if (profile is not null)
            {
                profile.IsActive = isActive;
                await casuals.SaveChangesAsync();
            }
        }

        await Log(adminUserId, isActive ? "ActivateUser" : "DeactivateUser", "User", userId.ToString(), null);
    }

    public async Task SetStoreActiveAsync(Guid adminUserId, int storeId, bool isActive)
    {
        var store = await stores.GetByIdAsync(storeId) ?? throw new BusinessRuleException("Store not found.");
        store.IsActive = isActive;
        await stores.SaveChangesAsync();
        await Log(adminUserId, isActive ? "ActivateStore" : "DeactivateStore", "Store", store.Id.ToString(), store.Name);
    }

    public async Task<IReadOnlyList<ZoneDto>> GetZonesAsync() =>
        (await zones.GetAllAsync()).Select(x => new ZoneDto(x.Id, x.Name, x.IsActive)).ToList();

    public async Task<ZoneDto> CreateZoneAsync(Guid adminUserId, CreateZoneRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new BusinessRuleException("Zone name is required.");
        if (await zones.NameExistsAsync(request.Name.Trim())) throw new BusinessRuleException("Zone already exists.");

        var zone = new Zone { Name = request.Name.Trim() };
        await zones.AddAsync(zone);
        await zones.SaveChangesAsync();

        await Log(adminUserId, "CreateZone", "Zone", zone.Id.ToString(), zone.Name);
        return new ZoneDto(zone.Id, zone.Name, zone.IsActive);
    }

    public async Task SetZoneActiveAsync(Guid adminUserId, int zoneId, bool isActive)
    {
        var zone = await zones.GetByIdAsync(zoneId)
            ?? throw new BusinessRuleException("Zone not found.");

        zone.IsActive = isActive;
        await zones.SaveChangesAsync();

        await Log(
            adminUserId,
            isActive ? "ActivateZone" : "DeactivateZone",
            "Zone",
            zone.Id.ToString(),
            zone.Name);
    }

    private async Task EnsureManagerEmployeesAsync()
    {
        var accounts = (await users.GetAllAsync())
            .Where(x => x.StoreId.HasValue && x.Role is UserRole.StoreManager or UserRole.AssistantManager)
            .ToList();

        var changed = false;
        foreach (var account in accounts)
        {
            if (await employees.GetByUserIdAsync(account.UserId) is not null) continue;

            await employees.AddAsync(new Employee
            {
                StoreId = account.StoreId!.Value,
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

    public async Task<IReadOnlyList<PayRateDto>> GetPayRatesAsync()
    {
        await EnsureManagerEmployeesAsync();
        var allStores = await stores.GetAllAsync();
        var storeNames = allStores.ToDictionary(x => x.Id, x => x.Name);
        var result = new List<PayRateDto>();

        foreach (var store in allStores)
        {
            foreach (var employee in await employees.GetByStoreAsync(store.Id))
            {
                if (employee.EmployeeType is EmployeeType.Volunteer or EmployeeType.Casual) continue;
                result.Add(new PayRateDto(
                    "Employee", employee.Id, $"{employee.FirstName} {employee.LastName}", employee.EmployeeType.ToString(),
                    storeNames.GetValueOrDefault(employee.StoreId), employee.BaseHourlyRate, 0m, BusinessRules.SaturdayLoadingPercent));
            }
        }

        foreach (var casual in await casuals.SearchAsync(null, null))
        {
            if (!casual.IsActive || casual.RegistrationStatus != RegistrationStatus.Approved) continue;
            result.Add(new PayRateDto(
                "Casual", casual.Id, $"{casual.FirstName} {casual.LastName}", "Casual",
                null, casual.BaseHourlyRate, BusinessRules.CasualLoadingPercent, BusinessRules.SaturdayLoadingPercent));
        }

        return result
            .OrderBy(x => x.WorkerType)
            .ThenBy(x => x.WorkerName)
            .ToList();
    }

    public async Task<PayRateDto> SetPayRateAsync(Guid adminUserId, SetPayRateRequest request)
    {
        if (request.BaseHourlyRate <= 0)
            throw new BusinessRuleException("Base hourly rate must be greater than zero.");

        await EnsureManagerEmployeesAsync();

        if (request.WorkerKind.Equals("Employee", StringComparison.OrdinalIgnoreCase))
        {
            var employee = await employees.GetByIdAsync(request.WorkerId)
                ?? throw new BusinessRuleException("Employee not found.");
            if (employee.EmployeeType == EmployeeType.Volunteer)
                throw new BusinessRuleException("Volunteers are unpaid.");

            employee.BaseHourlyRate = request.BaseHourlyRate;
            await employees.SaveChangesAsync();
            var store = await stores.GetByIdAsync(employee.StoreId);
            await Log(adminUserId, "SetIndividualPayRate", "Employee", employee.Id.ToString(), $"{employee.FirstName} {employee.LastName}: {request.BaseHourlyRate}");
            return new PayRateDto("Employee", employee.Id, $"{employee.FirstName} {employee.LastName}", employee.EmployeeType.ToString(), store?.Name, employee.BaseHourlyRate, 0m, BusinessRules.SaturdayLoadingPercent);
        }

        if (request.WorkerKind.Equals("Casual", StringComparison.OrdinalIgnoreCase))
        {
            var casual = await casuals.GetByIdAsync(request.WorkerId)
                ?? throw new BusinessRuleException("Casual not found.");
            casual.BaseHourlyRate = request.BaseHourlyRate;
            await casuals.SaveChangesAsync();
            await Log(adminUserId, "SetIndividualPayRate", "CasualProfile", casual.Id.ToString(), $"{casual.FirstName} {casual.LastName}: {request.BaseHourlyRate}");
            return new PayRateDto("Casual", casual.Id, $"{casual.FirstName} {casual.LastName}", "Casual", null, casual.BaseHourlyRate, BusinessRules.CasualLoadingPercent, BusinessRules.SaturdayLoadingPercent);
        }

        throw new BusinessRuleException("Unknown worker kind.");
    }

    public async Task<IReadOnlyList<AreaManagerAdminDto>> GetAreaManagersAsync()
    {
        var accounts = (await users.GetAllAsync()).Where(x => x.Role == UserRole.AreaManager).ToList();
        var allZones = await zones.GetAllAsync();
        var result = new List<AreaManagerAdminDto>();

        foreach (var account in accounts)
        {
            var assignments = await areaManagers.GetAssignmentsAsync(account.UserId);
            var assignedIds = assignments.Where(x => x.IsActive).Select(x => x.ZoneId).ToHashSet();
            var zoneDtos = allZones.Where(z => assignedIds.Contains(z.Id)).Select(z => new ZoneDto(z.Id, z.Name, z.IsActive)).ToList();

            result.Add(new AreaManagerAdminDto(
                account.UserId,
                account.Email,
                $"{account.FirstName} {account.LastName}",
                account.ApprovalStatus,
                account.IsActive,
                zoneDtos));
        }

        return result;
    }

    public async Task AssignAreaManagerZonesAsync(Guid adminUserId, Guid areaManagerUserId, AssignAreaManagerZonesRequest request)
    {
        var account = await users.GetByIdAsync(areaManagerUserId) ?? throw new BusinessRuleException("Area Manager not found.");
        if (account.Role != UserRole.AreaManager) throw new BusinessRuleException("Selected user is not an Area Manager.");
        if (request.ZoneIds.Count == 0) throw new BusinessRuleException("Select at least one zone.");

        var allZones = await zones.GetAllAsync();
        var activeIds = allZones.Where(x => x.IsActive).Select(x => x.Id).ToHashSet();
        if (request.ZoneIds.Distinct().Any(id => !activeIds.Contains(id)))
            throw new BusinessRuleException("One or more selected zones are invalid or inactive.");

        await areaManagers.SetAssignmentsAsync(areaManagerUserId, request.ZoneIds.Distinct().ToArray());
        await Log(adminUserId, "AssignAreaManagerZones", "AreaManager", areaManagerUserId.ToString(), string.Join(",", request.ZoneIds.Distinct()));
    }

    public async Task<IReadOnlyList<PublicHolidayDto>> GetPublicHolidaysAsync() =>
        (await publicHolidays.GetAllAsync())
        .Select(x => new PublicHolidayDto(x.Id, x.HolidayDate, x.Name, x.IsActive))
        .ToList();

    public async Task<PublicHolidayDto> CreatePublicHolidayAsync(Guid adminUserId, CreatePublicHolidayRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new BusinessRuleException("Public holiday name is required.");
        if (await publicHolidays.ExistsAsync(request.HolidayDate)) throw new BusinessRuleException("A public holiday already exists for this date.");

        var holiday = new PublicHoliday { HolidayDate = request.HolidayDate, Name = request.Name.Trim() };
        await publicHolidays.AddAsync(holiday);
        await publicHolidays.SaveChangesAsync();

        await Log(adminUserId, "CreatePublicHoliday", "PublicHoliday", holiday.Id.ToString(), $"{holiday.HolidayDate}: {holiday.Name}");
        return new PublicHolidayDto(holiday.Id, holiday.HolidayDate, holiday.Name, holiday.IsActive);
    }

    public async Task<IReadOnlyList<AuditLogDto>> GetRecentAuditAsync(int take = 100) =>
        (await audit.GetRecentAsync(Math.Clamp(take, 1, 500)))
        .Select(x => new AuditLogDto(x.Id, x.UserId, x.Action, x.EntityName, x.EntityId, x.Details, x.CreatedAtUtc))
        .ToList();

    public async Task<SystemReportDto> GetSystemReportAsync(DateTime from, DateTime to)
    {
        if (to <= from) throw new BusinessRuleException("Report end must be after report start.");

        var allBookings = await bookings.GetAllAsync(from, to);
        var allStores = await stores.GetAllAsync();
        var allUsers = await users.GetAllAsync();

        var staffingEvents = 0;
        foreach (var store in allStores)
        {
            var roster = await employees.GetRosterAsync(store.Id, from, to);
            var absences = await employees.GetAbsencesAsync(store.Id, from, to);
            staffingEvents += roster.Count(r =>
                !r.IsCancelled &&
                absences.Any(a => a.EmployeeId == r.EmployeeId && a.StartDateTime < r.EndDateTime && a.EndDateTime > r.StartDateTime));
        }

        return new SystemReportDto(
            from,
            to,
            allBookings.Count,
            allBookings.Count(x => x.Status == BookingStatus.Accepted),
            allBookings.Count(x => x.Status == BookingStatus.Completed),
            allBookings.Count(x => x.Status == BookingStatus.Cancelled),
            allBookings.Count(x => x.Status == BookingStatus.Expired),
            allBookings.Where(x => x.Status is BookingStatus.Accepted or BookingStatus.Completed).Sum(x => x.EstimatedCost),
            allStores.Count(x => x.IsActive && x.RegistrationStatus == RegistrationStatus.Approved),
            allUsers.Count(x => x.Role == UserRole.Casual && x.IsActive && x.ApprovalStatus == RegistrationStatus.Approved),
            staffingEvents,
            allBookings.Count(x => x.OverrideApprovedByUserId.HasValue));
    }

    private async Task Log(Guid userId, string action, string entity, string? entityId, string? details)
    {
        await audit.AddAsync(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityName = entity,
            EntityId = entityId,
            Details = details
        });
        await audit.SaveChangesAsync();
    }
}
