using System.Net;
using System.Text.Json;
using CasualBookingSystem.Application.Common;
namespace CasualBookingSystem.Api.Middleware;
public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (BusinessRuleException ex) { await Write(context, HttpStatusCode.BadRequest, ex.Message); }
        catch (UnauthorizedAccessException ex) { await Write(context, HttpStatusCode.Unauthorized, ex.Message); }
        catch (Exception ex) { logger.LogError(ex, "Unhandled exception"); await Write(context, HttpStatusCode.InternalServerError, "An unexpected error occurred."); }
    }
    private static async Task Write(HttpContext c, HttpStatusCode code, string message) { c.Response.StatusCode = (int)code; c.Response.ContentType = "application/json"; await c.Response.WriteAsync(JsonSerializer.Serialize(new { message })); }
}
