using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Application.DTOs;

public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, Guid UserId, string Email, string Role, string DisplayName, int? StoreId);

public record RegisterCasualRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Phone,
    string City,
    int ZoneId);

public record RegisterAreaManagerRequest(string Email, string Password, string FirstName, string LastName);

public record RegisterStoreRequest(
    string Email,
    string Password,
    string ManagerFirstName,
    string ManagerLastName,
    string StoreCode,
    string StoreName,
    string City,
    string? Address,
    int ZoneId);

public record UserAccountDto(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    UserRole Role,
    RegistrationStatus ApprovalStatus,
    bool IsActive,
    int? StoreId);
