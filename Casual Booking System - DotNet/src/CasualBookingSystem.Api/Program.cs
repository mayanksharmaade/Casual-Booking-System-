
using CasualBookingSystem.Api.Middleware;
using CasualBookingSystem.Application;
using CasualBookingSystem.Infrastructure;
using CasualBookingSystem.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Application services
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger
builder.Services.AddSwaggerGen();

// CORS
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? new[] { "https://icy-mud-070b25600.4.azurestaticapps.net" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Middleware
app.UseMiddleware<ExceptionMiddleware>();

app.UseHttpsRedirection();

// Swagger in Development only
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Angular");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Lightweight API health endpoint
app.MapGet("/", () => Results.Ok(new
{
    application = "Casual Booking System API",
    status = "Running",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    timestamp = DateTime.UtcNow
}));

// Database seeding
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider
        .GetRequiredService<DatabaseSeeder>();

    await seeder.SeedAsync();
}

app.Run();
