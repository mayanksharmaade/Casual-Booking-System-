using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Domain.Enums;
using CasualBookingSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CasualBookingSystem.Infrastructure.Data;
public class DatabaseSeeder(ApplicationDbContext db, RoleManager<IdentityRole<Guid>> roles, UserManager<ApplicationUser> users, IConfiguration configuration)
{
    public async Task SeedAsync()
    {
        foreach (var roleName in Enum.GetNames<UserRole>()) if (!await roles.RoleExistsAsync(roleName)) await roles.CreateAsync(new IdentityRole<Guid>(roleName));
        var email = configuration["Seed:SuperAdminEmail"] ?? "superadmin@casualbooking.local";
        var password = configuration["Seed:SuperAdminPassword"] ?? "ChangeMe123!";
        var admin = await users.FindByEmailAsync(email);
        if (admin is null)
        {
            admin = new ApplicationUser { Id = Guid.NewGuid(), UserName = email, Email = email, EmailConfirmed = true, FirstName = "Super", LastName = "Admin", PrimaryRole = UserRole.SuperAdmin, ApprovalStatus = RegistrationStatus.Approved, IsActive = true };
            var result = await users.CreateAsync(admin, password); if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description))); await users.AddToRoleAsync(admin, UserRole.SuperAdmin.ToString());
        }
        var skillNames = new[]
{
    "Customer Service",
    "Cash Handling",
    "Stock Replenishment",
    "Visual Merchandising",
    "Tagging",
    "Pricing",
    "Sorting",
    "Bins / Bin Management",
    "Answering Phone Calls",
    "Bric-a-Brac",
    "Donations Processing",
    "Clothing Rack Management",
    "Furniture Handling",
    "Cleaning / Store Presentation",
    "POS / Checkout",
    "Online Orders / Click & Collect",
    "Receiving Stock",
    "Backroom Organisation",
    "Basic Admin",
    "Volunteer Coordination"
};

        var existingSkills = await db.Skills
            .Select(x => x.Name)
            .ToListAsync();

        var newSkills = skillNames
            .Where(name => !existingSkills.Contains(name))
            .Select(name => new Skill
            {
                Name = name,
                IsActive = true
            })
            .ToList();

        if (newSkills.Count > 0)
        {
            db.Skills.AddRange(newSkills);
            await db.SaveChangesAsync();
        }
    }
}
