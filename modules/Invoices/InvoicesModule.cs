using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ShipMvp.Core.Modules;
using ShipMvp.Core.Attributes;

namespace Invoices;

[Module]
public sealed class InvoicesModule : IModule
{
    public void ConfigureServices(IServiceCollection services)
    {
        // Register controllers so HostModule can map controllers/endpoints
        services.AddControllers()
            .AddApplicationPart(typeof(InvoicesModule).Assembly);

        // Register repository (using IDbContext, not AppDbContext)
        services.AddScoped<Invoices.Domain.IInvoiceRepository, Invoices.Infrastructure.Data.InvoiceRepository>();
        
        // Register application service
        services.AddTransient<Invoices.Application.IInvoiceService, Invoices.Application.InvoiceService>();
    }

    public void Configure(IApplicationBuilder app, IHostEnvironment env)
    {
        // Configure middleware for the module here
    }
}
