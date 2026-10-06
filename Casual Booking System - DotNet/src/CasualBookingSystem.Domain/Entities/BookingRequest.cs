using CasualBookingSystem.Domain.Common;
using CasualBookingSystem.Domain.Enums;

namespace CasualBookingSystem.Domain.Entities;

public class BookingRequest : BaseEntity
{
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public int CasualProfileId { get; set; }
    public CasualProfile? CasualProfile { get; set; }
    public Guid RequestedByUserId { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime? ExpiresAtUtc { get; set; }
    public decimal HourlyRateSnapshot { get; set; }
    public decimal EstimatedCost { get; set; }
    public int? RequiredSkillId { get; set; }
    public Skill? RequiredSkill { get; set; }
    public bool IsEmergency { get; set; }
    public Guid? OverrideApprovedByUserId { get; set; }
    public string? OverrideReason { get; set; }
    public string? OverrideRuleCode { get; set; }
    public DateTime? AcceptedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }
    public Guid? CancelledByUserId { get; set; }
    public string? CancellationReason { get; set; }
    public string? DeclineReason { get; set; }
    public Rating? Rating { get; set; }
}
