using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CasualBookingSystem.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Zone> Zones => Set<Zone>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<PayRate> PayRates => Set<PayRate>();

    public DbSet<CasualProfile> CasualProfiles => Set<CasualProfile>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<CasualSkill> CasualSkills => Set<CasualSkill>();
    public DbSet<CasualAvailability> CasualAvailabilities => Set<CasualAvailability>();
    public DbSet<CasualZoneTransfer> CasualZoneTransfers => Set<CasualZoneTransfer>();

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeRosterEntry> EmployeeRosterEntries => Set<EmployeeRosterEntry>();
    public DbSet<EmployeeAbsence> EmployeeAbsences => Set<EmployeeAbsence>();
    public DbSet<EmployeeWorkPattern> EmployeeWorkPatterns => Set<EmployeeWorkPattern>();

    public DbSet<BookingRequest> BookingRequests => Set<BookingRequest>();
    public DbSet<StoreBudget> StoreBudgets => Set<StoreBudget>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Rating> Ratings => Set<Rating>();

    public DbSet<AreaManagerZoneAssignment> AreaManagerZoneAssignments => Set<AreaManagerZoneAssignment>();
    public DbSet<PublicHoliday> PublicHolidays => Set<PublicHoliday>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
