using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
namespace CasualBookingSystem.Api.Controllers;
[ApiController, Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("login")] public async Task<IActionResult> Login(LoginRequest request) { var result = await auth.LoginAsync(request); return result is null ? Unauthorized(new { message = "Invalid credentials or account is not approved/active." }) : Ok(result); }
    [HttpPost("register/casual")] public async Task<IActionResult> RegisterCasual(RegisterCasualRequest request) { await auth.RegisterCasualAsync(request); return Accepted(new { message = "Registration submitted for approval." }); }
    [HttpPost("register/area-manager")] public async Task<IActionResult> RegisterAreaManager(RegisterAreaManagerRequest request) { await auth.RegisterAreaManagerAsync(request); return Accepted(new { message = "Area Manager registration submitted for approval." }); }
    [HttpPost("register/store")] public async Task<IActionResult> RegisterStore(RegisterStoreRequest request) { await auth.RegisterStoreAsync(request); return Accepted(new { message = "Store registration submitted for approval." }); }
}
