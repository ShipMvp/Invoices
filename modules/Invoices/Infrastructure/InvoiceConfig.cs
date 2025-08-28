using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Invoices.Domain;

namespace Invoices.Infrastructure;

public sealed class InvoiceConfig : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> b)
    {
        b.ToTable("Invoices", "Invoice"); // per-module schema
        b.HasKey(x => x.Id);
        b.Property(x => x.CustomerName).HasMaxLength(200).IsRequired();
        b.Property(x => x.TotalAmount).HasColumnType("numeric(18,2)");
        b.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
        b.Property(x => x.Status).HasMaxLength(50).IsRequired();

        b.HasMany(x => x.Items)
            .WithOne()
            .HasForeignKey(i => i.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}