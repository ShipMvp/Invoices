using Microsoft.EntityFrameworkCore;
using ShipMvp.Domain.Integrations;
using ShipMvp.Application.Infrastructure.Integrations.Data.Configurations;


public static class ModelBuilderExtensions
{
    public static void ConfigureInvoiceEntities(this ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new InvoiceConfig());
    }
} 