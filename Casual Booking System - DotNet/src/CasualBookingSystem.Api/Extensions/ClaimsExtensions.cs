using System.Security.Claims;
namespace CasualBookingSystem.Api.Extensions;
public static class ClaimsExtensions
{
    public static Guid UserId(this ClaimsPrincipal user) => Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException("User id claim missing."));
}
