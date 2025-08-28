<!-- cleaned and consolidated new-project.md -->
<!-- New project - Invoice -->

# New project - Invoice

This document provides a compact, step-by-step setup for a new Invoice project that builds on the ShipMvp submodule.

## Prerequisites

- .NET SDK (6/7+)
- git
- PostgreSQL (for local development) or any provider supported by Npgsql

## 1. Create repository, solution and add the ShipMvp submodule

Run these commands from the repo root (PowerShell or bash):

```bash
dotnet new sln -n Invoice

git submodule add -b stable https://github.com/shipmvp/shipmvp shipmvp
git submodule update --init --recursive

mkdir -p apps/backend apps/frontend modules

SLN=Invoice.sln
dotnet sln "$SLN" add shipmvp/ShipMvp.Api/ShipMvp.Api.csproj --solution-folder "shipmvp"
dotnet sln "$SLN" add shipmvp/ShipMvp.Application/ShipMvp.Application.csproj --solution-folder "shipmvp"
dotnet sln "$SLN" add shipmvp/ShipMvp.Core/ShipMvp.Core.csproj --solution-folder "shipmvp"
dotnet sln "$SLN" add shipmvp/ShipMvp.Domain/ShipMvp.Domain.csproj --solution-folder "shipmvp"
dotnet sln "$SLN" add shipmvp/ShipMvp.SourceGenerators/ShipMvp.SourceGenerators.csproj --solution-folder "shipmvp"
dotnet sln "$SLN" add shipmvp/ShipMvp.Integration.SemanticKernel/ShipMvp.Integration.SemanticKernel.csproj --solution-folder "shipmvp"
```

Add additional ShipMvp projects as needed (for example `ShipMvp.AppHost`).

## 2. Create backend projects

### Host API

```bash
dotnet new webapi -n Invoice.Api -o apps/backend/Invoice.Api
dotnet sln add apps/backend/Invoice.Api/Invoice.Api.csproj
```

### Migrations project

```bash
dotnet new classlib -n Invoice.Migrations -o apps/backend/Invoice.Migrations
dotnet sln add apps/backend/Invoice.Migrations/Invoice.Migrations.csproj
```

### Sample module (Invoice)

```bash
dotnet new classlib -n Invoice -o modules/Invoice
dotnet sln add modules/Invoice/Invoice.csproj
```

## Wire references

Host API should reference ShipMvp infrastructure and your modules. Modules should reference ShipMvp core/abstractions as needed.

```bash
dotnet add apps/backend/Invoice.Api/Invoice.Api.csproj reference \
  shipmvp/ShipMvp.Application/ShipMvp.Application.csproj \
  shipmvp/ShipMvp.Core/ShipMvp.Core.csproj \
  modules/Invoice/Invoice.csproj

dotnet add modules/Invoice/Invoice.csproj reference \
  shipmvp/ShipMvp.Core/ShipMvp.Core.csproj
```

If you manage EF tooling centrally, skip the per-project package commands. Otherwise, add Npgsql/EF packages:

```bash
dotnet add apps/backend/Invoice.Api package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add apps/backend/Invoice.Api package Microsoft.EntityFrameworkCore.Design
dotnet add apps/backend/Invoice.Migrations package Microsoft.EntityFrameworkCore.Design
dotnet add apps/backend/Invoice.Migrations package Npgsql.EntityFrameworkCore.PostgreSQL
```

## 3. Host API: example Program.cs and DbContext factory

File: `apps/backend/Invoice.Api/Program.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using ShipMvp.Infrastructure; // AppDbContext (from submodule)
using ShipMvp.Modularity;    // ModuleLoader (from submodule)

var builder = WebApplication.CreateBuilder(args);

// One DB for all modules; migrations live in Invoice.Migrations
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

app.Run();
```

File: `apps/backend/Invoice.Api/AppDbContextFactory.cs` (design-time factory)

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using ShipMvp.Infrastructure;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var cfg = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var cs = cfg.GetConnectionString("Default")
               ?? "Host=localhost;Port=5432;Database=shipmvp;Username=postgres;Password=ShipMVPPass123!";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(cs, b => b.MigrationsAssembly("Invoice.Migrations"))
            .Options;

        return new AppDbContext(options);
    }
}
```

File: `apps/backend/Invoice.Api/appsettings.json`

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=shipmvp;Username=postgres;Password=ShipMVPPass123!"
  }
}
```

## 4. Sample backend module (entities, configuration, endpoints)

File: `modules/Invoice/Domain/Invoice.cs`

```csharp
public class Invoice
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = default!;
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

File: `modules/Invoice/Infrastructure/InvoiceConfig.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class InvoiceConfig : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> b)
    {
        b.ToTable("Invoices", "billing"); // per-module schema
        b.HasKey(x => x.Id);
        b.Property(x => x.CustomerName).HasMaxLength(200).IsRequired();
        b.Property(x => x.Amount).HasColumnType("numeric(18,2)");
        b.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
    }
}
```

File: `modules/Invoice/InvoiceModule.cs`

```csharp
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShipMvp.Abstractions;
using ShipMvp.Infrastructure;

public sealed class InvoiceModule : IShipMvpModule
{
    public void ConfigureServices(IServiceCollection services, IConfiguration config) { }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var g = endpoints.MapGroup("/api/billing/invoices");

        g.MapGet("/", async (AppDbContext db) =>
            await db.Set<Invoice>().OrderByDescending(x => x.CreatedAt).ToListAsync());

        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
            await db.Set<Invoice>().FindAsync(id) is { } inv ? Results.Ok(inv) : Results.NotFound());

        g.MapPost("/", async (AppDbContext db, Invoice dto) =>
        {
            dto.Id = Guid.NewGuid();
            dto.CreatedAt = DateTime.UtcNow;
            db.Add(dto);
            await db.SaveChangesAsync();
            return Results.Created($"/api/billing/invoices/{dto.Id}", dto);
        });
    }
}
```

## Notes

- Adjust connection strings and secrets for your environment (consider using user secrets or environment variables).
- Use `dotnet ef migrations add Initial --project apps/backend/Invoice.Migrations --startup-project apps/backend/Invoice.Api` to create migrations (requires EF CLI/tools).
- Keep ShipMvp submodule updated intentionally (use branch/tag strategy for stability).




docker run --name shipmvp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=ShipMVPPass123! \
  -e POSTGRES_DB=shipmvp \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -p 5432:5432 \
  -v shipmvp-postgres-data:/var/lib/postgresql/data \
  --restart unless-stopped \
  -d postgres:latest


# from repo root (or the API folder)
dotnet ef migrations add Initial \
  --startup-project apps/backend/Invoice.Api \
  --context InvoiceDbContext

dotnet ef database update \
  --project apps/backend/Invoice.Api



dotnet run --project 'apps/backend/Invoice.Api'
