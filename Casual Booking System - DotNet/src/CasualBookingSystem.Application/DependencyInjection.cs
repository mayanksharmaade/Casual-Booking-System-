using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CasualBookingSystem.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IStoreService, StoreService>();
        services.AddScoped<ICasualService, CasualService>();
        services.AddScoped<IAreaManagerService, AreaManagerService>();
        return services;
    }
}
