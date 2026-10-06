using System.Text;
using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Infrastructure.Data;
using CasualBookingSystem.Infrastructure.Identity;
using CasualBookingSystem.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace CasualBookingSystem.Infrastructure;
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
        services.AddIdentityCore<ApplicationUser>(o => { o.Password.RequiredLength = 8; o.Password.RequireDigit = true; o.Password.RequireUppercase = true; o.Password.RequireNonAlphanumeric = true; })
            .AddRoles<IdentityRole<Guid>>().AddEntityFrameworkStores<ApplicationDbContext>().AddSignInManager();
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        var jwt = configuration.GetSection("Jwt").Get<JwtSettings>() ?? throw new InvalidOperationException("JWT settings missing.");
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => { o.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true, ValidIssuer = jwt.Issuer, ValidAudience = jwt.Audience, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)), ClockSkew = TimeSpan.FromMinutes(1) }; });
        services.AddAuthorization();
        services.AddScoped<IUserAccountService, UserAccountService>();
        services.AddScoped<IZoneRepository, ZoneRepository>();
        services.AddScoped<IStoreRepository, StoreRepository>();
        services.AddScoped<IPayRateRepository, PayRateRepository>();
        services.AddScoped<ICasualRepository, CasualRepository>();
        services.AddScoped<IEmployeeRepository, EmployeeRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IStoreBudgetRepository, StoreBudgetRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IAuditRepository, AuditRepository>();
        services.AddScoped<IRatingRepository, RatingRepository>();
        services.AddScoped<ISkillRepository, SkillRepository>();
        services.AddScoped<IAreaManagerRepository, AreaManagerRepository>();
        services.AddScoped<IPublicHolidayRepository, PublicHolidayRepository>();
        services.AddScoped<DatabaseSeeder>();
        return services;
    }
}
