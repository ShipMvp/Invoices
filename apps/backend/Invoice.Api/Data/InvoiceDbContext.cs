using Microsoft.EntityFrameworkCore;

using ShipMvp.Application.Infrastructure.Data;
using Invoices.Infrastructure;

namespace Invoice.Api.Data;

public sealed class InvoiceDbContext : AppDbContext
{
    public InvoiceDbContext(DbContextOptions<InvoiceDbContext> options) : base(options)
    {
    }

    public override void ConfigureModules(ModelBuilder modelBuilder)
    {
        base.ConfigureModules(modelBuilder);
        modelBuilder.ConfigureInvoiceEntities();
    }
    
}
