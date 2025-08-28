using Microsoft.EntityFrameworkCore;
using ShipMvp.Domain.Integrations;
using ShipMvp.Application.Infrastructure.Integrations.Data.Configurations;
using Invoices.Domain;

namespace Invoices.Infrastructure;

public static class ModelBuilderExtensions
{
    public static void ConfigureInvoiceEntities(this ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new InvoiceConfig());
        modelBuilder.ApplyConfiguration(new InvoiceItemConfig());
    }
} 