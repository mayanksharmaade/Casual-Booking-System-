using CasualBookingSystem.Domain.Common;
namespace CasualBookingSystem.Domain.Entities;
public class StoreBudget : BaseEntity
{
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public DateOnly BudgetDate { get; set; }
    public decimal Amount { get; set; }
}
