//using Microsoft.AspNetCore.Routing;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.DependencyInjection;
//using ShipMvp.Core.Modules;

//public sealed class InvoiceModule : IModule
//{
//    public void ConfigureServices(IServiceCollection services, IConfiguration config) { }

//    public void MapEndpoints(IEndpointRouteBuilder endpoints)
//    {
//        var g = endpoints.MapGroup("/api/billing/invoices");

//        g.MapGet("/", async (AppDbContext db) =>
//            await db.Set<Invoice>().OrderByDescending(x => x.CreatedAt).ToListAsync());

//        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
//            await db.Set<Invoice>().FindAsync(id) is { } inv ? Results.Ok(inv) : Results.NotFound());

//        g.MapPost("/", async (AppDbContext db, Invoice dto) =>
//        {
//            dto.Id = Guid.NewGuid();
//            dto.CreatedAt = DateTime.UtcNow;
//            db.Add(dto);
//            await db.SaveChangesAsync();
//            return Results.Created($"/api/billing/invoices/{dto.Id}", dto);
//        });
//    }
//}