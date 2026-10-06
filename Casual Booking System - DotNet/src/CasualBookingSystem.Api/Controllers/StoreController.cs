using CasualBookingSystem.Api.Extensions;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasualBookingSystem.Api.Controllers;

[ApiController, Route("api/store"), Authorize(Roles = "StoreManager,AssistantManager")]
public class StoreController(IStoreService service) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] DateOnly? date) =>
        Ok(await service.GetDashboardAsync(User.UserId(), date ?? DateOnly.FromDateTime(DateTime.Today)));

    [HttpGet("employees")]
    public async Task<IActionResult> Employees() => Ok(await service.GetEmployeesAsync(User.UserId()));

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee(CreateEmployeeRequest request) =>
        Ok(await service.CreateEmployeeAsync(User.UserId(), request));

    [HttpPost("assistant-managers")]
    public async Task<IActionResult> CreateAssistant(CreateAssistantManagerRequest request)
    {
        await service.CreateAssistantManagerAsync(User.UserId(), request);
        return NoContent();
    }

    [HttpGet("roster")]
    public async Task<IActionResult> Roster(DateTime from, DateTime to) =>
        Ok(await service.GetRosterAsync(User.UserId(), from, to));

    [HttpPost("roster")]
    public async Task<IActionResult> CreateRoster(CreateRosterEntryRequest request) =>
        Ok(await service.CreateRosterAsync(User.UserId(), request));

    [HttpPost("roster/range")]
    public async Task<IActionResult> CreateRosterRange(CreateRosterRangeRequest request) =>
        Ok(await service.CreateRosterRangeAsync(User.UserId(), request));

    [HttpPut("roster/{rosterEntryId:int}")]
    public async Task<IActionResult> UpdateRoster(int rosterEntryId, UpdateRosterEntryRequest request) =>
        Ok(await service.UpdateRosterAsync(User.UserId(), rosterEntryId, request));

    [HttpGet("employees/{employeeId:int}/work-pattern")]
    public async Task<IActionResult> WorkPattern(int employeeId) =>
        Ok(await service.GetWorkPatternAsync(User.UserId(), employeeId));

    [HttpPut("employees/{employeeId:int}/work-pattern")]
    public async Task<IActionResult> SetWorkPattern(int employeeId, SetEmployeeWorkPatternRequest request) =>
        Ok(await service.SetWorkPatternAsync(User.UserId(), employeeId, request));

    [HttpPost("absences")]
    public async Task<IActionResult> Absence(CreateAbsenceRequest request) =>
        Ok(await service.RecordAbsenceAsync(User.UserId(), request));

    [HttpGet("staffing-gaps")]
    public async Task<IActionResult> Gaps(DateTime from, DateTime to) =>
        Ok(await service.GetStaffingGapsAsync(User.UserId(), from, to));

    [HttpGet("casuals/filters")]
    public async Task<IActionResult> CasualFilters() =>
        Ok(await service.GetCasualSearchFiltersAsync(User.UserId()));

    [HttpGet("casuals/search")]
    public async Task<IActionResult> Search(
        string? city,
        string? search,
        DateTime start,
        DateTime end,
        int? zoneId,
        [FromQuery] int[]? skillIds) =>
        Ok(await service.SearchCasualsAsync(User.UserId(), city, search, start, end, zoneId, skillIds));

    [HttpGet("bookings")]
    public async Task<IActionResult> Bookings() => Ok(await service.GetBookingsAsync(User.UserId()));

    [HttpPost("bookings")]
    public async Task<IActionResult> CreateBooking(CreateBookingRequestDto request) =>
        Ok(await service.CreateBookingRequestAsync(User.UserId(), request));

    [HttpPost("bookings/{bookingId:int}/cancel")]
    public async Task<IActionResult> Cancel(int bookingId, CancelBookingRequest request)
    {
        await service.CancelBookingAsync(User.UserId(), bookingId, request.Reason);
        return NoContent();
    }

    [HttpPost("bookings/{bookingId:int}/complete")]
    public async Task<IActionResult> Complete(int bookingId)
    {
        await service.CompleteBookingAsync(User.UserId(), bookingId);
        return NoContent();
    }

    [HttpPut("budget")]
    public async Task<IActionResult> Budget(SetStoreBudgetRequest request)
    {
        await service.SetBudgetAsync(User.UserId(), request);
        return NoContent();
    }

    [HttpPost("bookings/{bookingId:int}/rating")]
    public async Task<IActionResult> Rate(int bookingId, RateCasualRequest request)
    {
        await service.RateCasualAsync(User.UserId(), bookingId, request);
        return NoContent();
    }

    [HttpGet("reports")]
    public async Task<IActionResult> Report(DateTime from, DateTime to) =>
        Ok(await service.GetReportAsync(User.UserId(), from, to));
}
