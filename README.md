# Invoice Management System

A complete invoice management system built with **.NET 9**, **React**, and **PostgreSQL**, using **Clean Architecture** and **modular design**.
Features a RESTful API, React frontend, and command-line tools for data management. Built on the **ShipMVP** framework as a Git submodule.

---

## Contents

- [Invoice Management System](#invoice-management-system)
  - [Contents](#contents)
  - [Architecture](#architecture)
  - [Folder structure](#folder-structure)
  - [Prerequisites](#prerequisites)
  - [Quick start](#quick-start)
  - [Configuration](#configuration)
  - [Migrations](#migrations)
  - [Modules (how to add features)](#modules-how-to-add-features)
  - [Command Line Interface (CLI)](#command-line-interface-cli)
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
      Program.cs              # Application startup and module discovery
      Data/
        InvoiceDbContext.cs   # Application-specific DbContext
        InvoiceDbModule.cs    # Database module configuration
      appsettings.json        # ConnectionStrings:Default
    Invoice.CLI/            # Command-line interface tool
      Program.cs              # CLI host with commands (seed-data, run-sql, etc.)
      appsettings.json        # CLI configuration
  frontend/                 # React frontend application (Vite + TypeScript)
modules/
  Invoices/                 # Invoice management module
    Domain/                   # Domain entities and interfaces
      Invoice.cs              # Invoice entity
      InvoiceItem.cs          # Invoice item entity
    Application/              # Application services and DTOs
    Infrastructure/           # Data access and repositories
    Controllers/              # API controllers
    InvoicesModule.cs         # Module registration

shipmvp/                      # <Git submodule; do not edit>
  ShipMvp.Api/              # API framework
  ShipMvp.Application/      # Application infrastructure
  ShipMvp.Core/             # Core abstractions and entities
  ShipMvp.CLI/              # CLI command framework
  ShipMvp.Domain/           # Domain framework
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
  --project apps/backend/Invoice.Api \
  --context InvoiceDbContext

dotnet ef database update \
  --project apps/backend/Invoice.Api \
  --context InvoiceDbContext
```

3. **Run the API**:

```bash
dotnet run --project apps/backend/Invoice.Api
```

* Swagger: `http://localhost:5066/swagger`
* Health ping: `GET /` → `{"value":"Invoice API running"}`
* Frontend: `http://localhost:5173` (when running frontend)

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

* **Entity Framework migrations** are managed through the Invoice.Api project.
* The **InvoiceDbContext** scans all module assemblies for entity configurations.
* Typical flow when you add/change entities in any module:

```bash
dotnet ef migrations add AddInvoiceFeature \
  --project apps/backend/Invoice.Api \
  --context InvoiceDbContext

dotnet ef database update \
  --project apps/backend/Invoice.Api \
  --context InvoiceDbContext
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
// modules/Invoices/Domain/Invoice.cs
using ShipMvp.Core.Entities;

public class Invoice : AggregateRoot<Guid>
{
    public string CustomerName { get; set; } = default!;
    public decimal TotalAmount { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public List<InvoiceItem> Items { get; set; } = new();
}
```

**Repository**

```csharp
// modules/Invoices/Infrastructure/InvoiceRepository.cs
using ShipMvp.Core.Persistence;

public class InvoiceRepository : IInvoiceRepository
{
    private readonly IDbContext _context;

    public InvoiceRepository(IDbContext context)
    {
        _context = context;
    }

    public async Task<Invoice?> GetByIdAsync(Guid id)
    {
        return await _context.Set<Invoice>()
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
    }
}
```

**Controller**

```csharp
// modules/Invoices/Controllers/InvoicesController.cs
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
    {
        var invoices = await _invoiceService.GetAllAsync();
        return Ok(invoices);
    }

    [HttpPost]
    public async Task<ActionResult<Invoice>> CreateInvoice(CreateInvoiceRequest request)
    {
        var invoice = await _invoiceService.CreateAsync(request);
        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
    }
}
```

**Module Registration**

```csharp
// modules/Invoices/InvoicesModule.cs
using ShipMvp.Core.Modules;

[Module]
public class InvoicesModule : IModule
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        
        // Enable controller discovery
        services.AddControllers()
            .AddApplicationPart(typeof(InvoicesModule).Assembly);
    }

    public void Configure(IApplicationBuilder app, IHostEnvironment env)
    {
        // Module-specific configuration
    }
}
```

Controllers are automatically discovered from module assemblies using `.AddApplicationPart()`.

---


---

## Command Line Interface (CLI)

The Invoice.CLI provides command-line tools for database management and administrative tasks.

### Available Commands

```bash
cd apps/backend/Invoice.CLI

# Show all available commands
dotnet run

# Seed initial application data (users, subscription plans, etc.)
dotnet run seed-data

# Seed integration platform configurations
dotnet run seed-integrations

# Execute custom SQL queries
dotnet run run-sql "SELECT * FROM Invoices"

# Show detailed help
dotnet run help
```

### CLI Features

* **Database Management**: Seed data, run migrations, execute queries
* **Integration Setup**: Configure external service integrations
* **Administrative Tasks**: User management, system maintenance
* **Development Tools**: Database inspection and debugging

### CLI Architecture

* **Framework**: Built on ShipMvp.CLI command framework
* **Dependency Injection**: Inherits all services from Invoice.Api
* **Database Access**: Uses same InvoiceDbContext as the main application
* **Modular Commands**: Extensible command system with automatic discovery

## Requests & examples

Create an invoice:

```bash
curl -X POST http://localhost:5066/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Acme Corp",
    "totalAmount": 1500.00,
    "status": "Draft",
    "items": [
      {
        "description": "Consulting Services",
        "amount": 1500.00
      }
    ]
  }'
```

List invoices:

```bash
curl http://localhost:5066/api/invoices
```

Get by id:

```bash
curl http://localhost:5066/api/invoices/<guid>
```

Mark invoice as paid:

```bash
curl -X POST http://localhost:5066/api/invoices/<guid>/mark-as-paid
```

Update invoice:

```bash
curl -X PUT http://localhost:5066/api/invoices/<guid> \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Updated Customer Name",
    "totalAmount": 2000.00,
    "status": "Sent"
  }'
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