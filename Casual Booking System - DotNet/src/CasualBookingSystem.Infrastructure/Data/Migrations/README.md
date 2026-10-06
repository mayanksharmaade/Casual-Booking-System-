# EF Core migrations

Migrations are intentionally generated on the developer machine so they exactly match the final EF Core model and local .NET 10 tooling.

From the solution root run:

```powershell
.\create-or-update-migration.ps1
```

The script:
1. restores and builds the solution,
2. installs `dotnet-ef` 10.0.0 if needed,
3. creates `InitialPhases1To6` when no migration exists, otherwise `AddPhases4To6`,
4. applies the migration with `dotnet ef database update`.

New Phase 4–6 schema includes:
- `AreaManagerZoneAssignments`
- `CasualZoneTransfers`
- `PublicHolidays`
- `CasualProfiles.CurrentZoneId`
- booking skill/emergency/override fields
- related indexes and foreign keys
