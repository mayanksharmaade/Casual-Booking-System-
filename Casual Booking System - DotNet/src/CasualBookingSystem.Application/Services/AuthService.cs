using CasualBookingSystem.Application.Common;
using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Application.Interfaces;
using CasualBookingSystem.Domain.Entities;
using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.Services;

public class AuthService(
    IUserAccountService users,
    ICasualRepository casuals,
    IStoreRepository stores,
    IZoneRepository zones) : IAuthService
{
    public Task<AuthResponse?> LoginAsync(LoginRequest request) =>
        users.LoginAsync(request.Email, request.Password);

    public async Task RegisterCasualAsync(RegisterCasualRequest request)
    {
        var zone = await zones.GetByIdAsync(request.ZoneId)
            ?? throw new BusinessRuleException("Selected zone does not exist.");

        if (!zone.IsActive)
            throw new BusinessRuleException("Selected zone is not active.");

        var userId = await users.CreateUserAsync(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            UserRole.Casual,
            RegistrationStatus.Pending);

        await casuals.AddAsync(new CasualProfile
        {
            UserId = userId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone.Trim(),
            City = request.City.Trim(),
            CurrentZoneId = request.ZoneId,
            RegistrationStatus = RegistrationStatus.Pending,
            IsActive = false
        });

        await casuals.SaveChangesAsync();
    }

    public async Task RegisterAreaManagerAsync(RegisterAreaManagerRequest request)
    {
        await users.CreateUserAsync(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            UserRole.AreaManager,
            RegistrationStatus.Pending);
    }

    public async Task RegisterStoreAsync(RegisterStoreRequest request)
    {
        if (await stores.CodeExistsAsync(request.StoreCode.Trim()))
            throw new BusinessRuleException("Store code already exists.");

        var zone = await zones.GetByIdAsync(request.ZoneId)
            ?? throw new BusinessRuleException("Zone does not exist.");

        if (!zone.IsActive)
            throw new BusinessRuleException("Selected zone is not active.");

        var store = new Store
        {
            Code = request.StoreCode.Trim(),
            Name = request.StoreName.Trim(),
            City = request.City.Trim(),
            Address = request.Address?.Trim(),
            ZoneId = request.ZoneId,
            RegistrationStatus = RegistrationStatus.Pending,
            IsActive = false
        };

        await stores.AddAsync(store);
        await stores.SaveChangesAsync();

        await users.CreateUserAsync(
            request.Email,
            request.Password,
            request.ManagerFirstName,
            request.ManagerLastName,
            UserRole.StoreManager,
            RegistrationStatus.Pending,
            store.Id);
    }
}
