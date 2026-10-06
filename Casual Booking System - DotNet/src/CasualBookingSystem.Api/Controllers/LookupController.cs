using CasualBookingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasualBookingSystem.Api.Controllers;

[ApiController, Route("api/lookup"), AllowAnonymous]
public class LookupController(IAdminService admin, ISkillRepository skills) : ControllerBase
{
    [HttpGet("zones")]
    public async Task<IActionResult> Zones() =>
        Ok((await admin.GetZonesAsync()).Where(x => x.IsActive));

    [HttpGet("skills")]
    public async Task<IActionResult> Skills() =>
        Ok((await skills.GetAllAsync()).Select(x => new { x.Id, x.Name }));
}
