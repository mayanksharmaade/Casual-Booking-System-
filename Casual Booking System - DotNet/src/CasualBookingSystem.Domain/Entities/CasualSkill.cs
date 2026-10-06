namespace CasualBookingSystem.Domain.Entities;
public class CasualSkill
{
    public int CasualProfileId { get; set; }
    public CasualProfile? CasualProfile { get; set; }
    public int SkillId { get; set; }
    public Skill? Skill { get; set; }
}
