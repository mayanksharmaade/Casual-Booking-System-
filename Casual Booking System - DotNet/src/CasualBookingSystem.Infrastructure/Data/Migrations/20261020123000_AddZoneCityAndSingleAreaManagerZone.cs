using CasualBookingSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasualBookingSystem.Infrastructure.Data.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261020123000_AddZoneCityAndSingleAreaManagerZone")]
public partial class AddZoneCityAndSingleAreaManagerZone : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Zones_Name", table: "Zones");

        migrationBuilder.AddColumn<string>(
            name: "City", table: "Zones", type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "");

        migrationBuilder.Sql(@"
UPDATE z
SET City = COALESCE(NULLIF(s.City, ''), 'Unassigned')
FROM Zones z
OUTER APPLY (
    SELECT TOP 1 City FROM Stores s WHERE s.ZoneId = z.Id AND City IS NOT NULL AND City <> '' ORDER BY s.Id
) s;
UPDATE Zones SET City = 'Unassigned' WHERE City = '';
");

        migrationBuilder.CreateIndex(
            name: "IX_Zones_City_Name", table: "Zones", columns: new[] { "City", "Name" }, unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Zones_City_Name", table: "Zones");
        migrationBuilder.DropColumn(name: "City", table: "Zones");
        migrationBuilder.CreateIndex(name: "IX_Zones_Name", table: "Zones", column: "Name", unique: true);
    }
}
