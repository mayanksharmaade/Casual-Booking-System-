using CasualBookingSystem.Application.DTOs;
using CasualBookingSystem.Domain.Enums;
namespace CasualBookingSystem.Application.Interfaces;
public interface IUserAccountService
{
    Task<AuthResponse?> LoginAsync(string email, string password);
    Task<Guid> CreateUserAsync(string email, string password, string firstName, string lastName, UserRole role, RegistrationStatus approvalStatus, int? storeId = null);
    Task<UserAccountDto?> GetByIdAsync(Guid userId);
    Task<IReadOnlyList<UserAccountDto>> GetPendingAsync();
    Task<IReadOnlyList<UserAccountDto>> GetAllAsync();
    Task<int> CountByRoleAsync(UserRole role, RegistrationStatus? status = null);
    Task<int> CountActiveAsync();
    Task SetApprovalAsync(Guid userId, RegistrationStatus status);
    Task SetActiveAsync(Guid userId, bool isActive);
    Task<bool> IsApprovedAndActiveAsync(Guid userId);
}
