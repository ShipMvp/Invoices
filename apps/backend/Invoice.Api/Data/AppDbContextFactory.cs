using ShipMvp.Application.Infrastructure.Data;

namespace Invoice.Api.Data;

public sealed class AppDbContextFactory : BaseAppDbContextFactory<InvoiceDbContext>
{
    public override InvoiceDbContext CreateDbContext(string[] args)
    {
        var options = GetOptions();
        return new InvoiceDbContext(options);
    }
}
