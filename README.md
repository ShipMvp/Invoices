# Backend (ShipMVP)

Production-ready **.NET 9** backend using **Clean Architecture**, **EF Core + PostgreSQL**, and **modular plug-ins**.
This repo consumes the **ShipMVP** backend as a **Git submodule** in `/shipmvp` and keeps your app code separate and fully editable.

---

## Contents

- [Backend (ShipMVP)](#backend-shipmvp)
  - [Contents](#contents)
  - [Architecture](#architecture)
  - [Folder structure](#folder-structure)
  - [Prerequisites](#prerequisites)
  - [Quick start](#quick-start)
  - [Configuration](#configuration)
  - [Migrations](#migrations)
  - [Modules (how to add features)](#modules-how-to-add-features)
  - [Requests \& examples](#requests--examples)
  - [Troubleshooting](#troubleshooting)
  - [Do not edit `/shipmvp`](#do-not-edit-shipmvp)

---

## Architecture

* **Single database** for all modules (PostgreSQL).
* **One `AppDbContext`** (in `/shipmvp`) scans all assemblies for `IEntityTypeConfiguration<>` and composes the model at runtime.
* **Modules** live outside `/shipmvp`. Each implements:

  * Entities + `IEntityTypeConfiguration<>`
  * An `IShipMvpModule` to register services and map endpoints.
* **Migrations** live in your **`Invoice.Migrations`** project (not in `/shipmvp`).
* **Host API** (`Invoice.Api`) wires the DbContext, discovers modules, and exposes Swagger.

---

## Folder structure

```
apps/
  backend/
    Invoice.Api/            # Host API (runs the app)
      Program.cs              # DbContext wiring + module discovery + Swagger
      AppDbContextFactory.cs  # EF design-time factory (points to migrations assembly)
      appsettings.json        # ConnectionStrings:Default
    Invoice.Migrations/     # EF Core migrations project
      Migrations/             # Generated after first migration
modules/
  Billing/
    Domain/                   # Entities
      Invoice.cs
    Infrastructure/           # EF configurations
      InvoiceConfig.cs        # IEntityTypeConfiguration<Invoice>
    BillingModule.cs          # IShipMvpModule (endpoints/DI)

shipmvp/                      # <Git submodule; do not edit>
  backend/src/
    ShipMvp.Abstractions/     # IShipMvpModule interface
    ShipMvp.Modularity/       # ModuleLoader (discovers & maps modules)
    ShipMvp.Infrastructure/   # AppDbContext (scans configurations)
```

---

## Prerequisites

* .NET 9 SDK
* Docker (for local Postgres)
* (Optional) `psql` CLI for debugging

---

## Quick start

1. **Start PostgreSQL** (data persists in a Docker volume):

```bash
docker run --name shipmvp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=ShipMVPPass123! \
  -e POSTGRES_DB=shipmvp \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -p 5432:5432 \
  -v shipmvp-postgres-data:/var/lib/postgresql/data \
  --restart unless-stopped \
  -d postgres:latest
```

2. **Create the initial migration & update DB**:

```bash
dotnet ef migrations add Initial \
  --project apps/backend/Invoice.Migrations \
  --startup-project apps/backend/Invoice.Api \
  --context AppDbContext

dotnet ef database update \
  --project apps/backend/Invoice.Migrations \
  --startup-project apps/backend/Invoice.Api \
  --context AppDbContext
```

3. **Run the API**:

```bash
dotnet run --project apps/backend/Invoice.Api
```

* Swagger: `http://localhost:5000/swagger`
* Health ping: `GET /` → `{"value":"Invoice API running"}`

---

## Configuration

`apps/backend/Invoice.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=shipmvp;Username=postgres;Password=ShipMVPPass123!"
  }
}
```

Override via environment variable:

```
ConnectionStrings__Default=Host=...;Port=5432;Database=...;Username=...;Password=...
```

The host API points migrations to the **Invoice.Migrations** assembly:

```csharp
opts.UseNpgsql(cs, b => b.MigrationsAssembly("Invoice.Migrations"));
```

---

## Migrations

* Keep **all migrations** in `apps/backend/Invoice.Migrations/`.
* The **design-time factory** in `Invoice.Api` ensures EF sees all module mappings.
* Typical flow when you add/change entities in any module:

```bash
dotnet ef migrations add AddBillingModule \
  --project apps/backend/Invoice.Migrations \
  --startup-project apps/backend/Invoice.Api \
  --context AppDbContext

dotnet ef database update \
  --project apps/backend/Invoice.Migrations \
  --startup-project apps/backend/Invoice.Api \
  --context AppDbContext
```

> Tip: Use **schemas per module** (e.g., `ToTable("Invoices", "billing")`) to keep the single DB tidy.

---

## Modules (how to add features)

1. **Create a module** under `modules/<Name>/` with:

   * `Domain/<Entity>.cs`
   * `Infrastructure/<Entity>Config.cs` (implements `IEntityTypeConfiguration<>`)
   * `<Name>Module.cs` (implements `IShipMvpModule`)

2. **Reference** projects:

   * `Invoice.Api` → reference your module project
   * Your module project → reference `shipmvp/backend/src/ShipMvp.Abstractions`

3. **Minimal examples**

**Entity**

```csharp
// modules/Billing/Domain/Invoice.cs
public class Invoice
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = default!;
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

**EF mapping**

```csharp
// modules/Billing/Infrastructure/InvoiceConfig.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class InvoiceConfig : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> b)
    {
        b.ToTable("Invoices", "billing");
        b.HasKey(x => x.Id);
        b.Property(x => x.CustomerName).HasMaxLength(200).IsRequired();
        b.Property(x => x.Amount).HasColumnType("numeric(18,2)");
        b.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
    }
}
```

**Endpoints**

```csharp
// modules/Billing/BillingModule.cs
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShipMvp.Abstractions;
using ShipMvp.Infrastructure;

public sealed class BillingModule : IShipMvpModule
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

No extra wiring required: `ShipMvp.Modularity` discovers all `IShipMvpModule` implementations at startup and maps them automatically.

---

## Requests & examples

Create an invoice:

```bash
curl -X POST http://localhost:5000/api/billing/invoices \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Acme","amount":100.0}'
```

List invoices:

```bash
curl http://localhost:5000/api/billing/invoices
```

Get by id:

```bash
curl http://localhost:5000/api/billing/invoices/<guid>
```

---

## Troubleshooting

**DB not reachable**

```bash
docker ps | grep shipmvp-postgres
docker logs shipmvp-postgres
```

**Reset local DB (⚠ deletes data)**

```bash
docker rm -f shipmvp-postgres
docker volume rm shipmvp-postgres-data
# then re-run docker run ... from Quick start
```

**No model changes detected**

* Ensure `Invoice.Api` **references your module** project.
* Make sure your EF configs implement `IEntityTypeConfiguration<>` and are in a loaded assembly.
* Clean & rebuild: `dotnet clean && dotnet build`.

**Drops in migration you didn’t expect**

* Removing/renaming modules can generate drop operations. Review the migration and remove unintended drops before `database update`.

---

## Do not edit `/shipmvp`

`/shipmvp` is a **Git submodule**. Update it by bumping the submodule reference, not by editing files.

Manual bump:

```bash
git -C shipmvp fetch --tags origin
git -C shipmvp checkout stable     # or a specific tag, e.g., v0.3.0
git add shipmvp
git commit -m "chore(shipmvp): bump backend template"
```

CI guard (already included) blocks PRs that change `/shipmvp/*`.