using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ShipMvp.Api;
using ShipMvp.Api.Auth;
using ShipMvp.Application;
using ShipMvp.Core;
using ShipMvp.Core.Attributes;
using ShipMvp.Core.Modules;
using ShipMvp.Domain.Shared.Constants;
using ShipMvp.Integration.SemanticKernel;
using System.Text.RegularExpressions;
using System.Reflection;
using Invoice.Api.Data;
using Invoices;
namespace Invoice.Api;

[Module]
[DependsOn<HostModule>]
[DependsOn<InvoiceDbModule>]
[DependsOn<InvoicesModule>]
public class InvoiceHostModule : IModule
{
    public void ConfigureServices(IServiceCollection services)
    {
       
    }


    public void Configure(IApplicationBuilder app, IHostEnvironment env)
    {

    }
}
