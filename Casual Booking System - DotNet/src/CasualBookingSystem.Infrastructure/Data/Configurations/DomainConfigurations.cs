using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CasualBookingSystem.Infrastructure.Data.Configurations;

public class ZoneConfiguration : IEntityTypeConfiguration<Zone>
{
    public void Configure(EntityTypeBuilder<Zone> b)
    {
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.HasIndex(x => x.Name).IsUnique();
    }
}

public class StoreConfiguration : IEntityTypeConfiguration<Store>
{
    public void Configure(EntityTypeBuilder<Store> b)
    {
        b.Property(x => x.Code).HasMaxLength(30).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.City).HasMaxLength(100).IsRequired();
        b.HasOne(x => x.Zone).WithMany(x => x.Stores).HasForeignKey(x => x.ZoneId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class PayRateConfiguration : IEntityTypeConfiguration<PayRate>
{
    public void Configure(EntityTypeBuilder<PayRate> b)
    {
        b.Property(x => x.HourlyRate).HasPrecision(18, 2);
        b.HasIndex(x => new { x.EmployeeType, x.EffectiveFromUtc });
    }
}

public class CasualProfileConfiguration : IEntityTypeConfiguration<CasualProfile>
{
    public void Configure(EntityTypeBuilder<CasualProfile> b)
    {
        b.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        b.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        b.Property(x => x.Phone).HasMaxLength(50).IsRequired();
        b.Property(x => x.City).HasMaxLength(100).IsRequired();
        b.Property(x => x.RatingAverage).HasPrecision(5, 2);
        b.Property(x => x.BaseHourlyRate).HasPrecision(18, 2);
        b.HasIndex(x => x.UserId).IsUnique();
        b.HasOne(x => x.CurrentZone).WithMany().HasForeignKey(x => x.CurrentZoneId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> b)
    {
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.HasIndex(x => x.Name).IsUnique();
    }
}

public class CasualSkillConfiguration : IEntityTypeConfiguration<CasualSkill>
{
    public void Configure(EntityTypeBuilder<CasualSkill> b)
    {
        b.HasKey(x => new { x.CasualProfileId, x.SkillId });
        b.HasOne(x => x.CasualProfile).WithMany(x => x.Skills).HasForeignKey(x => x.CasualProfileId);
        b.HasOne(x => x.Skill).WithMany(x => x.Casuals).HasForeignKey(x => x.SkillId);
    }
}

public class CasualAvailabilityConfiguration : IEntityTypeConfiguration<CasualAvailability>
{
    public void Configure(EntityTypeBuilder<CasualAvailability> b)
    {
        b.HasOne(x => x.CasualProfile).WithMany(x => x.Availability).HasForeignKey(x => x.CasualProfileId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.CasualProfileId, x.StartDateTime, x.EndDateTime });
    }
}

public class CasualZoneTransferConfiguration : IEntityTypeConfiguration<CasualZoneTransfer>
{
    public void Configure(EntityTypeBuilder<CasualZoneTransfer> b)
    {
        b.Property(x => x.Reason).HasMaxLength(500).IsRequired();
        b.HasOne(x => x.CasualProfile).WithMany(x => x.ZoneTransfers).HasForeignKey(x => x.CasualProfileId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.FromZone).WithMany().HasForeignKey(x => x.FromZoneId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ToZone).WithMany().HasForeignKey(x => x.ToZoneId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.CasualProfileId, x.TransferredAtUtc });
    }
}

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> b)
    {
        b.HasOne(x => x.Store).WithMany(x => x.Employees).HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        b.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        b.Property(x => x.BaseHourlyRate).HasPrecision(18, 2);
        b.HasIndex(x => x.UserId).IsUnique().HasFilter("[UserId] IS NOT NULL");
    }
}



