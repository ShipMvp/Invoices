using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Invoices.Domain;
namespace Invoices.Infrastructure;

public sealed class InvoiceItemConfig : IEntityTypeConfiguration<InvoiceItem>
{
    public void Configure(EntityTypeBuilder<InvoiceItem> b)
    {
        b.ToTable("InvoiceItems", "Invoice");
        b.HasKey(x => x.Id);
        b.Property(x => x.Description).HasMaxLength(500).IsRequired();
        b.Property(x => x.Amount).HasColumnType("numeric(18,2)");
    }
}
