using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using ShipMvp.Application.Infrastructure.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var cfg = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var cs = cfg.GetConnectionString("Default")
               ?? "Host=localhost;Port=5432;Database=shipmvp;Username=postgres;Password=ShipMVPPass123!";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(cs, b => b.MigrationsAssembly("Invoice.Migrations"))
            .Options;

        return new AppDbContext(options);
    }
}