public class EmployeeWorkPatternConfiguration : IEntityTypeConfiguration<EmployeeWorkPattern>
{
    public void Configure(EntityTypeBuilder<EmployeeWorkPattern> b)
    {
        b.HasOne(x => x.Employee)
            .WithMany(x => x.WorkPatterns)
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Property(x => x.ScheduledHours).HasPrecision(5, 2);
        b.HasIndex(x => new { x.EmployeeId, x.DayOfWeek }).IsUnique();
    }
}

public class EmployeeRosterEntryConfiguration : IEntityTypeConfiguration<EmployeeRosterEntry>
{
    public void Configure(EntityTypeBuilder<EmployeeRosterEntry> b)
    {
        b.HasOne(x => x.Store).WithMany().HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Employee).WithMany(x => x.RosterEntries).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        b.Property(x => x.HourlyRateSnapshot).HasPrecision(18, 2);
        b.Property(x => x.EstimatedCost).HasPrecision(18, 2);
    }
}

public class EmployeeAbsenceConfiguration : IEntityTypeConfiguration<EmployeeAbsence>
{
    public void Configure(EntityTypeBuilder<EmployeeAbsence> b)
    {
        b.HasOne(x => x.Store).WithMany().HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Employee).WithMany(x => x.Absences).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class BookingRequestConfiguration : IEntityTypeConfiguration<BookingRequest>
{
    public void Configure(EntityTypeBuilder<BookingRequest> b)
    {
        b.HasOne(x => x.Store).WithMany(x => x.Bookings).HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CasualProfile).WithMany(x => x.Bookings).HasForeignKey(x => x.CasualProfileId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.RequiredSkill).WithMany().HasForeignKey(x => x.RequiredSkillId).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.HourlyRateSnapshot).HasPrecision(18, 2);
        b.Property(x => x.EstimatedCost).HasPrecision(18, 2);
        b.Property(x => x.OverrideReason).HasMaxLength(500);
        b.Property(x => x.OverrideRuleCode).HasMaxLength(100);
        b.HasIndex(x => new { x.CasualProfileId, x.StartDateTime, x.EndDateTime });
    }
}

public class StoreBudgetConfiguration : IEntityTypeConfiguration<StoreBudget>
{
    public void Configure(EntityTypeBuilder<StoreBudget> b)
    {
        b.HasOne(x => x.Store).WithMany(x => x.Budgets).HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Cascade);
        b.Property(x => x.Amount).HasPrecision(18, 2);
        b.HasIndex(x => new { x.StoreId, x.BudgetDate }).IsUnique();
    }
}

public class RatingConfiguration : IEntityTypeConfiguration<Rating>
{
    public void Configure(EntityTypeBuilder<Rating> b)
    {
        b.HasOne(x => x.BookingRequest).WithOne(x => x.Rating).HasForeignKey<Rating>(x => x.BookingRequestId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Store).WithMany().HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CasualProfile).WithMany().HasForeignKey(x => x.CasualProfileId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => x.BookingRequestId).IsUnique();
    }
}

public class AreaManagerZoneAssignmentConfiguration : IEntityTypeConfiguration<AreaManagerZoneAssignment>
{
    public void Configure(EntityTypeBuilder<AreaManagerZoneAssignment> b)
    {
        b.HasOne(x => x.Zone).WithMany().HasForeignKey(x => x.ZoneId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.AreaManagerUserId, x.ZoneId }).IsUnique();
    }
}

public class PublicHolidayConfiguration : IEntityTypeConfiguration<PublicHoliday>
{
    public void Configure(EntityTypeBuilder<PublicHoliday> b)
    {
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.HasIndex(x => x.HolidayDate).IsUnique();
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Message).HasMaxLength(1000).IsRequired();
        b.HasIndex(x => new { x.UserId, x.IsRead });
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.Property(x => x.Action).HasMaxLength(100).IsRequired();
        b.Property(x => x.EntityName).HasMaxLength(100).IsRequired();
        b.Property(x => x.EntityId).HasMaxLength(100);
        b.Property(x => x.Details).HasMaxLength(2000);
    }
}

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> b)
    {
        b.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        b.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        b.HasOne<Store>().WithMany().HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Restrict);
    }
}
