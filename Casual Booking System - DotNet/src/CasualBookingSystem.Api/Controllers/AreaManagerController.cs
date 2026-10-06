using CasualBookingSystem.Api.Extensions;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasualBookingSystem.Api.Controllers;

[ApiController, Route("api/area-manager"), Authorize(Roles = "AreaManager")]
public class AreaManagerController(IAreaManagerService service) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] DateOnly? date) =>
        Ok(await service.GetDashboardAsync(User.UserId(), date ?? DateOnly.FromDateTime(DateTime.Today)));

    [HttpGet("stores")]
    public async Task<IActionResult> Stores([FromQuery] DateOnly? date) =>
        Ok(await service.GetStoresAsync(User.UserId(), date ?? DateOnly.FromDateTime(DateTime.Today)));

    [HttpGet("staffing-gaps")]
    public async Task<IActionResult> StaffingGaps(DateTime from, DateTime to) =>
        Ok(await service.GetStaffingGapsAsync(User.UserId(), from, to));

    [HttpGet("casuals/search")]
    public async Task<IActionResult> SearchCasuals(string? city, string? search, DateTime start, DateTime end) =>
        Ok(await service.SearchCasualsAsync(User.UserId(), city, search, start, end));

    [HttpGet("bookings")]
    public async Task<IActionResult> Bookings() => Ok(await service.GetBookingsAsync(User.UserId()));

    [HttpPost("bookings/{bookingId:int}/cancel")]
    public async Task<IActionResult> CancelBooking(int bookingId, CancelBookingRequest request)
    {
        await service.CancelBookingAsync(User.UserId(), bookingId, request.Reason);
        return NoContent();
    }

    [HttpPost("bookings/override")]
    public async Task<IActionResult> CreateOverrideBooking(AreaOverrideBookingRequest request) =>
        Ok(await service.CreateOverrideBookingAsync(User.UserId(), request));

    [HttpPost("casuals/transfer")]
    public async Task<IActionResult> TransferCasual(TransferCasualRequest request) =>
        Ok(await service.TransferCasualAsync(User.UserId(), request));

    [HttpGet("casuals/transfers")]
    public async Task<IActionResult> Transfers() => Ok(await service.GetTransfersAsync(User.UserId()));

    [HttpGet("reports")]
    public async Task<IActionResult> Report(DateTime from, DateTime to) =>
        Ok(await service.GetReportAsync(User.UserId(), from, to));
}
