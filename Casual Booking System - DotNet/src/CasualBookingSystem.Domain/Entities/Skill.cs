using CasualBookingSystem.Domain.Common;
namespace CasualBookingSystem.Domain.Entities;
public class Skill : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<CasualSkill> Casuals { get; set; } = new List<CasualSkill>();
}
