using CasualBookingSystem.Api.Extensions;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasualBookingSystem.Api.Controllers;

[ApiController, Route("api/casual"), Authorize(Roles = "Casual")]
public class CasualController(ICasualService service) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() => Ok(await service.GetDashboardAsync(User.UserId()));

    [HttpGet("profile")]
    public async Task<IActionResult> Profile() => Ok(await service.GetProfileAsync(User.UserId()));

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateCasualProfileRequest request) =>
        Ok(await service.UpdateProfileAsync(User.UserId(), request));

    [HttpGet("skills")]
    public async Task<IActionResult> Skills() => Ok(await service.GetSkillsAsync(User.UserId()));

    [HttpPut("skills")]
    public async Task<IActionResult> Skills(SetCasualSkillsRequest request)
    {
        await service.SetSkillsAsync(User.UserId(), request);
        return NoContent();
    }

    [HttpGet("availability")]
    public async Task<IActionResult> Availability() => Ok(await service.GetAvailabilityAsync(User.UserId()));

    [HttpPost("availability")]
    public async Task<IActionResult> AddAvailability(AddAvailabilityRequest request) =>
        Ok(await service.AddAvailabilityAsync(User.UserId(), request));

    [HttpDelete("availability/{id:int}")]
    public async Task<IActionResult> DeleteAvailability(int id)
    {
        await service.DeleteAvailabilityAsync(User.UserId(), id);
        return NoContent();
    }

    [HttpGet("bookings")]
    public async Task<IActionResult> Bookings() => Ok(await service.GetBookingsAsync(User.UserId()));

    [HttpPost("bookings/{id:int}/accept")]
    public async Task<IActionResult> Accept(int id)
    {
        await service.AcceptBookingAsync(User.UserId(), id);
        return NoContent();
    }

    [HttpPost("bookings/{id:int}/decline")]
    public async Task<IActionResult> Decline(int id, DeclineBookingRequest request)
    {
        await service.DeclineBookingAsync(User.UserId(), id, request);
        return NoContent();
    }

    [HttpPost("bookings/{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancelBookingRequest request)
    {
        await service.CancelBookingAsync(User.UserId(), id, request);
        return NoContent();
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> Notifications() => Ok(await service.GetNotificationsAsync(User.UserId()));

    [HttpPost("notifications/{id:int}/read")]
    public async Task<IActionResult> Read(int id)
    {
        await service.MarkNotificationReadAsync(User.UserId(), id);
        return NoContent();
    }

    [HttpGet("reports")]
    public async Task<IActionResult> Report(DateTime from, DateTime to) =>
        Ok(await service.GetReportAsync(User.UserId(), from, to));
}
