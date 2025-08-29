using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using ShipMvp.CLI;
using ShipMvp.Application;
using ShipMvp.Core;
using ShipMvp.Core.Modules;
using Invoice.Api.Data;

var builder = Host.CreateDefaultBuilder(args);

// Force Development environment for CLI
builder.UseEnvironment(Environments.Development);

// Configure logging
builder.ConfigureLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
    logging.SetMinimumLevel(LogLevel.Information);
});

// Configure services using the module system (similar to API)
builder.ConfigureServices((context, services) =>
{
     // Add data protection services required by GoogleAuthAppService
     services.AddDataProtection();
     
     services.AddModules(
            typeof(CLIModule),
            typeof(ApplicationModule),
            typeof(InvoiceDbModule));
});

var host = builder.Build();

// Get command resolver and execute command
var scope = host.Services.CreateScope();
var commandResolver = scope.ServiceProvider.GetRequiredService<ICommandResolver>();
var logger = scope.ServiceProvider.GetRequiredService<ILogger<InvoiceCLIProgram>>();

try
{
    if (args.Length == 0)
    {
        Console.WriteLine("Invoice CLI Tool");
        Console.WriteLine("================");
        Console.WriteLine();
        Console.WriteLine("Available commands:");
        Console.WriteLine("  seed-data           Seed initial application data");
        Console.WriteLine("  seed-integrations   Seed integration platforms");
        Console.WriteLine("  run-sql             Execute SQL query");
        Console.WriteLine("  help                Show this help message");
        Console.WriteLine();
        Environment.Exit(1);
    }

    var commandName = args[0];
    var commandArgs = args.Skip(1).ToArray();
    var success = await commandResolver.ExecuteCommandAsync(commandName, commandArgs);
    Environment.Exit(success ? 0 : 1);
}
catch (Exception ex)
{
    logger.LogError(ex, "An error occurred while executing the command");
    Console.WriteLine($"Error: {ex.Message}");
    Environment.Exit(1);
}

// Make Program class accessible for testing
public partial class InvoiceCLIProgram { }
