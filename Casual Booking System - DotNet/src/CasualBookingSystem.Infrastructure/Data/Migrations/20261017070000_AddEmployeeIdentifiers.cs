using CasualBookingSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasualBookingSystem.Infrastructure.Data.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261017070000_AddEmployeeIdentifiers")]
public partial class AddEmployeeIdentifiers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "EmployeeCode",
            table: "Employees",
            type: "nvarchar(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.Sql("UPDATE [Employees] SET [EmployeeCode] = CONCAT('LEGACY-', [Id]) WHERE [EmployeeCode] IS NULL OR LTRIM(RTRIM([EmployeeCode])) = ''");

        migrationBuilder.AlterColumn<string>(
            name: "EmployeeCode",
            table: "Employees",
            type: "nvarchar(50)",
            maxLength: 50,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "nvarchar(50)",
            oldMaxLength: 50,
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Employees_EmployeeCode",
            table: "Employees",
            column: "EmployeeCode",
            unique: true);

        migrationBuilder.AddColumn<string>(
            name: "EmployeeCode",
            table: "AspNetUsers",
            type: "nvarchar(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_AspNetUsers_EmployeeCode",
            table: "AspNetUsers",
            column: "EmployeeCode",
            unique: true,
            filter: "[EmployeeCode] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Employees_EmployeeCode", table: "Employees");
        migrationBuilder.DropIndex(name: "IX_AspNetUsers_EmployeeCode", table: "AspNetUsers");
        migrationBuilder.DropColumn(name: "EmployeeCode", table: "Employees");
        migrationBuilder.DropColumn(name: "EmployeeCode", table: "AspNetUsers");
    }
}
