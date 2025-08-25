using Microsoft.EntityFrameworkCore;
using ShipMvp.Application.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// One DB for all modules; migrations in Invoice.Migrations
builder.Services.AddDbContext<AppDbContext>(opts =>
{
    var cs = builder.Configuration.GetConnectionString("Default")
          ?? "Host=localhost;Port=5432;Database=shipmvp;Username=postgres;Password=ShipMVPPass123!";
    opts.UseNpgsql(cs, b => b.MigrationsAssembly("Invoice.Migrations"));
});

builder.AddDiscoveredModules(); // auto-wires modules implementing IShipMvpModule

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Ok("Invoice API running"));
app.MapDiscoveredModules();

app.UseHttpsRedirection();

app.Run();
