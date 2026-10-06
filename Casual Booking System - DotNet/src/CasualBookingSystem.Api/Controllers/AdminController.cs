using CasualBookingSystem.Api.Extensions;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasualBookingSystem.Api.Controllers;

[ApiController, Route("api/admin"), Authorize(Roles = "SuperAdmin")]
public class AdminController(IAdminService service) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() => Ok(await service.GetDashboardAsync());

    [HttpGet("registrations")]
    public async Task<IActionResult> Registrations() => Ok(await service.GetPendingRegistrationsAsync());

    [HttpGet("users")]
    public async Task<IActionResult> Users() => Ok(await service.GetUsersAsync());

    [HttpGet("stores")]
    public async Task<IActionResult> Stores() => Ok(await service.GetStoresAsync());

    [HttpPost("registrations/{userId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid userId)
    {
        await service.ApproveAsync(User.UserId(), userId);
        return NoContent();
    }

    [HttpPost("registrations/{userId:guid}/reject")]
    public async Task<IActionResult> Reject(Guid userId)
    {
        await service.RejectAsync(User.UserId(), userId);
        return NoContent();
    }

    [HttpPut("users/{userId:guid}/active/{isActive:bool}")]
    public async Task<IActionResult> Active(Guid userId, bool isActive)
    {
        await service.SetActiveAsync(User.UserId(), userId, isActive);
        return NoContent();
    }

    [HttpPut("stores/{storeId:int}/active/{isActive:bool}")]
    public async Task<IActionResult> StoreActive(int storeId, bool isActive)
    {
        await service.SetStoreActiveAsync(User.UserId(), storeId, isActive);
        return NoContent();
    }

    [HttpGet("zones")]
    public async Task<IActionResult> Zones() => Ok(await service.GetZonesAsync());

    [HttpPost("zones")]
    public async Task<IActionResult> CreateZone(CreateZoneRequest request) =>
        Ok(await service.CreateZoneAsync(User.UserId(), request));

    [HttpPut("zones/{zoneId:int}/active/{isActive:bool}")]
    public async Task<IActionResult> ZoneActive(int zoneId, bool isActive)
    {
        await service.SetZoneActiveAsync(User.UserId(), zoneId, isActive);
        return NoContent();
    }

    [HttpGet("pay-rates")]
    public async Task<IActionResult> PayRates() => Ok(await service.GetPayRatesAsync());

    [HttpPost("pay-rates")]
    public async Task<IActionResult> SetPayRate(SetPayRateRequest request) =>
        Ok(await service.SetPayRateAsync(User.UserId(), request));

    [HttpGet("area-managers")]
    public async Task<IActionResult> AreaManagers() => Ok(await service.GetAreaManagersAsync());

    [HttpPut("area-managers/{userId:guid}/zones")]
    public async Task<IActionResult> AssignAreaManagerZones(Guid userId, AssignAreaManagerZonesRequest request)
    {
        await service.AssignAreaManagerZonesAsync(User.UserId(), userId, request);
        return NoContent();
    }

    [HttpGet("public-holidays")]
    public async Task<IActionResult> PublicHolidays() => Ok(await service.GetPublicHolidaysAsync());

    [HttpPost("public-holidays")]
    public async Task<IActionResult> CreatePublicHoliday(CreatePublicHolidayRequest request) =>
        Ok(await service.CreatePublicHolidayAsync(User.UserId(), request));

    [HttpGet("audit")]
    public async Task<IActionResult> Audit([FromQuery] int take = 100) =>
        Ok(await service.GetRecentAuditAsync(take));

    [HttpGet("reports/system")]
    public async Task<IActionResult> SystemReport(DateTime from, DateTime to) =>
        Ok(await service.GetSystemReportAsync(from, to));
}
