using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CasualBookingSystem.Application.Common;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CasualBookingSystem.Infrastructure.Identity;

public class UserAccountService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IOptions<JwtSettings> jwtOptions) : IUserAccountService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;

    public async Task<AuthResponse?> LoginAsync(string email, string password)
    {
        var normalizedEmail = email.Trim();
        var user = await userManager.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail);

        if (user is null || !user.IsActive || user.ApprovalStatus != RegistrationStatus.Approved)
            return null;

        var result = await signInManager.CheckPasswordSignInAsync(user, password, true);
        if (!result.Succeeded) return null;

        var token = CreateToken(user);
        return new AuthResponse(token, user.Id, user.Email!, user.PrimaryRole.ToString(), $"{user.FirstName} {user.LastName}", user.StoreId);
    }

    public async Task<Guid> CreateUserAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        UserRole role,
        RegistrationStatus approvalStatus,
        int? storeId = null)
    {
        var normalizedEmail = email.Trim();

        if (await userManager.FindByEmailAsync(normalizedEmail) is not null)
            throw new BusinessRuleException("Email is already registered.");

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            PrimaryRole = role,
            ApprovalStatus = approvalStatus,
            IsActive = approvalStatus == RegistrationStatus.Approved,
            StoreId = storeId,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new BusinessRuleException(string.Join("; ", result.Errors.Select(x => x.Description)));

        var roleResult = await userManager.AddToRoleAsync(user, role.ToString());
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            throw new BusinessRuleException(string.Join("; ", roleResult.Errors.Select(x => x.Description)));
        }

        return user.Id;
    }

    public async Task<UserAccountDto?> GetByIdAsync(Guid userId)
    {
        var u = await userManager.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId);
        return u is null ? null : ToDto(u);
    }

    public async Task<IReadOnlyList<UserAccountDto>> GetAllAsync() =>
        (await userManager.Users.AsNoTracking().OrderBy(x => x.Email).ToListAsync()).Select(ToDto).ToList();

    public async Task<IReadOnlyList<UserAccountDto>> GetPendingAsync() =>
        (await userManager.Users.AsNoTracking()
            .Where(x => x.ApprovalStatus == RegistrationStatus.Pending)
            .OrderBy(x => x.Email)
            .ToListAsync())
        .Select(ToDto)
        .ToList();

    public Task<int> CountByRoleAsync(UserRole role, RegistrationStatus? status = null) =>
        userManager.Users.CountAsync(x => x.PrimaryRole == role && (!status.HasValue || x.ApprovalStatus == status.Value));

    public Task<int> CountActiveAsync() => userManager.Users.CountAsync(x => x.IsActive);

    public async Task SetApprovalAsync(Guid userId, RegistrationStatus status)
    {
        var u = await userManager.FindByIdAsync(userId.ToString()) ?? throw new BusinessRuleException("User not found.");
        u.ApprovalStatus = status;
        var result = await userManager.UpdateAsync(u);
        if (!result.Succeeded)
            throw new BusinessRuleException(string.Join("; ", result.Errors.Select(x => x.Description)));
    }

    public async Task SetActiveAsync(Guid userId, bool isActive)
    {
        var u = await userManager.FindByIdAsync(userId.ToString()) ?? throw new BusinessRuleException("User not found.");
        u.IsActive = isActive;
        var result = await userManager.UpdateAsync(u);
        if (!result.Succeeded)
            throw new BusinessRuleException(string.Join("; ", result.Errors.Select(x => x.Description)));
    }

    public Task<bool> IsApprovedAndActiveAsync(Guid userId) =>
        userManager.Users.AnyAsync(x => x.Id == userId && x.IsActive && x.ApprovalStatus == RegistrationStatus.Approved);

    private string CreateToken(ApplicationUser user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, user.PrimaryRole.ToString()),
            new Claim("storeId", user.StoreId?.ToString() ?? string.Empty)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(_jwt.Issuer, _jwt.Audience, claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes), signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserAccountDto ToDto(ApplicationUser u) =>
        new(u.Id, u.Email!, u.FirstName, u.LastName, u.PrimaryRole, u.ApprovalStatus, u.IsActive, u.StoreId);
}
